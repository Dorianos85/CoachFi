"""Execute independent synthetic archive guards; no package or candidate code."""
import hashlib
import base64
import json
from pathlib import Path
import runpy
import sys

ROOT = Path(__file__).resolve().parents[2]
TASK = ROOT / "evidence/cycle-71"


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def main():
    assert sys.flags.isolated and sys.flags.no_site
    release_path = TASK / "guard-release.json"
    release_sha = sha(release_path)
    release = json.loads(release_path.read_text(encoding="utf-8"))
    assert release["status"] == "GO_C71_INDEPENDENT_SYNTHETIC_GUARDS_ONLY"
    pins = release["pins"]
    required = {"evidence/cycle-71/guard-driver.py", "evidence/cycle-71/inspect.py",
                "evidence/cycle-71/inspection-negative-fixtures.json", "evidence/cycle-71/before.json"}
    assert required <= {r["path"] for r in pins}
    for row in pins:
        assert sha(ROOT / row["path"]) == row["sha256"]
    assert str(Path(sys.executable).resolve()) == release["python"]["path"]
    assert sha(sys.executable) == release["python"]["sha256"]
    assert sys.version.split()[0] == "3.12.14"
    result = TASK / "guard-result.json"
    assert not result.exists() and not result.is_symlink()
    api = runpy.run_path(str(TASK / "inspect.py"), run_name="c71_synthetic_only")
    api["known_task"]()
    baseline = api["load"](TASK / "before.json")
    before = api["boundary"](baseline)
    fixtures = api["load"](TASK / "inspection-negative-fixtures.json")
    cases = fixtures["cases"]
    assert len(cases) == 9 and len({c["id"] for c in cases}) == 9
    rows = []
    for case in cases:
        assert case["expected"] in ("ACCEPT", "REJECT") and case["version"] == "7.1.6"
        assert case["kind"] in ("expandedTar", "packageProjection")
        outcome, error_class = "ACCEPT", None
        try:
            if case["kind"] == "expandedTar":
                expanded = base64.b64decode(case["expandedTarBase64"], validate=True)
                assert len(expanded) <= 64 * 1024 and len(expanded) == case["bytes"]
                assert hashlib.sha256(expanded).hexdigest() == case["sha256"]
                api["inspect_expanded"](expanded, case["version"])
            else:
                api["project_package"](case["package"], case["version"])
        except ValueError as error:
            outcome, error_class = "REJECT", type(error).__name__
        except Exception as error:
            # A driver/fixture fault is a failing observation, never an expected refusal.
            outcome, error_class = "ERROR", type(error).__name__
        rows.append({"id": case["id"], "expected": case["expected"], "actual": outcome,
                     "pass": outcome == case["expected"], "errorClass": error_class})
    after, boundary_error = None, None
    try:
        after = api["boundary"](baseline)
        assert sha(release_path) == release_sha
        assert sha(sys.executable) == release["python"]["sha256"]
        for row in pins:
            assert sha(ROOT / row["path"]) == row["sha256"]
    except Exception as error:
        boundary_error = type(error).__name__
    api["known_task"]()
    passed = all(r["pass"] for r in rows) and boundary_error is None
    record = {"cycle": "C71", "status": "PASS_SYNTHETIC_ONLY" if passed else "FAIL_SYNTHETIC_ONLY",
              "releaseSHA256": release_sha, "rows": rows, "before": before, "after": after,
              "boundaryErrorClass": boundary_error,
              "applicationTests": 0, "packageCodeExecutions": 0, "networkCalls": 0}
    with result.open("x", encoding="utf-8", newline="\n") as output:
        json.dump(record, output, indent=2)
        output.write("\n")
    print(json.dumps({"status": record["status"], "cases": len(rows), "pass": sum(r["pass"] for r in rows), "sha256": sha(result)}))
    if not passed:
        sys.exit(1)


if __name__ == "__main__":
    main()
