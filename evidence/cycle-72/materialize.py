"""C72 fixed public candidate materialization; never imports package code."""
import base64
import gzip
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import sys
from datetime import datetime, timezone

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
TASK = ROOT / "evidence/cycle-72"
RELEASE = TASK / "materialize-release.json"
OUTPUT = TASK / "materialization.json"
QUARANTINE = TASK / "quarantine"
PACKAGE = QUARANTINE / "postcss-selector-parser"
ARCHIVE = ROOT / "evidence/cycle-71/artifacts/postcss-selector-parser-7.1.6.tgz"
READER = ROOT / "evidence/cycle-71/inspect.py"
INSPECTION = ROOT / "evidence/cycle-71/inspection.json"
READER_SHA = "420cb80beb97a0ba46a2921b751296bc9059b6ac8e94be3176d278037383148b"
INSPECTION_SHA = "7b5462111b70c07a4c736f9658981ed341a79ea7711ab5fd92bda14d51410a37"
DIRECTORIES = (QUARANTINE, PACKAGE, PACKAGE / "dist", PACKAGE / "dist/selectors", PACKAGE / "dist/util")
FILES = (
    "LICENSE-MIT", "dist/selectors/attribute.js", "dist/selectors/className.js",
    "dist/selectors/combinator.js", "dist/selectors/comment.js", "dist/selectors/constructors.js",
    "dist/selectors/container.js", "dist/util/ensureObject.js", "dist/util/getProp.js",
    "dist/selectors/guards.js", "dist/selectors/id.js", "dist/index.js", "dist/selectors/index.js",
    "dist/util/index.js", "dist/util/maxNestingDepth.js", "dist/selectors/namespace.js",
    "dist/selectors/nesting.js", "dist/selectors/node.js", "dist/parser.js", "dist/processor.js",
    "dist/selectors/pseudo.js", "dist/selectors/root.js", "dist/selectors/selector.js",
    "dist/sortAscending.js", "dist/selectors/string.js", "dist/util/stripComments.js",
    "dist/selectors/tag.js", "dist/tokenize.js", "dist/tokenTypes.js", "dist/selectors/types.js",
    "dist/util/unesc.js", "dist/selectors/universal.js", "package.json", "API.md", "CHANGELOG.md",
    "README.md", "postcss-selector-parser.d.ts",
)


def require(ok):
    if not ok:
        raise ValueError("C72_MATERIALIZATION_REFUSED")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def pin(p):
    return sha(Path(p).read_bytes())


def now():
    return datetime.now(timezone.utc).isoformat()


def unique(pairs):
    value = {}
    for k, v in pairs:
        require(k not in value)
        value[k] = v
    return value


def load(p):
    return json.loads(Path(p).read_text(encoding="utf-8"), object_pairs_hook=unique,
                      parse_constant=lambda _: require(False))


def topology():
    for p in (ROOT / "evidence", TASK):
        require(p.is_dir() and not p.is_symlink() and not p.is_junction())
        require(str(p.resolve()).casefold() == str(p.absolute()).casefold())


