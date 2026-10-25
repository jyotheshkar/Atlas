# Atlas Dashboard

A public, projects-only evidence viewer and a sanitized historical dashboard source snapshot.

[Hosted Atlas Dashboard](https://quasar.jyothesh-karnam.chatgpt.site) ·
[Build and checks](app/README.md) ·
[Project source index](docs/project-registry/README.md) ·
[Architecture](docs/architecture/README.md) ·
[Compatibility](docs/COMPATIBILITY.md)

The public build is **UNCONNECTED**. It presents technical GitHub project and design evidence. It contains no private CVs, career records, applications, contacts, campaign metrics or signed operational projection.

## Build

Use Node.js 24.14 or later. No dependency installation, credentials, model downloads or operational data are required.

```bash
cd app
npm run build
npm test
```

Generated `dist/public/` output is ignored and excluded from publication. The build reads only the reviewed project registry, architecture reference and unchanged authentication helper. Operational APIs remain unavailable; writes and provider-mode switches are rejected.

## Atlas Sources and Workflows

| Component | Responsibility | Public-source boundary |
|---|---|---|
| Google Sheets | Authoritative Atlas ledger | No sheet URLs, resource IDs or operational records are included |
| Google Drive | Exact private CVs and original evidence | No documents or private file identifiers are included |
| GitHub | Technical project source and revision-bound evidence | Public project metadata and scoped test receipts only |
| Atlas Dashboard | Read-only projection of approved evidence | This standalone viewer is UNCONNECTED |
| LinkedIn | Application workflow with staged sync | Stage → write → read back → commit is a design requirement, not a public implementation claim |
| Jack & Jill | Future application workflow | Future work |

Connected-service and platform permissions govern actual reads, writes and external actions. Plugin instructions do not create permissions or grant access. A dashboard approval control cannot substitute for the relevant service/platform authorisation.

## Source and Design Boundary

The recovered application source is historical Site v47, commit
`da0119d5ebb9780744e726a15967bd67a0e1fca8`. The public copy was privacy-sanitized, given a projects-only build, and renamed to Atlas Dashboard. Original source hashes and explicit transformations are recorded in [provenance](app/docs/source-provenance.json).

The current hosted **Atlas Dashboard v53** has source identity
`f5200fce79b425d6d15d35aafcd9be11aa49fbab`. Exact v52/v53 source is unavailable from the inspected local Git databases. This public checkout does not establish private projection or live-sync behaviour.

The visual direction is **teal, silver and black, with a speedometer dashboard**. The small public viewer adopts those colours and does not invent a speedometer reading or operational totals. The hosted interface is not reproduced from unrecovered source.

The [six-project registry](docs/project-registry/project-registry.json) distinguishes implemented source, proposed/reference designs and actual execution receipts. Its immutable links retain their tested revisions; a rename does not transfer a test pass to new code.

Legacy wire identifiers are documented in [Compatibility](docs/COMPATIBILITY.md). Third-party notices remain in [Three.js](app/web/vendor/LICENSE) and [icon attribution](app/web/architecture-icons/SOURCES.md).
