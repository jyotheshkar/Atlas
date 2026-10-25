"""Generate the README architecture index and compact CSV from public metadata only."""

import csv
import io
import json
from pathlib import Path

BASE=Path(__file__).resolve().parent

def render(manifest,catalogue):
    lines=["# Project Source and Architecture Index","",
      "This versioned register separates source code, design evidence, tests and deployment. It contains technical project facts, not approved CV claims.",
      "",
      "| Project | Canonical Source | Current Scope | Design Evidence | Test Scope |",
      "|---|---|---|---|---|"]
    flat=[]
    for p in sorted(manifest["projects"],key=lambda x:x["priority"]):
        r=p["repository"]
        source=f'[{r["name"]}]({r["url"]}/tree/{r["source_commit_sha"]})' if r["url"] else "Clean public release pending"
        designs="; ".join(f'[{d["title"]}]({d["url"]})' if d["url"] else d["title"]+" (pending)" for d in p["designs"])
        tests="; ".join(t["summary"]+" ["+t["status"]+"]" for t in p["test_evidence"])
        scope=p["maturity"]["implementation_scope"]
        lines.append("| "+" | ".join([p["title"],source,scope,designs,tests]).replace("\n"," ")+" |")
        flat.append([p["project_id"],p["title"],r["name"],r["url"] or "",r["source_commit_sha"] or "",p["maturity"]["stage"],r["publication_status"]])
    lines+=["","## Source and Design Boundaries",""]
    for p in sorted(manifest["projects"],key=lambda x:x["priority"]):
        lines+=["### "+p["title"],"",*["- "+s for s in p["limitations"]],""]
    lines+=["## Supporting Public Sources","",
      "These "+str(catalogue["repository_count"])+" repositories are retained for review. Their inclusion is not a recommendation to pin them or a claim of runtime, security or licensing clearance.",
      "",
      "| Repository | Audited Commit | Maturity |","|---|---|---|"]
    for r in catalogue["repositories"]:
        lines.append(f'| [{r["repository_name"]}]({r["repository_url"]}) | [{r["source_commit_sha"][:12]}]({r["repository_url"]}/tree/{r["source_commit_sha"]}) | {r["maturity"]} |')
        flat.append([r["repository_name"].lower(),r["repository_name"],r["repository_name"],r["repository_url"],r["source_commit_sha"],r["maturity"],"retained_for_review"])
    lines+=["","## Validate and Update","",
      "Run from this directory with Python3.11+; no external packages or network access are required.",
      "",
      "```bash","python validate_registry.py","python validate_registry.py --require-published","python test_registry.py","python render_index.py","```","",
      "The first validation can accept a truthful draft. Strict validation fails when clean release receipts or design links remain pending. Neither result is a security scan, URL reachability check, claim approval or runtime test.",
      "",
      "Update exact commit/file/test receipts before regenerating this README and projects.csv. Keep review-branch tests distinct from default-branch evidence; keep external Site revisions distinct from GitHub source revisions.",
      "",
      "Use PROJECT_EVIDENCE_TEMPLATE.md when adding source-specific evidence. Do not add private CVs, contacts, application records, credentials or original private source links.",
      ""]
    output=io.StringIO(newline="")
    writer=csv.writer(output,lineterminator="\n")
    writer.writerow(["project_id","title","repository_name","repository_url","source_commit_sha","maturity","publication_status"])
    writer.writerows(flat)
    return "\n".join(lines),output.getvalue()

def main():
    manifest=json.loads((BASE/"project-registry.json").read_text(encoding="utf-8-sig"))
    catalogue=json.loads((BASE/"supporting-repositories.json").read_text(encoding="utf-8-sig"))
    from validate_registry import validate
    receipts=json.loads((BASE/"public-source-receipts.json").read_text(encoding="utf-8-sig"))
    errors,_=validate(manifest,catalogue,receipts)
    if errors:
        raise ValueError("Refusing to generate from invalid public metadata: "+str(len(errors))+" validation errors")
    readme,flat=render(manifest,catalogue)
    (BASE/"README.md").write_text(readme,encoding="utf-8")
    (BASE/"projects.csv").write_text(flat,encoding="utf-8")
    print(json.dumps({"generated":["README.md","projects.csv"],"rows":len(manifest["projects"])+len(catalogue["repositories"])}))

if __name__=="__main__":
    main()