def main():
    require(len(sys.argv) == 1 and sys.flags.isolated and sys.flags.no_site)
    topology()
    require(not OUTPUT.exists() and not OUTPUT.is_symlink())
    require(not QUARANTINE.exists() and not QUARANTINE.is_symlink() and not QUARANTINE.is_junction())
    release_bytes = RELEASE.read_bytes()
    release = load(RELEASE)
    require(release["status"] == "GO_C72_MATERIALIZE_VERIFIED_CANDIDATE_ONLY")
    require(release["tool"]["path"] == "evidence/cycle-72/materialize.py")
    require(pin(__file__) == release["tool"]["sha256"])
    require(release["before"]["path"] == "evidence/cycle-72/before-v2.json")
    require(release["plan"]["path"] == "evidence/cycle-72/tool-plan.json")
    require(Path(sys.executable).resolve() == Path(release["python"]["path"]).resolve())
    require(sys.version.split()[0] == "3.12.14" and pin(sys.executable) == release["python"]["sha256"])
    captured = [release["tool"], release["before"], release["plan"], *release["pins"]]
    required = {"evidence/cycle-71/inspect.py", "evidence/cycle-71/inspection.json",
                "evidence/cycle-71/artifacts/postcss-selector-parser-7.1.6.tgz"}
    require(required <= {r["path"] for r in captured})
    for row in captured:
        require(pin(ROOT / row["path"]) == row["sha256"])
    require(pin(READER) == READER_SHA and pin(INSPECTION) == INSPECTION_SHA)
    # Import only the independently frozen stdlib raw reader definitions. __main__ never runs.
    spec = importlib.util.spec_from_file_location("c72_frozen_raw_reader", READER)
    reader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(reader)
    before = load(ROOT / release["before"]["path"])
    result = {"cycle": "C72", "startedAt": now(), "status": "FAIL_MATERIALIZATION", "releaseSHA256": sha(release_bytes),
              "files": [], "networkCalls": 0, "packageCodeExecutions": 0, "packageImports": 0,
              "quarantine": "evidence/cycle-72/quarantine/postcss-selector-parser"}
    try:
        result["before"] = reader.boundary(before)
        for row in before["consumerRuntimePins"]:
            require(pin(ROOT / row["path"]) == row["sha256"])
        accepted = load(INSPECTION)
        require(accepted["status"] == "PASS_BOUNDED_READONLY_PACKAGE_STRUCTURE_ONLY" and len(accepted["inspections"]) == 2)
        candidate = accepted["inspections"][1]
        require(candidate["label"] == "candidate" and candidate["packageProjection"]["version"] == "7.1.6")
        require(Path(candidate["archive"]["path"]) == ARCHIVE)
        require(ARCHIVE.is_file() and not ARCHIVE.is_symlink() and not ARCHIVE.is_junction())
        require(ARCHIVE.stat().st_size <= reader.MAX_COMPRESSED)
        compressed = ARCHIVE.read_bytes()
        require(len(compressed) == candidate["archive"]["compressedBytes"] and sha(compressed) == candidate["archive"]["sha256"])
        require("sha512-" + base64.b64encode(hashlib.sha512(compressed).digest()).decode("ascii") == candidate["archive"]["integrity"])
        with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as stream:
            expanded = stream.read(reader.MAX_EXPANDED + 1)
        require(len(expanded) == candidate["archive"]["expandedBytes"] and len(expanded) <= reader.MAX_EXPANDED)
        checked = reader.inspect_expanded(expanded, "7.1.6")
        require(checked["entries"] == candidate["entries"] and checked["packageProjection"] == candidate["packageProjection"])
        require(len(checked["entries"]) == 37 and all(e["type"] == "file" for e in checked["entries"]))
        require([e["path"] for e in checked["entries"]] == ["package/" + f for f in FILES])
        # A second raw walk only copies already admitted byte slices into the fixed literal file set.
        contents, offset = {}, 0
        for entry, fixed in zip(checked["entries"], FILES):
            header = expanded[offset:offset + 512]
            size = reader.tar_octal(header[124:136])
            require(size == entry["bytes"])
            content = expanded[offset + 512:offset + 512 + size]
            require(sha(content) == entry["sha256"])
            contents[fixed] = content
            offset += 512 + ((size + 511) // 512) * 512
        topology()
        require(sha(RELEASE.read_bytes()) == sha(release_bytes))
        for row in captured:
            require(pin(ROOT / row["path"]) == row["sha256"])
        for directory in DIRECTORIES:
            directory.mkdir(exist_ok=False)
            require(not directory.is_symlink() and not directory.is_junction())
            require(str(directory.resolve()).casefold() == str(directory.absolute()).casefold())
        for fixed, entry in zip(FILES, checked["entries"]):
            target = PACKAGE / fixed
            require(target.parent in DIRECTORIES and PACKAGE.resolve() in target.resolve().parents)
            with target.open("xb") as output:
                output.write(contents[fixed])
            require(pin(target) == entry["sha256"] and target.stat().st_size == entry["bytes"])
            result["files"].append({"path": target.relative_to(ROOT).as_posix(), "sha256": entry["sha256"], "bytes": entry["bytes"]})
        result["packageProjection"] = checked["packageProjection"]
        result["archive"] = candidate["archive"]
        result["status"] = "PASS_VERIFIED_FIXED37_MATERIALIZED_NO_PACKAGE_EXECUTION"
    except Exception as error:
        result["errorClass"] = type(error).__name__
    try:
        result["after"] = reader.boundary(before)
        for row in before["consumerRuntimePins"]:
            require(pin(ROOT / row["path"]) == row["sha256"])
        require(sha(RELEASE.read_bytes()) == sha(release_bytes))
        for row in captured:
            require(pin(ROOT / row["path"]) == row["sha256"])
    except Exception as error:
        result["status"] = "FAIL_MATERIALIZATION_BOUNDARY"
        result["boundaryErrorClass"] = type(error).__name__
    result["completedAt"] = now()
    topology()
    with OUTPUT.open("x", encoding="utf-8", newline="\n") as output:
        json.dump(result, output, indent=2, ensure_ascii=True)
        output.write("\n")
    print(json.dumps({"status": result["status"], "resultSHA256": pin(OUTPUT), "files": len(result["files"])}))
    if not result["status"].startswith("PASS_"):
        sys.exit(1)


if __name__ == "__main__":
    main()
