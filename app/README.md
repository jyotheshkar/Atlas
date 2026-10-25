# Atlas Dashboard Public Build

This folder contains a **sanitized historical v47 derivative** and a standalone **UNCONNECTED public evidence build**. It is not exact hosted Atlas Dashboard v53 source.

## Run the Checks

Use Node.js 24.14 or later:

```bash
npm run build
npm test
```

No package installation, credentials, operational inputs, model downloads or hosting configuration are required. The generated worker exposes:

- `/`: Atlas Dashboard technical project viewer.
- `/architecture`: current authored evidence/permission boundary.
- `/projects.json` and `/api/public/projects`: minimal public project metadata.

Only the reviewed registry, architecture reference and `worker/auth.mjs` enter the build. Output is limited to `dist/public/index.mjs`, `auth.mjs` and `build-manifest.json`. Unknown pre-existing generated assets cause a build failure. Generated output is ignored and not published.

Both historical and Atlas operational API paths are unavailable in public mode. Writes and provider toggles are rejected. Original authentication bytes, environment keys and cookie semantics are retained; missing runtime configuration fails closed. No live provider or private signed projection is activated.

The viewer uses teal/silver/black. The accepted hosted speedometer direction is documented rather than populated with fabricated campaign figures.

## Verification

The default suite covers the original 16 deterministic synthetic contract checks and the public build, route/privacy, no-network, authentication and determinism boundaries. Atlas branding, blocked Atlas API paths and display-name compatibility have focused assertions.

Historical restoration/API/auth suites target an omitted generated operational bundle. They are retained for inspection and are not claimed passing. `npm run test:historical` is not a public-build acceptance gate. The original build still expects deliberately excluded operational and hosting inputs; do not restore private records to run it.

## Source Identity

Historical source origin: v47 commit `da0119d5ebb9780744e726a15967bd67a0e1fca8`.
The original package bytes remain at [docs/historical-package.json](docs/historical-package.json).

The current hosted Atlas Dashboard is v53, source identity
`f5200fce79b425d6d15d35aafcd9be11aa49fbab`. Exact v52/v53 source is unrecovered. The Atlas rename and public viewer are declared derivatives, not recovery of the latest deployment.

See [provenance](docs/source-provenance.json), [source allowlist](docs/source-file-allowlist.json), [verification](docs/public-build-verification.json) and [legacy compatibility](../docs/COMPATIBILITY.md).

Google Sheets is the intended authoritative ledger; Drive retains exact private CVs/evidence; GitHub supplies technical project evidence; the dashboard consumes a projection. LinkedIn staged/write/read-back/commit synchronisation is a requirement documented in the architecture, not implemented live sync in this public build. Jack & Jill remains future work.

Connected-service/platform permissions govern actual actions. No public plugin text or UI control grants those permissions. No private career records, contacts, credentials, resource identifiers or operational projection are included.
