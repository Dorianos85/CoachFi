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

function readDevDbPath() {
  const file = join(process.cwd(), ".env.local");
  if (!existsSync(file)) return "";
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("COACHFI_DEV_DB=")) continue;
    return trimmed.slice("COACHFI_DEV_DB=".length).trim();
  }
  return "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function profileFromState(state) {
  if (typeof state !== "string" || !state) return { name: "", tokens: "" };
  try {
    const parsed = JSON.parse(state);
    const name = typeof parsed?.profile?.name === "string" ? parsed.profile.name : "";
    const tokens = typeof parsed?.tokens === "number" ? String(parsed.tokens) : "";
    return { name, tokens };
  } catch {
    return { name: "", tokens: "" };
  }
}

function loadUsers() {
  const path = dbPath();
  if (!existsSync(path)) return { path, users: [], missing: true };
  const db = new DatabaseSync(path, { readOnly: true, enableForeignKeyConstraints: true });
  try {
    const users = db
      .prepare(
        `select a.privy_user_id, a.email, a.display_name, a.created_at, a.updated_at, s.state
         from accounts a
         left join account_state s on s.privy_user_id = a.privy_user_id
         order by a.updated_at desc`,
      )
      .all();
    return { path, users, missing: false };
  } finally {
    db.close();
  }
}

function render(result) {
  const rows = result.users
    .map((user) => {
      const profile = profileFromState(user.state);
      return `<tr>
        <td>${escapeHtml(user.privy_user_id)}</td>
        <td>${escapeHtml(user.email || "—")}</td>
        <td>${escapeHtml(user.display_name || profile.name || "—")}</td>
        <td>${escapeHtml(profile.tokens || "—")}</td>
        <td>${escapeHtml(user.created_at)}</td>
        <td>${escapeHtml(user.updated_at)}</td>
      </tr>`;
    })
    .join("");

  const body = result.missing
    ? `<p>No database file yet. Run <code>npm run db:init</code>.</p>`
    : result.users.length === 0
      ? `<p>No users saved yet. A row appears after a signed-in person is stored in the local account database.</p>`
      : `<table>
          <thead>
            <tr><th>Privy id</th><th>Email</th><th>Name</th><th>Tokens</th><th>Created</th><th>Updated</th></tr>
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
    main { max-width: 1100px; }
    h1 { margin-bottom: 0.25rem; }
    p, code { color: #526074; }
    table { width: 100%; border-collapse: collapse; background: white; margin-top: 1rem; }
    th, td { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 1px solid #e4e8f0; vertical-align: top; }
    th { font-size: 0.8rem; letter-spacing: 0.03em; text-transform: uppercase; color: #526074; }
    td:first-child { font-family: ui-monospace, monospace; font-size: 0.85rem; word-break: break-all; }
  </style>
</head>
<body>
  <main>
    <h1>Users</h1>
    <p>${result.users.length} saved · ${escapeHtml(result.path)}</p>
    ${body}
  </main>
</body>
</html>`;
}

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}`);
  if (url.pathname !== "/") {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  try {
    const html = render(loadUsers());
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
