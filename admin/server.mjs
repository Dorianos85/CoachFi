import { CdpClient } from "@coinbase/cdp-sdk";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { isAbsolute, join } from "node:path";

const HOST = "127.0.0.1";
const PORT = Number(process.env.ADMIN_PORT) || 3460;

function dbPath() {
  const configured = process.env.COACHFI_DEV_DB?.trim() || readDevDbPath();
  if (!configured) return join(process.cwd(), "data", "coachfi.dev.sqlite");
  return isAbsolute(configured) ? configured : join(process.cwd(), configured);
}

function readEnvValue(name) {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) return fromProcess;
  const file = join(process.cwd(), ".env.local");
  if (!existsSync(file)) return "";
  const prefix = `${name}=`;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(prefix)) continue;
    return trimmed.slice(prefix.length).trim();
  }
  return "";
}

function readDevDbPath() {
  return readEnvValue("COACHFI_DEV_DB");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const AVATAR_EMOJI = { warrior: "⚔️", explorer: "🧭", builder: "🔨" };

function profileFromState(state) {
  const empty = { name: "", goal: "", tokens: "", avatar: "" };
  if (typeof state !== "string" || !state) return empty;
  try {
    const parsed = JSON.parse(state);
    const name = typeof parsed?.profile?.name === "string" ? parsed.profile.name : "";
    const goal = typeof parsed?.profile?.goal === "string" ? parsed.profile.goal : "";
    const tokens = typeof parsed?.tokens === "number" ? String(parsed.tokens) : "";
    const style = parsed?.avatar?.style;
    const avatar = typeof style === "string" ? `${AVATAR_EMOJI[style] || ""} ${style}`.trim() : "";
    return { name, goal, tokens, avatar };
  } catch {
    return empty;
  }
}

const IDENTITY_COLUMNS = [
  "solana_address",
  "evm_address",
  "auth_provider",
  "cdp_created_at",
  "last_authenticated_at",
  "cdp_profile",
];

function ensureIdentityColumns(db) {
  const names = new Set(db.prepare("pragma table_info(accounts)").all().map((column) => column.name));
  if (!names.has("cdp_user_id")) return;
  for (const name of IDENTITY_COLUMNS) {
    if (!names.has(name)) db.exec(`alter table accounts add column ${name} text`);
  }
}

function identityFromCdpUser(user) {
  const methods = (user.authenticationMethods ?? []).map((method) => {
    const profile = methodProfile(method);
    return {
      type: profile.provider,
      email: profile.email || undefined,
      name: profile.name || undefined,
      sub: typeof method.sub === "string" ? method.sub : undefined,
      username: typeof method.username === "string" ? method.username : undefined,
    };
  });
  const email = methods.map((method) => method.email).find(Boolean) || null;
  const name = methods.map((method) => method.name).find(Boolean) || null;
  const authProvider = methods.map((method) => method.type).filter(Boolean).join(", ") || null;
  const solanaAddresses = [...new Set(user.solanaAccounts ?? [])];
  const evmAddresses = [...new Set(user.evmAccounts ?? [])];
  return {
    email,
    name,
    solanaAddress: solanaAddresses[0] || null,
    evmAddress: evmAddresses[0] || null,
    authProvider,
    cdpCreatedAt: user.createdAt || null,
    lastAuthenticatedAt: user.lastAuthenticatedAt || null,
    profileJson: JSON.stringify({
      email,
      name,
      authProvider,
      methods,
      solanaAddresses,
      evmAddresses,
      evmSmartAddresses: user.evmSmartAccounts ?? [],
      createdAt: user.createdAt || null,
      lastAuthenticatedAt: user.lastAuthenticatedAt || null,
    }),
  };
}

function saveCdpIdentities(users) {
  const path = dbPath();
  if (!existsSync(path)) return;
  const db = new DatabaseSync(path, { enableForeignKeyConstraints: true });
  try {
    ensureIdentityColumns(db);
    if (users.length === 0) return;
    const statement = db.prepare(
      `insert into accounts (
         cdp_user_id, email, display_name, solana_address, evm_address, auth_provider,
         cdp_created_at, last_authenticated_at, cdp_profile
       ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
       on conflict(cdp_user_id) do update set
         email = coalesce(excluded.email, accounts.email),
         display_name = coalesce(nullif(accounts.display_name, ''), excluded.display_name),
         solana_address = coalesce(excluded.solana_address, accounts.solana_address),
         evm_address = coalesce(excluded.evm_address, accounts.evm_address),
         auth_provider = coalesce(excluded.auth_provider, accounts.auth_provider),
         cdp_created_at = coalesce(excluded.cdp_created_at, accounts.cdp_created_at),
         last_authenticated_at = coalesce(excluded.last_authenticated_at, accounts.last_authenticated_at),
         cdp_profile = excluded.cdp_profile`,
    );
    db.exec("begin");
    for (const user of users) {
      if (!user.userId) continue;
      const identity = identityFromCdpUser(user);
      statement.run(
        user.userId,
        identity.email,
        identity.name,
        identity.solanaAddress,
        identity.evmAddress,
        identity.authProvider,
        identity.cdpCreatedAt,
        identity.lastAuthenticatedAt,
        identity.profileJson,
      );
    }
    db.exec("commit");
  } catch (error) {
    try {
      db.exec("rollback");
    } catch {
      // The write may have failed before the transaction started.
    }
    throw error;
  } finally {
    db.close();
  }
}

function ensureLocalTables(path) {
  const db = new DatabaseSync(path, { enableForeignKeyConstraints: true });
  try {
    db.exec(readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8"));
    const tables = new Set(db.prepare("select name from sqlite_master where type = 'table'").all().map((table) => table.name));
    if (!tables.has("certificates")) return;
    const columns = new Set(db.prepare("pragma table_info(certificates)").all().map((column) => column.name));
    if (!columns.has("minted")) db.exec("alter table certificates add column minted integer not null default 0");
    db.exec("update certificates set minted = 1 where status = 'owned' and ifnull(minted, 0) = 0");
    db.exec(`
      insert into progress (cdp_user_id, srs, learn_manual, tokens, streak)
      select cdp_user_id,
             json_extract(state, '$.srs'),
             json_extract(state, '$.learnManual'),
             json_extract(state, '$.tokens'),
             json_extract(state, '$.streak')
      from account_state
      where cdp_user_id not in (select cdp_user_id from progress)
        and (
          json_extract(state, '$.srs') is not null
          or json_extract(state, '$.learnManual') is not null
          or json_extract(state, '$.tokens') is not null
          or json_extract(state, '$.streak') is not null
        )
    `);
  } finally {
    db.close();
  }
}

function loadUsers() {
  const path = dbPath();
  if (!existsSync(path)) return { path, users: [], certificates: [], missing: true };
  ensureLocalTables(path);
  const db = new DatabaseSync(path, { readOnly: true, enableForeignKeyConstraints: true });
  try {
    const users = db
      .prepare(
        `select a.cdp_user_id, a.email, a.display_name, a.solana_address, a.evm_address, a.auth_provider,
                a.cdp_created_at, a.last_authenticated_at, a.created_at, a.updated_at, s.state,
                p.tokens as progress_tokens, p.srs as progress_srs, p.learn_manual as progress_manual, p.streak as progress_streak
         from accounts a
         left join account_state s on s.cdp_user_id = a.cdp_user_id
         left join progress p on p.cdp_user_id = a.cdp_user_id
         order by a.updated_at desc`,
      )
      .all();
    const certificates = db
      .prepare(
        `select cdp_user_id, certificate_id, minted, asset_address, status
         from certificates
         order by certificate_id`,
      )
      .all();
    return { path, users, certificates, missing: false };
  } finally {
    db.close();
  }
}

function safeHttpUrl(value) {
  if (typeof value !== "string" || !value) return "";
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    return "";
  }
  return "";
}

function methodProfile(method) {
  const empty = { provider: "", email: "", name: "", photo: "" };
  if (!method || typeof method !== "object") return empty;
  const photo = safeHttpUrl(method.photoUrl || method.picture || method.image);
  if (method.type === "email") return { provider: "email", email: method.email || "", name: "", photo };
  if (method.type === "sms") return { provider: "sms", email: "", name: method.phoneNumber || "", photo };
  if (method.type === "jwt") return { provider: "jwt", email: "", name: method.sub || "", photo };
  if (method.type === "siwe") return { provider: "siwe", email: "", name: method.address || "", photo };
  if (method.type === "telegram") {
    const name = [method.firstName, method.lastName].filter(Boolean).join(" ") || method.username || "";
    return { provider: "telegram", email: "", name, photo: safeHttpUrl(method.photoUrl) };
  }
  return {
    provider: method.type || "",
    email: method.email || "",
    name: method.name || method.username || "",
    photo,
  };
}

async function loadCdpUsers() {
  const apiKeyId = readEnvValue("CDP_API_KEY_ID");
  const apiKeySecret = readEnvValue("CDP_API_KEY_SECRET");
  if (!apiKeyId || !apiKeySecret) return { users: [], error: "CDP API key is not set in .env.local." };
  const cdp = new CdpClient({ apiKeyId, apiKeySecret });
  const users = [];
  let pageToken = "";
  for (let page = 0; page < 10; page += 1) {
    const result = await cdp.endUser.listEndUsers({
      pageSize: 100,
      sort: ["createdAt=desc"],
      ...(pageToken ? { pageToken } : {}),
    });
    users.push(...(result.endUsers ?? []));
    pageToken = result.nextPageToken || "";
    if (!pageToken) break;
  }
  return { users, error: "" };
}

function renderCdp(cdp, savedUsers) {
  if (cdp.error) return `<p>${escapeHtml(cdp.error)}</p>`;
  if (cdp.users.length === 0) return `<p>No CDP users in this project.</p>`;
  const saved = new Map(savedUsers.map((user) => [user.cdp_user_id, user]));
  const rows = cdp.users
    .map((user) => {
      const methods = (user.authenticationMethods ?? []).map(methodProfile);
      const local = saved.get(user.userId);
      const profile = profileFromState(local?.state);
      const name = methods.map((method) => method.name).find(Boolean) || local?.display_name || profile.name;
      const email = methods.map((method) => method.email).find(Boolean) || local?.email || "";
      const photo = methods.map((method) => method.photo).find(Boolean);
      const provider = methods.map((method) => method.provider).filter(Boolean).join(", ");
      const avatar = photo
        ? `<img class="avatar" src="${escapeHtml(photo)}" alt="">`
        : escapeHtml(profile.avatar || "—");
      return `<tr>
        <td>${avatar}</td>
        <td>${escapeHtml(name || "—")}</td>
        <td>${escapeHtml(email || "—")}</td>
        <td>${escapeHtml(profile.goal || "—")}</td>
        <td>${escapeHtml(provider || "—")}</td>
        <td class="mono">${escapeHtml(user.solanaAccounts?.[0] || "—")}</td>
        <td class="mono">${escapeHtml(user.userId)}</td>
        <td>${escapeHtml(user.lastAuthenticatedAt || user.createdAt || "—")}</td>
      </tr>`;
    })
    .join("");
  return `<table>
    <thead>
      <tr><th></th><th>Name</th><th>Email</th><th>Goal</th><th>Login</th><th>Solana</th><th>CDP user id</th><th>Last sign-in</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function progressSummary(user) {
  const manual = parseJson(user.progress_manual);
  const stages = manual && typeof manual === "object" ? Object.keys(manual).length : 0;
  const cards = parseJson(user.progress_srs);
  const answered = Array.isArray(cards) ? cards.length : 0;
  const tokens = user.progress_tokens ?? profileFromState(user.state).tokens;
  const parts = [];
  if (tokens !== "" && tokens != null) parts.push(`${tokens} tokens`);
  if (answered) parts.push(`${answered} quiz cards`);
  if (stages) parts.push(`${stages} stages`);
  return parts.join(", ");
}

function parseJson(value) {
  if (typeof value !== "string" || !value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function render(result, cdp) {
  const certificates = result.certificates ?? [];
  const rows = result.users
    .map((user) => {
      const profile = profileFromState(user.state);
      const minted = certificates
        .filter((row) => row.cdp_user_id === user.cdp_user_id)
        .map((row) => `${row.certificate_id}${row.minted ? " minted" : ""} ${row.asset_address || ""}`.trim());
      return `<tr>
        <td class="mono">${escapeHtml(user.cdp_user_id)}</td>
        <td>${escapeHtml(user.email || "—")}</td>
        <td>${escapeHtml(user.display_name || profile.name || "—")}</td>
        <td class="mono">${escapeHtml(user.solana_address || "—")}</td>
        <td class="mono">${escapeHtml(user.evm_address || "—")}</td>
        <td>${escapeHtml(user.auth_provider || "—")}</td>
        <td>${escapeHtml(profile.goal || "—")}</td>
        <td>${escapeHtml(progressSummary(user) || "—")}</td>
        <td class="mono">${escapeHtml(minted.join(", ") || "—")}</td>
        <td>${escapeHtml(user.last_authenticated_at || "—")}</td>
      </tr>`;
    })
    .join("");

  const body = result.missing
    ? `<p>No database file yet. Run <code>npm run db:init</code>.</p>`
    : result.users.length === 0
      ? `<p>No users saved yet. A row appears after a signed-in person is stored in the local account database.</p>`
      : `<table>
          <thead>
            <tr><th>User id</th><th>Email</th><th>Name</th><th>Solana</th><th>EVM</th><th>Login</th><th>Goal</th><th>Progress</th><th>Certificates</th><th>Last sign-in</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Coach FI users</title>
  <style>
    body { margin: 2rem; font: 16px/1.4 system-ui, sans-serif; color: #1c2430; background: #f6f7fb; }
    main { max-width: 1400px; }
    h1, h2 { margin-bottom: 0.25rem; }
    h2 { margin-top: 2rem; }
    p, code { color: #526074; }
    table { width: 100%; border-collapse: collapse; background: white; margin-top: 1rem; }
    th, td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid #e4e8f0; vertical-align: top; }
    th { font-size: 0.8rem; letter-spacing: 0.03em; text-transform: uppercase; color: #526074; }
    td.mono { font-family: ui-monospace, monospace; font-size: 0.85rem; word-break: break-all; }
    img.avatar { width: 36px; height: 36px; border-radius: 999px; object-fit: cover; display: block; }
  </style>
</head>
<body>
  <main>
    <h1>CDP users</h1>
    <p>${cdp.users.length} in the Coinbase project</p>
    ${renderCdp(cdp, result.users)}
    <h2>Saved in this app</h2>
    <p>${result.users.length} saved · ${escapeHtml(result.path)}</p>
    ${body}
  </main>
</body>
</html>`;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}`);
  if (url.pathname !== "/") {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  try {
    const cdp = await loadCdpUsers();
    saveCdpIdentities(cdp.error ? [] : cdp.users);
    const local = loadUsers();
    const html = render(local, cdp);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(html);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read users";
    console.error("[admin]", message);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Admin dashboard http://${HOST}:${PORT}`);
});
