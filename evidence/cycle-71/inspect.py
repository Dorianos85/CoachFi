"""Bounded, read-only archive inspection. No package import or filesystem extraction."""
import base64
import gzip
import hashlib
import io
import json
import os
import re
from pathlib import Path, PurePosixPath
import subprocess
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
TASK = ROOT / "evidence/cycle-71"
BASELINE = Path(r"C:\Users\doria\AppData\Local\Temp\coachfi-cycle38-package-MTT0Cq\postcss-selector-parser-6.1.4.tgz")
CANDIDATE = TASK / "artifacts/postcss-selector-parser-7.1.6.tgz"
RELEASE = TASK / "inspection-release.json"
RESULT = TASK / "inspection.json"
GIT = Path(r"C:\Users\doria\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe")
PYTHON = Path(r"C:\Users\doria\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe")
MAX_COMPRESSED, MAX_EXPANDED, MAX_ENTRY, MAX_ENTRIES = 512 * 1024, 8 * 1024 * 1024, 1024 * 1024, 512
PKG_FIELDS = ("name", "version", "main", "type", "types", "typings", "exports", "engines", "dependencies", "optionalDependencies", "peerDependencies")


def now():
    return datetime.now(timezone.utc).isoformat()


def require(ok):
    if not ok:
        raise ValueError("C71_INSPECTION_ADMISSION_REFUSED")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def file_pin(p):
    return digest(Path(p).read_bytes())


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result)
        result[key] = value
    return result


def strict_json(text):
    return json.loads(text, object_pairs_hook=unique_object,
                      parse_constant=lambda _: require(False))


def load(p):
    return strict_json(Path(p).read_text(encoding="utf-8"))


def safe_path(value, target=False):
    require(isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9_./*+\-]{1,256}", value) is not None)
    require(not value.startswith("/") and all(p not in ("..", "") for p in value.split("/")))
    require(not target or value.startswith("./"))
    return value


def safe_map(value, key_limit, count_limit):
    require(isinstance(value, dict) and len(value) <= count_limit)
    result = {}
    for key, entry in value.items():
        require(len(key) <= key_limit and re.fullmatch(r"(?:@[a-z0-9][a-z0-9._\-]*/)?[a-z0-9][a-z0-9._\-]*", key) is not None)
        require(isinstance(entry, str) and re.fullmatch(r"[0-9A-Za-z.*+<>=~^| \-]{1,128}", entry) is not None)
        result[key] = entry
    return result


def safe_exports(value, depth=0, budget=None):
    if budget is None:
        budget = [0]
    budget[0] += 1
    require(depth <= 8 and budget[0] <= 256)
    if value is None:
        return None
    if isinstance(value, str):
        return safe_path(value, True)
    if isinstance(value, list):
        require(len(value) <= 32)
        return [safe_exports(v, depth + 1, budget) for v in value]
    require(isinstance(value, dict) and len(value) <= 64)
    result = {}
    for key, entry in value.items():
        require(re.fullmatch(r"[A-Za-z0-9_.*\/\-]{1,128}", key) is not None)
        require(key not in ("__proto__", "constructor", "prototype"))
        result[key] = safe_exports(entry, depth + 1, budget)
    return result


def project_package(pkg, version):
    require(isinstance(pkg, dict) and pkg.get("name") == "postcss-selector-parser" and pkg.get("version") == version)
    result = {"name": pkg["name"], "version": pkg["version"]}
    for key in ("main", "types", "typings"):
        if key in pkg:
            result[key] = safe_path(pkg[key])
    if "type" in pkg:
        require(pkg["type"] in ("module", "commonjs"))
        result["type"] = pkg["type"]
    if "exports" in pkg:
        result["exports"] = safe_exports(pkg["exports"])
    for key in ("engines", "dependencies", "optionalDependencies", "peerDependencies"):
        if key in pkg:
            result[key] = safe_map(pkg[key], 64 if key == "engines" else 128, 16 if key == "engines" else 64)
    return result


