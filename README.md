# QUASAR

**A monitoring and evidence dashboard for the QUASAR career-workflow ecosystem.**

[Hosted dashboard](https://quasar.jyothesh-karnam.chatgpt.site) Â·
[Standalone public build](app/README.md) Â·
[Project source and architecture index](docs/project-registry/README.md) Â·
[Current evidence architecture](docs/architecture/README.md)

The public build is a small **UNCONNECTED project-evidence viewer** derived from
reviewed, sanitized historical source. It contains technical source/design metadata only,
without private career records, campaign counts or a signed operational projection.

## Build and Check

Use Node.js 24.14 or later; no package installation or secrets are required:

```bash
cd app
npm run build
npm test
```

The default build produces a self-contained worker under `dist/public/`.
Twenty-eight checks pass: 16 original synthetic contract checks and 12 new
build/privacy/guard checks. Generated output is excluded from repository
publication. Read [build scope and limits](app/README.md) before using the output.

## Source Boundary

The recovered original source is **historical Site v47**, commit
`da0119d5ebb9780744e726a15967bd67a0e1fca8`. New build scripts, public documentation
and package entrypoints are explicitly recorded as derivatives. A private
operational ledger link was removed from the historical web source; the allowlist
records original and exported hashes separately.

The hosted Site is **v49**, commit
`e03b18fff2012e37f3d6800ddac4ba74c6b09134`, with successful publication recorded
on 25 October 2026. Exact v49 source recovery remains pending. Building this public
subset does not reproduce or deploy the current hosted Site.

## Portfolio Projects and Designs

| Project | Implemented Evidence | Architecture and Design Status |
|---|---|---|
| [Agentic Core](https://github.com/jyotheshkar/agentic-core-evidence) | Published deterministic Python/SQLite excerpt; 35 synthetic tests | [Authored design pack](https://github.com/jyotheshkar/agentic-core-evidence/tree/main/docs/diagrams) separates local implementation from the proposed AWS target. |
| [System Architecture Workspace](https://github.com/jyotheshkar/system-architecture-workspace) | Recovered application-source evidence and separately hosted workspace | [Workspace diagrams](https://github.com/jyotheshkar/system-architecture-workspace/tree/main/docs/diagrams) describe a proposed AWS migration. |
| QUASAR | Historical v47 source plus the new UNCONNECTED public evidence build | [Current identity/evidence diagram](docs/architecture/README.md); exact v49 synchronisation remains pending. |
| [Rufus Eval Engine](https://github.com/jyotheshkar/Rufus-Eval-Engine) | Independent synthetic shopping-assistant evaluation prototype | Evaluation flow; live model/deployment validation has separate limits. |
| [NHS Elective Flow Intelligence](https://github.com/jyotheshkar/nhs-elective-flow-intelligence) | Independent public aggregate-data analytics prototype | [Implementation architecture](https://github.com/jyotheshkar/nhs-elective-flow-intelligence/blob/main/docs/architecture.md); scenarios are illustrative. |
| [PrimeLift AI](https://github.com/jyotheshkar/PrimeLift) | Synthetic causal-uplift models, saved reports and API/UI source | Architecture evidence is tracked by exact review revision in the registry. |

The [versioned registry](docs/project-registry/project-registry.json) binds technical
facts, designs and tests to exact source revisions. Supporting public repositories
remain labelled as retained for review; their inclusion is not flagship approval.

## Data and Integration Scope

The existing QUASAR product is the dashboard. The intended relationship is GitHub
project evidence â†’ ATLAS career evidence â†’ signed read-only projection â†’ QUASAR.
The public build is UNCONNECTED and includes no signed projection or live
ATLAS connection. No production ATLAS implementation repository is asserted.

NEBULA is the future LinkedIn application agent. PULSAR is the deferred Jack and
Jill agent. These identities are design context, not implemented application or
submission claims.

No CV contents, contacts, work/education history, inbox/calendar/application
records, campaign metrics or credentials are included. Original authentication
guards remain fail closed without runtime configuration. Operational routes are
unavailable in public mode.

Third-party assets retain their existing notices, including
[Three.js](app/web/vendor/LICENSE) and
[architecture icon sources](app/web/architecture-icons/SOURCES.md).
