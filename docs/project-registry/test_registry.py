"""Meaningful corrupted-register checks; no network or source mutation."""

import copy
import json
import unittest
from pathlib import Path
from unittest.mock import patch
from validate_registry import validate

BASE=Path(__file__).resolve().parent

class RegistryBoundaries(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=json.loads((BASE/"project-registry.json").read_text(encoding="utf-8-sig"))
        cls.catalogue=json.loads((BASE/"supporting-repositories.json").read_text(encoding="utf-8-sig"))

    def mutate(self,change):
        m,c=copy.deepcopy(self.manifest),copy.deepcopy(self.catalogue)
        change(m,c)
        errors,_=validate(m,c)
        self.assertTrue(errors,"Corrupted register unexpectedly accepted")

    def test_truthful_draft_is_schema_valid(self):
        errors,gaps=validate(self.manifest,self.catalogue)
        self.assertEqual(errors,[])
        expected=any(p["repository"]["publication_status"]!="published" or any(d["url"] is None for d in p["designs"]) for p in self.manifest["projects"])
        self.assertEqual(bool(gaps),expected)

    def test_duplicate_project_identity_rejected(self):
        self.mutate(lambda m,c:m["projects"][1].update(project_id=m["projects"][0]["project_id"]))

    def test_tree_sha_cannot_replace_commit(self):
        self.mutate(lambda m,c:m["projects"][3]["repository"].update(source_commit_sha=m["projects"][3]["repository"]["tree_sha"]))

    def test_unlisted_repository_link_rejected(self):
        self.mutate(lambda m,c:m["projects"][3]["sources"][0].update(url="https://github.com/jyotheshkar/not-allowlisted/blob/"+"a"*40+"/README.md"))

    def test_branch_only_link_rejected(self):
        self.mutate(lambda m,c:m["projects"][3]["sources"][0].update(url="https://github.com/jyotheshkar/Rufus-Eval-Engine/blob/main/README.md"))

    def test_unknown_fields_rejected(self):
        self.mutate(lambda m,c:m["projects"][0].update(extra_runtime_claim="unreviewed"))

    def test_unsupported_career_claim_rejected(self):
        self.mutate(lambda m,c:m["projects"][0].update(approved_cv_claims=["Unapproved career claim"]))

    def test_test_result_cannot_move_to_another_head(self):
        self.mutate(lambda m,c:m["projects"][3]["test_evidence"][0].update(commit_sha="b"*40))

    def test_public_pass_requires_receipt(self):
        self.mutate(lambda m,c:m["projects"][3]["test_evidence"][0].update(url=None))

    def test_pending_release_cannot_assert_public_identity(self):
        self.mutate(lambda m,c:m["projects"][0]["repository"].update(url="https://github.com/jyotheshkar/not-published"))

    def test_count_mismatch_rejected(self):
        self.mutate(lambda m,c:c.update(repository_count=c["repository_count"]+1))

    def test_contact_data_rejected(self):
        self.mutate(lambda m,c:m["projects"][0]["limitations"].append("person"+"@"+"example.com"))

    def test_credential_candidate_rejected_without_printing_it(self):
        self.mutate(lambda m,c:m["projects"][0]["limitations"].append("gh"+"p_"+"x"*40))

    def test_design_revision_cannot_be_forged(self):
        self.mutate(lambda m,c:m["projects"][4]["designs"][0].update(url="https://github.com/jyotheshkar/nhs-elective-flow-intelligence/blob/"+"a"*40+"/docs/architecture.md"))

    def test_no_public_ready_claim_with_pending_exports(self):
        def change(m,c):
            m["publication_readiness"]="public_ready"
            m["projects"][0]["designs"][0]["url"]=None
            m["projects"][0]["designs"][0]["status"]="pending_public_export"
        self.mutate(change)


    def test_private_source_url_in_free_text_rejected(self):
        self.mutate(lambda m,c:m["projects"][0]["limitations"].append(
            "Source: https://github.com/jyotheshkar/unreviewed-private-source"
        ))

    def test_nonexistent_file_at_genuine_commit_rejected(self):
        def change(m,c):
            project=next(p for p in m["projects"] if p["project_id"]=="rufus-eval-engine")
            source=next(s for s in project["sources"] if s["kind"]=="github_file")
            repo=project["repository"]
            source["path"]="does-not-exist-in-this-source-tree.py"
            source["url"]=(
                f'https://github.com/{repo["owner"]}/{repo["name"]}'
                f'/blob/{source["commit_sha"]}/{source["path"]}'
            )
        self.mutate(change)

    def test_supporting_evidence_revision_must_match_receipt(self):
        def change(m,c):
            row=c["repositories"][0]
            index=next(i for i,u in enumerate(row["evidence_urls"])
                       if "/tree/" in u or "/blob/" in u)
            original=row["evidence_urls"][index]
            row["evidence_urls"][index]=original.replace(row["source_commit_sha"],"a"*40,1)
            self.assertNotEqual(original,row["evidence_urls"][index])
        self.mutate(change)

    def test_design_cannot_borrow_another_public_repository(self):
        def change(m,c):
            project=next(p for p in m["projects"] if p["project_id"]=="rufus-eval-engine")
            design=project["designs"][0]
            design["url"]=design["url"].replace("/Rufus-Eval-Engine/","/PrimeLift/")
        self.mutate(change)

    def test_receipt_must_verify_commit_object(self):
        m,c=copy.deepcopy(self.manifest),copy.deepcopy(self.catalogue)
        receipts=json.loads((BASE/"public-source-receipts.json").read_text(encoding="utf-8-sig"))
        row=c["repositories"][0]
        receipt=next(r for r in receipts["repositories"]
                     if str(r["repository_id"])==str(row["github_repository_id"]))
        receipt["verified_as_commit"]=False
        errors,_=validate(m,c,receipts)
        self.assertTrue(errors,"Unverified commit receipt unexpectedly accepted")

    def test_unreviewed_maturity_and_source_status_rejected(self):
        for boundary in ("maturity","source_status"):
            with self.subTest(boundary=boundary):
                def change(m,c):
                    project=next(p for p in m["projects"] if p["project_id"]=="rufus-eval-engine")
                    if boundary=="maturity":
                        project["maturity"]["stage"]="unverified_autonomous_production_service"
                    else:
                        source=next(s for s in project["sources"] if s["kind"]=="github_file")
                        source["status"]="not_inspected"
                self.mutate(change)

    def test_malformed_repository_shape_returns_validation_error(self):
        m,c=copy.deepcopy(self.manifest),copy.deepcopy(self.catalogue)
        m["projects"][3]["repository"]=[]
        errors,_=validate(m,c)
        self.assertTrue(errors,"Malformed repository shape unexpectedly accepted")

    def test_renderer_refuses_invalid_metadata_before_writing(self):
        import render_index

        manifest=copy.deepcopy(self.manifest)
        manifest["projects"][0]["approved_cv_claims"]=["Unapproved career claim"]
        receipts=json.loads((BASE/"public-source-receipts.json").read_text(encoding="utf-8-sig"))
        documents={
            "project-registry.json":manifest,
            "supporting-repositories.json":self.catalogue,
            "public-source-receipts.json":receipts,
        }

        def read_document(path,*args,**kwargs):
            self.assertIn(path.name,documents,"Unexpected renderer input")
            return json.dumps(documents[path.name])

        with patch.object(Path,"read_text",new=read_document), \
             patch.object(Path,"write_text",autospec=True) as write_text, \
             patch("builtins.print"):
            try:
                result=render_index.main()
            except ValueError:
                pass
            except SystemExit as exc:
                self.assertIsInstance(exc.code,int)
                self.assertNotEqual(exc.code,0)
            else:
                self.assertIsInstance(result,int,"Renderer must report invalid metadata")
                self.assertNotEqual(result,0)
            write_text.assert_not_called()


if __name__=="__main__":
    unittest.main(verbosity=2)
