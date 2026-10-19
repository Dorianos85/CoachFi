import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { resolve, relative, isAbsolute, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const GENERATED = /(^|\/)(?:\.codex-screenshots|\.codex-logs|\.codex-temp|\.codex-traces|chrome-profile[^/]*|browser-profile[^/]*|playwright-profile[^/]*|\.tmp|tmp|temp|trace|traces|test-results|playwright-report)(\/|$)|^supabase\/\.temp\//i;
const PROFILE_FILE = /^(?:Cookies|Login Data|Web Data|History|Local State|Preferences|Secure Preferences)(?:-journal|-wal|-shm)?$/i;
const SECRET_FILE = /^(?:\.mcp\.json|credentials(?:\.[^/]+)?|service[-_]account(?:\.[^/]+)?|id_(?:rsa|ed25519)(?:\.pub)?|.*\.(?:pem|key|p12|pfx))$/i;
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".sql", ".yaml", ".yml", ".toml", ".env"]);
const SECRET_RULES = [
  ["provider-token", /\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,}|AKIA[A-Z0-9]{16})\b/],
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["literal-credential", /\b(?:api[_-]?key|client[_-]?secret|service[_-]?role[_-]?key|access[_-]?token)\b["']?\s*[:=]\s*["']([^"'\r\n]{12,})["']/i],
  ["literal-password", /(?:\b(?:const|let|var)\s+password|\b[A-Z_]+_PASSWORD)\s*=\s*["']([^"'\r\n]{12,})["']/],
];

/** Paths only: this function never reads profile or credential contents. */
export function checkTrackedPaths(paths) {
  const findings = [];
  for (const raw of paths) {
    const file = raw.replaceAll("\\", "/");
    const name = basename(file);
    if (isAbsolute(file) || file.split("/").includes("..")) {
      findings.push({ rule: "unsafe-path", file, line: 0 });
    } else if (GENERATED.test(file) || PROFILE_FILE.test(name)) {
      findings.push({ rule: "generated-profile-or-trace", file, line: 0 });
    } else if ((name === ".env" || name.startsWith(".env.")) && name !== ".env.example") {
      findings.push({ rule: "secret-env-file", file, line: 0 });
    } else if (SECRET_FILE.test(name)) {
      findings.push({ rule: "credential-file", file, line: 0 });
    }
  }
  return findings;
}

/** Findings deliberately contain no match, snippet or credential value. */
export function scanPlaintext(file, content) {
  const findings = [];
  if (content.includes("\0")) return findings;
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    for (const [rule, pattern] of SECRET_RULES) {
      const match = pattern.exec(lines[index]);
      if (!match) continue;
      if (rule.startsWith("literal-") && /^(?:YOUR[_ -]|EXAMPLE[_ -]|PLACEHOLDER|REPLACE[_ -]|CHANGEME|TEST[_ -]|FIXTURE[_ -])|^\$\{|^process\.env\./i.test(match[1])) continue;
      findings.push({ rule, file, line: index + 1 });
    }
  }
  return findings;
}

export function runCheck({ cwd = process.cwd(), scanSecrets = false } = {}) {
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const paths = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).split("\0").filter(Boolean);
  const findings = checkTrackedPaths(paths);
  const forbidden = new Set(findings.map(({ file }) => file));
  let scannedTextFiles = 0;
  let skippedFiles = 0;
  if (scanSecrets) {
    for (const file of paths) {
      // Never open forbidden paths, including every browser profile file.
      if (forbidden.has(file) || (!TEXT_EXTENSIONS.has(extname(file)) && basename(file) !== ".env.example")) continue;
      const target = resolve(root, file);
      const inside = relative(root, target);
      if (inside.startsWith("..") || isAbsolute(inside)) continue;
      try {
        const stat = lstatSync(target);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024) { skippedFiles += 1; continue; }
        const content = readFileSync(target, "utf8");
        scannedTextFiles += 1;
        findings.push(...scanPlaintext(file, content));
      } catch {
        skippedFiles += 1;
        findings.push({ rule: "tracked-file-unreadable", file, line: 0 });
      }
    }
  }
  return { ok: findings.length === 0, trackedFiles: paths.length, scannedTextFiles, skippedFiles, findings };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => !["--scan-secrets", "--json"].includes(arg))) {
    process.stderr.write("Usage: node scripts/check-repo-hygiene.mjs [--scan-secrets] [--json]\n");
    process.exitCode = 2;
  } else {
    try {
      const result = runCheck({ scanSecrets: args.includes("--scan-secrets") });
      if (args.includes("--json")) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else {
        for (const { rule, file, line } of result.findings) process.stdout.write(`${rule}\t${file}\t${line}\n`);
        process.stdout.write(`repo-hygiene ${result.ok ? "PASS" : "FAIL"}; tracked=${result.trackedFiles}; text-scanned=${result.scannedTextFiles}; skipped=${result.skippedFiles}\n`);
      }
      process.exitCode = result.ok ? 0 : 1;
    } catch {
      // Do not echo Git stderr or exception content which could contain data.
      process.stderr.write("repo-hygiene could not inspect tracked metadata.\n");
      process.exitCode = 2;
    }
  }
}
