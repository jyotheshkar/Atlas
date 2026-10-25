"""Validate public portfolio metadata offline; this is not a security or runtime audit."""

import argparse
import datetime as dt
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

BASE = Path(__file__).resolve().parent
SHA = re.compile(r"^[0-9a-f]{40}$")
SECRET = re.compile(r"(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)")
EMAIL = re.compile(r"(?<![\w.-])[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

def keys(value, required, label, errors):
    if not isinstance(value, dict):
        errors.append(label + ": expected object")
        return False
    missing=set(required)-set(value)
    extra=set(value)-set(required)
    if missing or extra:
        errors.append(f"{label}: missing={sorted(missing)} unknown={sorted(extra)}")
    return not missing

def date(value, label, errors):
    try:
        if not isinstance(value,str) or not DATE.fullmatch(value):
            raise ValueError()
        dt.date.fromisoformat(value)
    except (ValueError,TypeError):
        errors.append(label + ": expected real ISO date; no invented verification time")

def sha(value, label, errors, nullable=False):
    if value is None and nullable:
        return
    if not isinstance(value,str) or not SHA.fullmatch(value):
        errors.append(label + ": expected full commit SHA")

def url(value, label, allowed_repos, external_urls, errors, nullable=True):
    if value is None:
        if not nullable: errors.append(label + ": URL required")
        return
    if not isinstance(value,str):
        errors.append(label + ": expected URL or null")
        return
    p=urlsplit(value)
    if p.scheme!="https" or p.username or p.password or p.query or not p.netloc:
        errors.append(label + ": only credential-free HTTPS URLs without query strings")
        return
    if p.netloc=="github.com":
        parts=p.path.strip("/").split("/")
        if len(parts)<2 or tuple(parts[:2]) not in allowed_repos:
            errors.append(label + ": repository is not in the public allowlist")
        if len(parts)>=4 and parts[2] in {"blob","tree","commit"} and not SHA.fullmatch(parts[3]):
            errors.append(label + ": GitHub source link must use a commit, not a branch")
    elif value.split("#",1)[0] not in external_urls:
        errors.append(label + ": unapproved external source URL")

def _validate(manifest, catalogue, receipts=None):
    errors=[]
    gaps=[]
    if receipts is None:
        receipts=json.loads((BASE/'public-source-receipts.json').read_text(encoding='utf-8-sig'))
    keys(receipts,{"schema_version","verified_on","scope","repositories","external_sources","test_receipts"},"receipts",errors)
    proof={}
    proof_ids=set()
    for r in receipts["repositories"]:
        if not keys(r,{"repository_id","owner","name","visibility","repository_url","default_branch","commit_sha","tree_sha","verified_as_commit","verified_on","review_revisions","inspected_files"},"repository receipt",errors):
            continue
        pair=(r["owner"],r["name"])
        if pair in proof or str(r["repository_id"]) in proof_ids:
            errors.append("Duplicate public-source receipt identity")
        proof_ids.add(str(r["repository_id"]))
        if r["visibility"]!="public" or r["verified_as_commit"] is not True:
            errors.append("Source receipt does not confirm a public commit")
            continue
        sha(r["commit_sha"],"receipt commit",errors);sha(r["tree_sha"],"receipt tree",errors)
        if r["commit_sha"]==r["tree_sha"]: errors.append("Source receipt confuses Git tree and commit")
        date(r["verified_on"],"receipt date",errors)
        if r["repository_url"]!=f'https://github.com/{r["owner"]}/{r["name"]}':
            errors.append("Source receipt repository URL mismatch")
        proof[pair]=r
    verified_tests={(r['url'],r['commit_sha']) for r in receipts['test_receipts'] if r['result']=='success'}
    if not keys(manifest,{"schema_version","verified_on","public_safe","publication_readiness","coverage","policy","projects"},"registry",errors):
        return errors,["Registry shape is incomplete"]
    if not keys(catalogue,{"schema_version","verified_on","public_safe","scope","repository_count","repositories"},"catalogue",errors):
        return errors,["Catalogue shape is incomplete"]
    for name,data in (("registry",manifest),("catalogue",catalogue)):
        if data["schema_version"]!="1.0.0" or data["public_safe"] is not True:
            errors.append(name+": unsupported schema or not public-safe")
        date(data["verified_on"],name,errors)
        text=json.dumps(data,ensure_ascii=False)
        if SECRET.search(text) or EMAIL.search(text):
            errors.append(name+": possible secret or personal contact data")
    projects=manifest["projects"]
    rows=catalogue["repositories"]
    if not isinstance(projects,list) or not isinstance(rows,list):
        return errors+["Project/repository collections must be arrays"],["Collections invalid"]
    allow=set()
    ids=set()
    project_ids=set()
    for row in rows:
        allow.add(("jyotheshkar",row.get("repository_name","")))
    for p in projects:
        repo=p.get("repository",{})
        if repo.get("visibility")=="public":
            allow.add((repo.get("owner",""),repo.get("name","")))
    external={s["url"].split("#",1)[0] for s in receipts["external_sources"]}
    if any(pair not in proof for pair in allow): errors.append("Public repository missing independent visibility/commit receipt")
    allow=set(proof)
    if not keys(manifest["coverage"],{"priority_projects","original_audit_repositories","cleanup_candidates_proposed","original_public_repositories_retained_for_review","original_restricted_repositories_not_exported","latest_observed_repository_count","notes"},"coverage",errors):
        return errors,gaps
    if len(projects)!=manifest["coverage"]["priority_projects"] or len(projects)!=6:
        errors.append("Exactly six priority projects expected")
    if catalogue["repository_count"]!=len(rows):
        errors.append("Supporting repository count does not match")
    if manifest["coverage"]["original_public_repositories_retained_for_review"]!=len(rows)+3:
        errors.append("Original public retention total must equal supporting rows plus three coded flagships")
    for p in projects:
        label=p.get("project_id","unknown project")
        if not keys(p,{"project_id","priority","title","repository","maturity","technologies","sources","verified_functionality","designs","test_evidence","limitations","approved_cv_claims","claim_approval_status"},label,errors): continue
        if label in project_ids: errors.append("Duplicate project ID: "+label)
        project_ids.add(label)
        if p["approved_cv_claims"]!=[] or p["claim_approval_status"]!="technical_evidence_only":
            errors.append(label+": CV claims require a separately versioned approval contract")
        keys(p["maturity"],{"stage","implementation_scope","deployment_status"},label+".maturity",errors)
        if not isinstance(p["technologies"],list): errors.append(label+": technologies must be an array")
        if p["maturity"]["stage"] not in {"reviewed_runtime_excerpt","published_site_separate_source_export_pending","published_dashboard_site_readme_only_github_snapshot","independent_synthetic_evaluation_prototype","independent_aggregate_data_analytics_prototype","synthetic_causal_uplift_analytics_prototype","published_clean_demonstration","published_application_source"}:
            errors.append(label+": unsupported maturity stage")
        if not p["limitations"] or not p["maturity"].get("implementation_scope"):
            errors.append(label+": maturity scope and limitations required")
        repo=p["repository"]
        if not keys(repo,{"owner","name","id","url","visibility","source_commit_sha","tree_sha","default_branch","publication_status","verified_on","commit_verified"},label+".repository",errors): continue
        date(repo["verified_on"],label+".repository",errors)
        receipt=proof.get((repo["owner"],repo["name"]))
        if repo["publication_status"]=="published" and (receipt is None or str(receipt["repository_id"])!=str(repo["id"]) or receipt["commit_sha"]!=repo["source_commit_sha"] or receipt["tree_sha"]!=repo["tree_sha"]):
            errors.append(label+": canonical identity/revision differs from public receipt")
        pending=repo["publication_status"] in {"pending","repository_created_source_pending"}
        if repo["publication_status"] not in {"pending","repository_created_source_pending","published"}:
            errors.append(label+": invalid publication status")
        sha(repo["source_commit_sha"],label+".source_commit_sha",errors,nullable=pending)
        sha(repo["tree_sha"],label+".tree_sha",errors,nullable=pending)
        if pending:
            if repo["publication_status"]=="pending" and (repo["url"] is not None or repo["id"] is not None):
                errors.append(label+": uncreated pending repository cannot assert a public identity")
            if repo["commit_verified"] is not False or repo["source_commit_sha"] is not None or repo["tree_sha"] is not None:
                errors.append(label+": source-pending repository cannot assert a release commit")
            if repo["publication_status"]=="repository_created_source_pending":
                if receipt is None or str(receipt["repository_id"])!=str(repo["id"]) or receipt["repository_url"]!=repo["url"]:
                    errors.append(label+": created repository requires a verified public identity")
                url(repo["url"],label+".created_repo",allow,external,errors,False)
            gaps.append(label+": exact clean public release receipt pending")
        else:
            if repo["visibility"]!="public" or repo["commit_verified"] is not True or not isinstance(repo["id"],int):
                errors.append(label+": published repository needs public identity and commit verification")
            if repo["source_commit_sha"]==repo["tree_sha"]:
                errors.append(label+": Git tree SHA cannot substitute for commit SHA")
            if str(repo["id"]) in ids: errors.append(label+": duplicate public repository ID")
            ids.add(str(repo["id"]))
            if repo["url"]!=f'https://github.com/{repo["owner"]}/{repo["name"]}':
                errors.append(label+": canonical repository URL mismatch")
            url(repo["url"],label+".repo_url",allow,external,errors,False)
        source_map={}
        for s in p["sources"]:
            if not keys(s,{"source_id","kind","url","commit_sha","path","status","verified_on","scope"},label+".source",errors): continue
            if s["status"] not in {"inspected_source","metadata_verified","reviewed_no_public_link","public_unmerged_review"}:
                errors.append(label+": source is not an inspected/verified evidence status")
            if s["kind"] not in {"github_file","github_commit","external_site","restricted_excerpt_receipt"}:
                errors.append(label+": unsupported evidence source kind")
            if s["commit_sha"]==repo["tree_sha"]:
                errors.append(label+": source evidence cannot use a Git tree as a commit")
            sid=s["source_id"]
            if sid in source_map: errors.append(label+": duplicate source ID")
            source_map[sid]=s
            sha(s["commit_sha"],label+"."+sid,errors)
            date(s["verified_on"],label+"."+sid,errors)
            url(s["url"],label+"."+sid,allow,external,errors)
            if s["kind"]=="restricted_excerpt_receipt" and (s["url"] is not None or s["path"] is not None):
                errors.append(label+": restricted-source URLs/paths must not be exported")
            if s["kind"] in {"github_file","github_commit"} and receipt:
                known={receipt["commit_sha"],*[r["commit_sha"] for r in receipt["review_revisions"] if r["head_verified"]]}
                if s["commit_sha"] not in known: errors.append(label+": evidence commit has no public revision receipt")
            if s["kind"]=="external_site" and not any(r["url"]==s["url"] and r["source_commit_sha"]==s["commit_sha"] for r in receipts["external_sources"]):
                errors.append(label+": external Site source lacks separate metadata receipt")
            if s["kind"]=="github_file":
                if not isinstance(s["path"],str) or ".." in s["path"].split("/"):
                    errors.append(label+": invalid source path")
                expected=f'https://github.com/{repo["owner"]}/{repo["name"]}/blob/{s["commit_sha"]}/{s["path"]}'
                if s["url"]!=expected: errors.append(label+": file evidence is not bound to own repository/path/commit")
                if not receipt or not any(f["path"]==s["path"] and f["commit_sha"]==s["commit_sha"] and f["inspection"]=="text_read" for f in receipt["inspected_files"]):
                    errors.append(label+": file evidence lacks an exact path/revision inspection receipt")
        for claim in p["verified_functionality"]:
            if not keys(claim,{"statement","source_ids"},label+".claim",errors): continue
            if not claim["statement"] or not claim["source_ids"] or any(s not in source_map for s in claim["source_ids"]):
                errors.append(label+": every technical claim requires known source IDs")
        for design in p["designs"]:
            if not keys(design,{"design_id","title","kind","source_id","url","status","limitations"},label+".design",errors): continue
            if design["source_id"] not in source_map:
                errors.append(label+": design source not found")
            url(design["url"],label+".design",allow,external,errors)
            bound=source_map.get(design["source_id"])
            if design["url"] and design["url"].startswith("https://github.com/") and bound:
                parts=urlsplit(design["url"]).path.strip("/").split("/")
                if len(parts)<5 or tuple(parts[:2])!=(repo["owner"],repo["name"]) or parts[2]!="blob" or parts[3]!=bound["commit_sha"]:
                    errors.append(label+": design must bind exact repository, source commit and file")
                elif not receipt or not any(f["path"]==unquote("/".join(parts[4:])) and f["commit_sha"]==bound["commit_sha"] for f in receipt["inspected_files"]):
                    errors.append(label+": design file has no inspection receipt")
            if design["url"] is None:
                gaps.append(label+": diagram/design "+design["design_id"]+" not publicly linked")
            elif design["status"]!="public_source_design":
                errors.append(label+": linked design requires explicit public source-design status")
        for test in p["test_evidence"]:
            if not keys(test,{"test_id","status","level","source_id","commit_sha","url","command","count","summary","limitations"},label+".test",errors): continue
            source=source_map.get(test["source_id"])
            if source is None or test["commit_sha"]!=source["commit_sha"]:
                errors.append(label+": test result is not bound to its exact source revision")
            if test["status"] not in {"passed","not_run","receipt_refresh_required"}:
                errors.append(label+": unknown test status")
            if test["status"]=="passed" and (not test["command"] or (test["url"] is None and source and source["kind"]!="restricted_excerpt_receipt")):
                errors.append(label+": passing test needs command and a public execution receipt")
            if test["status"]=="passed" and test["url"] is not None and (test["url"],test["commit_sha"]) not in verified_tests:
                errors.append(label+": test pass differs from execution receipt")
            url(test["url"],label+".test",allow,external,errors)
    row_fields={"repository_name","github_repository_id","repository_url","visibility","source_commit_sha","tree_sha","commit_verified","verified_on","retention_status","purpose","maturity","technologies","test_evidence","architecture","evidence_urls","limitations"}
    names=set()
    for r in rows:
        label=r.get("repository_name","supporting row")
        if not keys(r,row_fields,label,errors): continue
        if r["repository_name"] in names or str(r["github_repository_id"]) in ids:
            errors.append(label+": duplicate supporting identity")
        names.add(r["repository_name"]);ids.add(str(r["github_repository_id"]))
        if r["visibility"]!="public" or r["commit_verified"] is not True:
            errors.append(label+": only verified public supporting repositories are allowed")
        receipt=proof.get(("jyotheshkar",r["repository_name"]))
        if receipt is None or str(receipt["repository_id"])!=str(r["github_repository_id"]) or receipt["commit_sha"]!=r["source_commit_sha"] or receipt["tree_sha"]!=r["tree_sha"]:
            errors.append(label+": supporting source differs from independent public receipt")
        sha(r["source_commit_sha"],label,errors);sha(r["tree_sha"],label+".tree",errors)
        if r["source_commit_sha"]==r["tree_sha"]:errors.append(label+": tree/commit SHA collision")
        date(r["verified_on"],label,errors)
        for u in [r["repository_url"],r["architecture"]["source_url"],*r["evidence_urls"]]:
            url(u,label,allow,external,errors,False)
            if u.startswith("https://github.com/"):
                parts=urlsplit(u).path.strip("/").split("/")
                if tuple(parts[:2])!=("jyotheshkar",r["repository_name"]):
                    errors.append(label+": supporting evidence belongs to another repository")
                if len(parts)>=4 and parts[2] in {"blob","tree","commit"} and parts[3]!=r["source_commit_sha"]:
                    errors.append(label+": supporting source URL uses an unreceipted revision")
    if manifest["publication_readiness"] not in {"draft_release_receipts_pending","public_ready"}:
        errors.append("Unsupported publication readiness state")
    if manifest["publication_readiness"]=="public_ready" and gaps:
        errors.append("Registry asserts public_ready while release/design gaps remain")
    if sorted(p["priority"] for p in projects)!=[1,2,3,4,5,6]:
        errors.append("Priority order must contain1through6 exactly")
    def scan_text(value):
        if isinstance(value,dict):
            for item in value.values(): scan_text(item)
        elif isinstance(value,list):
            for item in value: scan_text(item)
        elif isinstance(value,str):
            for embedded in re.findall(r'https?://[^\s)>"\x27]+',value):
                url(embedded.rstrip(".,;"),"embedded URL",allow,external,errors,False)
    scan_text(manifest);scan_text(catalogue)
    return errors,gaps

def validate(manifest,catalogue,receipts=None):
    try:
        return _validate(manifest,catalogue,receipts)
    except (TypeError,AttributeError,KeyError,IndexError,ValueError):
        return ["Malformed registry/receipt structure"],["Publication readiness not established"]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--require-published",action="store_true")
    parser.add_argument("--directory",type=Path,default=BASE)
    args=parser.parse_args()
    directory=args.directory
    manifest=json.loads((directory/"project-registry.json").read_text(encoding="utf-8-sig"))
    catalogue=json.loads((directory/"supporting-repositories.json").read_text(encoding="utf-8-sig"))
    receipts=json.loads((directory/"public-source-receipts.json").read_text(encoding="utf-8-sig"))
    errors,gaps=validate(manifest,catalogue,receipts)
    print(json.dumps({"schema_valid":not errors,"public_ready":not errors and not gaps,"errors":errors,"publication_gaps":gaps,"priority_projects":len(manifest.get("projects",[])),"supporting_repositories":len(catalogue.get("repositories",[]))},indent=2))
    return 1 if errors or (args.require_published and gaps) else 0

if __name__=="__main__":
    raise SystemExit(main())
