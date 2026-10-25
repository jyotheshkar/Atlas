# Atlas Naming and Compatibility

Atlas Dashboard is the current product name. The repository is `jyotheshkar/Atlas`, retaining GitHub repository ID `1433090077`. LinkedIn and Jack & Jill are the workflow names; Jack & Jill is future work.

Some identifiers predate this rename. They remain intentionally compatible:

| Retained identifier | Reason | Current display |
|---|---|---|
| Project registry `project_id: quasar` | Stable machine identifier for existing source/receipt relationships | Atlas Dashboard |
| Historical `/api/quasar/v1/` routes | Existing consumers and tests use this API prefix | Historical API only; unavailable in public mode |
| Schema v1 `NEBULA` | Snapshot/agent/filter wire value | LinkedIn |
| Schema v1 `PULSAR` | Snapshot/agent/filter wire value | Jack & Jill (future) |
| Schema `ATLAS` | Existing snapshot key | Atlas |
| `SOL_*` authentication keys and `__Host-sol_session` | Existing authentication/session contract | Unchanged; fail closed without runtime configuration |
| Historical `quasar-*` assets, CSS tokens and DOM helpers | Stable relative references and selectors | Current visible Atlas branding |
| Hosted URL containing `quasar` | Existing service address | Atlas Dashboard |
| Original package manifest and commit-bound receipts | Historical provenance and truthful execution identity | Historical evidence |

Display labels do not change request/filter values. Schema version 1, agent enums, snapshot keys, eligible-agent lists and authentication bytes remain compatible. The public build also rejects `/api/atlas/v1/` operational paths; the rename does not expose an operational API.

Original hash records are preserved separately when source is transformed. A historical passing receipt remains attached to its actual commit; local or later Atlas revisions require their own checks.
