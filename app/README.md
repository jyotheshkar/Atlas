# QUASAR Public Evidence Build and Historical Source

This folder combines a reviewed **sanitized historical v47 source snapshot** with a small,
new **UNCONNECTED public evidence build**. The new build is a declared derivative;
it is not the original dashboard deployment or exact hosted v49 source.

## Standalone Public Build

Use Node.js 24.14 or later. No package installation, credentials, operational data,
model download or hosting configuration is required:

```bash
npm run build
npm test
```

The build emits `dist/public/index.mjs`, the unchanged authentication helper and
a build manifest. The generated worker exposes:

- `/`: technical project-evidence viewer.
- `/architecture`: dated architecture and identity reference.
- `/projects.json` and `/api/public/projects`: minimal public project metadata.

It reads only the reviewed repository-level project registry, the newly authored
architecture reference and `worker/auth.mjs`. It does not read or copy the old
campaign/cohort/snapshot JSON, application CSV, QA images, operations folder,
`.openai` configuration or environment values. Unexpected pre-existing generated
assets cause the build to fail rather than being retained.

Operational dashboard/provider routes are unavailable. Writes are rejected.
Original authentication helpers are copied without modification and fail closed
without runtime configuration. Fixture switches cannot activate a live source.

The generated worker is exercised directly through Request/Response tests.
This build does not deploy a service, provide production bindings or establish
browser/deployment readiness. Generated `dist/public/` files are ignored and
excluded from repository publication; regenerate them locally.

## Verification Scope

`npm test` passed **28 checks**: the original 16 synthetic contract checks plus
12 public-build, route/privacy, no-network, authentication-boundary and
determinism checks. See [the derivative receipt](docs/public-build-verification.json).

The historical restoration/API/auth test files are preserved for inspection.
They target the older operational dashboard and its generated server bundle, not
this deliberately smaller public mode; they are not claimed passing here.
`npm run test:historical` preserves the historical suite command and is not a
public-build acceptance gate.

## Historical Source Identity

Recovered original application code comes from **Site version 47**, source commit
`da0119d5ebb9780744e726a15967bd67a0e1fca8`. The original package manifest is
preserved byte for byte at [docs/historical-package.json](docs/historical-package.json).
The current package scripts select the new public build. The allowlist/provenance
documents identify this relocation, every derivative addition, and removal of a
private operational ledger hyperlink from historical web/operations.js. Original
and sanitized-export hashes are recorded separately for that file.

The current hosted Site is **version 49**, source commit
`e03b18fff2012e37f3d6800ddac4ba74c6b09134`, recorded as successfully published
on 25 October 2026. Exact v49 source recovery remains pending. This folder must not
be labelled the latest deployed code.

[Source provenance](docs/source-provenance.json), [original-file allowlist](docs/source-file-allowlist.json)
and [historical verification receipts](docs/verification-receipts.json) preserve
that boundary.

## Original Code Retained for Inspection

- `web/`: historical dashboard/navigation, architecture presentation and provider contracts.
- `worker/`: historical request/authentication/snapshot code.
- `scripts/build.mjs`: original build, retained unchanged; it expects deliberately excluded private/hosting inputs.
- `tests/`: original synthetic contract and historical application checks.
- Third-party Three.js assets and licence/provenance.

ATLAS provider scaffolding is not proof of a production ATLAS connection.
Current identities are documented in the repository's new architecture reference:
ATLAS career evidence, QUASAR monitoring, future NEBULA LinkedIn agent and deferred
PULSAR Jack and Jill agent. The historical presentation may use older naming.

Private operational resource links and identifiers are omitted from this public
copy. Official technical documentation and third-party provenance links remain.

No private career records, credentials, source history or operational signed
projection is included. Do not restore private datasets to make historical
scripts run.