def tar_string(raw):
    # Reject hidden data after a terminator instead of normalizing it away.
    head, sep, tail = raw.partition(b"\0")
    require(not sep or not any(tail))
    return head.decode("utf-8", errors="strict")


def tar_octal(raw):
    value = raw.strip(b" \0")
    require(bool(value) and re.fullmatch(b"[0-7]+", value) is not None)
    return int(value, 8)


def inspect_expanded(expanded, version):
    require(len(expanded) <= MAX_EXPANDED and len(expanded) % 512 == 0)
    entries, names, regular, pkg, offset = [], set(), {}, None, 0
    while offset + 512 <= len(expanded):
        header = expanded[offset:offset + 512]
        if not any(header):
            require(len(expanded) - offset >= 1024 and not any(expanded[offset:]))
            break
        require(len(entries) < MAX_ENTRIES)
        require(tar_octal(header[148:156]) == sum(header[:148]) + 8 * 32 + sum(header[156:]))
        # Admit physical USTAR headers directly. No GNU/PAX extension is consumed implicitly.
        require(header[257:263] == b"ustar\0" and header[263:265] == b"00")
        kind = header[156:157]
        require(kind in (b"0", b"\0", b"5") and not any(header[157:257]))
        name, prefix = tar_string(header[:100]), tar_string(header[345:500])
        name = prefix + "/" + name if prefix else name
        require(not name.startswith("/") and "\\" not in name and ":" not in name and "\0" not in name)
        require(name.startswith("package/") or name in ("package", "package/"))
        require(all(p not in ("", ".", "..") for p in name.rstrip("/").split("/")))
        require(kind == b"5" or not name.endswith("/"))
        canonical = str(PurePosixPath(name))
        require(canonical not in names)
        names.add(canonical)
        size = tar_octal(header[124:136])
        require(0 <= size <= MAX_ENTRY and (kind != b"5" or size == 0))
        start, end = offset + 512, offset + 512 + size
        padded_end = start + ((size + 511) // 512) * 512
        require(padded_end <= len(expanded) and not any(expanded[end:padded_end]))
        content = expanded[start:end]
        if kind != b"5":
            regular[canonical] = size
            if canonical == "package/package.json":
                require(size <= 64 * 1024)
                pkg = project_package(strict_json(content.decode("utf-8", errors="strict")), version)
        entries.append({"path": canonical, "type": "directory" if kind == b"5" else "file",
                        "bytes": size, "sha256": digest(content)})
        offset = padded_end
    else:
        require(False)
    require(pkg is not None)
    main = pkg.get("main")
    require(isinstance(main, str) and main in ("dist/index.js", "./dist/index.js"))
    main_path = "package/" + main.removeprefix("./")
    require(regular.get(main_path, 0) > 0 and regular.get("package/dist/util/unesc.js", 0) > 0)
    return {"packageProjection": pkg, "entries": entries, "mainPath": main_path,
            "mainPresent": True, "deepUnescPresent": True}


def known_task():
    for p in (ROOT / "evidence", TASK, TASK / "artifacts"):
        require(p.is_dir() and not p.is_symlink() and not p.is_junction())
        require(str(p.resolve()).casefold() == str(p.absolute()).casefold())


def boundary(before):
    rows = []
    for k in ("sourcePins", "inputPins", "preserve", "receipts", "sdkContractPins", "closurePins", "metadataPins"):
        rows.extend(before[k])
    rows.extend({"path": "node_modules/postcss-selector-parser/" + x["path"], "sha256": x["sha256"]}
                for x in before["runtime"]["files"])
    for consumer in before["runtime"]["consumers"]:
        require(consumer["name"] in ("tailwindcss", "postcss-nested"))
        rows.append({"path": "node_modules/" + consumer["name"] + "/package.json", "sha256": consumer["packageSHA256"]})
        rows.append({"path": "node_modules/" + consumer["parserEntry"], "sha256": consumer["entrySHA256"]})
    require(file_pin(ROOT / "package-lock.json") == before["runtime"]["lockSHA256"])
    for row in rows:
        require(file_pin(ROOT / row["path"]) == row["sha256"])
    for row in before["deletedSources"]:
        require(not (ROOT / row["path"]).exists())
    env = {k: os.environ[k] for k in ("SystemRoot", "WINDIR", "PATH", "TEMP", "TMP") if k in os.environ}
    env.update({"GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": os.devnull})
    def git(*args):
        return subprocess.check_output([str(GIT), *args], cwd=ROOT, env=env, timeout=10)
    actual_git = {"branch": git("branch", "--show-current").decode().strip(),
                  "head": git("rev-parse", "HEAD").decode().strip(),
                  "indexEntriesSHA256": digest(git("ls-files", "--stage", "-z"))}
    require(actual_git == before["gitBoundary"])
    return {"sourcePaths": len(before["sourcePins"]), "inputs": len(before["inputPins"]),
            "preserve": len(before["preserve"]), "receipts": len(before["receipts"]),
            "sdk": len(before["sdkContractPins"]), "drift": 0, "git": actual_git}


def inspect_archive(row):
    p = Path(row["path"])
    require(p.is_file() and not p.is_symlink() and not p.is_junction())
    require(p.stat().st_size <= MAX_COMPRESSED)
    compressed = p.read_bytes()
    require(len(compressed) <= MAX_COMPRESSED and digest(compressed) == row["sha256"])
    sri = "sha512-" + base64.b64encode(hashlib.sha512(compressed).digest()).decode("ascii")
    require(sri == row["integrity"])
    with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as stream:
        expanded = stream.read(MAX_EXPANDED + 1)
    require(len(expanded) <= MAX_EXPANDED)
    structure = inspect_expanded(expanded, row["version"])
    return {"label": row["label"], "archive": {"path": str(p), "sha256": digest(compressed), "integrity": sri,
            "compressedBytes": len(compressed), "expandedBytes": len(expanded)}, **structure,
            "filesystemExtraction": False, "packageCodeExecuted": False}


def main():
    known_task()
    require(not RESULT.exists() and not RESULT.is_symlink())
    release_bytes = RELEASE.read_bytes()
    release = strict_json(release_bytes.decode("utf-8"))
    require(release["status"] == "GO_BOUNDED_READONLY_C71_ARCHIVE_INSPECTION")
    require(release["tool"]["path"] == "evidence/cycle-71/inspect.py")
    require(file_pin(__file__) == release["tool"]["sha256"])
    require(Path(sys.executable).resolve() == PYTHON.resolve())
    require(sys.version.split()[0] == "3.12.14")
    require(release["python"]["path"] == str(PYTHON))
    require(file_pin(PYTHON) == release["python"]["sha256"])
    required_pins = {"evidence/cycle-71/before.json", "evidence/cycle-71/inspection-plan-v3.json",
                     "evidence/cycle-71/candidate-metadata.json", "evidence/cycle-71/acquisition-run.json",
                     "evidence/cycle-38/runtime-tarball-inspection.json"}
    require(required_pins <= {r["path"] for r in release["pins"]})
    for row in release["pins"]:
        require(file_pin(ROOT / row["path"]) == row["sha256"])
    require(len(release["archives"]) == 2)
    require(Path(release["archives"][0]["path"]) == BASELINE and release["archives"][0]["version"] == "6.1.4")
    require(Path(release["archives"][1]["path"]) == CANDIDATE and release["archives"][1]["version"] == "7.1.6")
    descriptor = load(ROOT / "evidence/cycle-38/runtime-tarball-inspection.json")
    metadata_envelope = load(TASK / "candidate-metadata.json")
    metadata = metadata_envelope["projection"]
    acquisition = load(TASK / "acquisition-run.json")
    require(acquisition["status"] == "CANDIDATE_METADATA_AND_ARCHIVE_VERIFIED_NO_INSTALL")
    observed = acquisition["observation"]
    baseline_row, candidate_row = release["archives"]
    require(descriptor["archive"] == str(BASELINE) and descriptor["integrity"] == baseline_row["integrity"])
    require(descriptor["packageVersion"] == baseline_row["version"] and descriptor["bytes"] == BASELINE.stat().st_size)
    require(baseline_row["sha256"] == "d0e20cd70b1be34f5f45d256986e6a372c35cc6a4643046b0de35035cfc61d66")
    require(metadata_envelope["source"] == "https://registry.npmjs.org/postcss-selector-parser/7.1.6")
    require(metadata["name"] == "postcss-selector-parser" and metadata["version"] == candidate_row["version"])
    require(metadata["dist"]["tarball"] == "https://registry.npmjs.org/postcss-selector-parser/-/postcss-selector-parser-7.1.6.tgz")
    require(metadata["dist"]["integrity"] == candidate_row["integrity"] == observed["archive"]["integrity"])
    require(candidate_row["sha256"] == observed["archive"]["sha256"])
    require(observed["archive"]["path"] == "evidence/cycle-71/artifacts/postcss-selector-parser-7.1.6.tgz")
    require(observed["archive"]["bytes"] == CANDIDATE.stat().st_size)
    require(observed["metadata"]["path"] == "evidence/cycle-71/candidate-metadata.json")
    require(observed["metadata"]["sha256"] == file_pin(TASK / "candidate-metadata.json"))
    require(observed["metadata"]["integrity"] == candidate_row["integrity"])
    before = load(ROOT / "evidence/cycle-71/before.json")
    record = {"cycle": "C71", "startedAt": now(), "status": "FAIL_READONLY_INSPECTION", "releaseSHA256": digest(release_bytes),
              "python": sys.version.split()[0], "isolated": bool(sys.flags.isolated), "noSite": bool(sys.flags.no_site),
              "inspections": [], "newApplicationTests": 0, "networkCalls": 0, "packageCodeExecutions": 0}
    try:
        require(sys.flags.isolated and sys.flags.no_site)
        record["before"] = boundary(before)
        for row in release["archives"]:
            record["inspections"].append(inspect_archive(row))
        descriptor_entries = {(x["path"], x["size"], x["type"].lower()) for x in descriptor["entries"]}
        observed_entries = {(x["path"], x["bytes"], x["type"]) for x in record["inspections"][0]["entries"]}
        require(descriptor_entries == observed_entries)
        candidate_pkg = record["inspections"][1]["packageProjection"]
        for k in PKG_FIELDS:
            if k in metadata:
                require(candidate_pkg.get(k) == metadata[k])
        baseline_files = {x["path"].removeprefix("package/"): x["sha256"] for x in record["inspections"][0]["entries"] if x["type"] == "file"}
        runtime_files = {x["path"]: x["sha256"] for x in before["runtime"]["files"]}
        record["publicBaselineVersusInstalledPinned"] = {"publicFiles": len(baseline_files), "installedPinnedFiles": len(runtime_files),
            "differences": [{"path": k, "publicSHA256": baseline_files.get(k), "installedSHA256": runtime_files.get(k)}
                            for k in sorted(baseline_files.keys() | runtime_files.keys()) if baseline_files.get(k) != runtime_files.get(k)]}
        record["status"] = "PASS_BOUNDED_READONLY_PACKAGE_STRUCTURE_ONLY"
    except Exception as error:
        record["errorClass"] = type(error).__name__
    try:
        record["after"] = boundary(before)
        require(digest(RELEASE.read_bytes()) == digest(release_bytes))
        require(file_pin(__file__) == release["tool"]["sha256"])
        require(file_pin(PYTHON) == release["python"]["sha256"])
        for row in release["pins"]:
            require(file_pin(ROOT / row["path"]) == row["sha256"])
    except Exception as error:
        record["status"] = "FAIL_READONLY_INSPECTION_BOUNDARY"
        record["boundaryErrorClass"] = type(error).__name__
    record["completedAt"] = now()
    known_task()
    with RESULT.open("x", encoding="utf-8", newline="\n") as output:
        json.dump(record, output, indent=2, ensure_ascii=True)
        output.write("\n")
    print(json.dumps({"status": record["status"], "resultSHA256": file_pin(RESULT), "archivesObserved": len(record["inspections"])}))
    if not record["status"].startswith("PASS_"):
        sys.exit(1)


if __name__ == "__main__":
    main()
