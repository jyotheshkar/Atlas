# Project Source and Architecture Index

This versioned register separates source code, design evidence, tests and deployment. It contains technical project facts, not approved CV claims.

| Project | Canonical Source | Current Scope | Design Evidence | Test Scope |
|---|---|---|---|---|
| Agentic Core | [agentic-core-evidence](https://github.com/jyotheshkar/agentic-core-evidence/tree/72de3f177f9046fdfbf49b4251c26b49d87070e4) | Published five-module Python/SQLite runtime excerpt with contracts, constrained capability selection, permission rules, local checkpoints/retries and synthetic tests. | [Implemented Local Runtime Scope](https://github.com/jyotheshkar/agentic-core-evidence/blob/72de3f177f9046fdfbf49b4251c26b49d87070e4/README.md#what-this-source-implements); [Proposed AWS Target and Authored Diagram Index](https://github.com/jyotheshkar/agentic-core-evidence/blob/72de3f177f9046fdfbf49b4251c26b49d87070e4/docs/diagrams/README.md) | 35 synthetic runtime tests passed in fresh GitHub Actions at this public release commit; job logs report Ran35tests and OK. [passed] |
| System Architecture Workspace | [system-architecture-workspace](https://github.com/jyotheshkar/system-architecture-workspace/tree/705b370f9a68906ba92e0877edbcc349a0812c7f) | Published project-only derivative of Sitev81: browser/Worker workspace source, authentication/session and optional versioned-storage adapter, curated design data and authored architecture assets. Three original source files were privacy-sanitized. | [Proposed AWS Migration and Authored Diagram Pack](https://github.com/jyotheshkar/system-architecture-workspace/blob/705b370f9a68906ba92e0877edbcc349a0812c7f/docs/diagrams/README.md); [Implemented Application Source Layout](https://github.com/jyotheshkar/system-architecture-workspace/blob/705b370f9a68906ba92e0877edbcc349a0812c7f/app/README.md) | Fresh release CI passed data validation, build,115 authentication/privacy assertions and344 mocked storage assertions. Counts are script assertions, not browser or production-security certification. [passed] |
| QUASAR | [Quasar](https://github.com/jyotheshkar/Quasar/tree/68997940f452bfb137a5bdf94dcd09f4ee045156) | Published sanitized historical Site v47 source plus a tested, standalone projects-only UNCONNECTED public build. Operational datasets and private resource links are omitted. | [Dashboard and Career-Evidence Boundaries](https://github.com/jyotheshkar/Quasar/blob/68997940f452bfb137a5bdf94dcd09f4ee045156/docs/architecture/README.md) | Published baseline push CI succeeded; job 121164586050 logs report 28 tests, 28 pass, 0 fail: 16 synthetic contract checks plus 12 public build/privacy/guard/determinism checks. [passed]; Published baseline CI validated its then-draft registry and passed 23 trust/privacy boundary tests. Later registry-only revision results are separate from this baseline execution receipt. [passed] |
| Rufus Eval Engine | [Rufus-Eval-Engine](https://github.com/jyotheshkar/Rufus-Eval-Engine/tree/6365cd27de2846bea4e7b2dd3146089196e7e40f) | Retrieval, simulated shopping answers, four-dimension LLM judging, SQLite reporting and dashboard code. | [Evaluation Pipeline](https://github.com/jyotheshkar/Rufus-Eval-Engine/blob/f237c2e84e7f97dae720dbf537c1a132a1c8bec0/README.md#implemented-scope) | Frontend TypeScript, ESLint, Jest/build and focused offline mock-agent contracts; no retrieval-model downloads or live provider evaluation. [passed] |
| NHS Elective Flow Intelligence | [nhs-elective-flow-intelligence](https://github.com/jyotheshkar/nhs-elective-flow-intelligence/tree/3d75530331dcaa86cb90c7395e79c763bf9ca5d2) | Public RTT ingestion/transformation, Parquet/DuckDB analytics, transparent prioritisation, forecasting and illustrative capacity scenarios. | [Public-Data Analytics Architecture](https://github.com/jyotheshkar/nhs-elective-flow-intelligence/blob/3d75530331dcaa86cb90c7395e79c763bf9ca5d2/docs/architecture.md) | Backend/frontend checks, synthetic data pipeline, warehouse materialisation and container image builds on the reviewed PR. [passed] |
| PrimeLift AI | [PrimeLift](https://github.com/jyotheshkar/PrimeLift/tree/8521efc15c3279125ae9c79d66180deb6ef03cab) | Synthetic campaign generation, causal-uplift models, saved analysis/policy reports and FastAPI/Next.js presentation. | [Synthetic Uplift Analysis and Report/API Flow](https://github.com/jyotheshkar/PrimeLift/blob/9226773cf1dd5907a595191f592c3586c548ffa4/docs/ARCHITECTURE.md) | Saved-report consistency and Python syntax checks passed at the current documentation-only review head; no estimator reproduction, full API/backend suite or frontend build is inferred. [passed] |

## Source and Design Boundaries

### Agentic Core

- Public release contains a bounded local Python/SQLite excerpt, not a complete installed plugin platform.
- No private operational queues, CVs, contacts, cache, run databases or original history are included.
- Host reasoning and supported tools remain external; local receipts are not provider signatures or remote exactly-once guarantees.
- Authored AWS designs remain proposed targets and reference studies.

### System Architecture Workspace

- Project-only derivative of Sitev81; three source transformations remove unnecessary personal profile content and update privacy regressions.
- Original hosted Site and the public exported copy have separate source/deployment identities.
- Prompt-to-design assistance, automatic infrastructure provisioning and AWS target runtime remain future work.
- Production secret bindings, browser end-to-end behaviour and live storage integration remain unverified.

### QUASAR

- Current hosted Site v49 source e03b18fff2012e37f3d6800ddac4ba74c6b09134 remains unrecovered; GitHub baseline is a sanitized v47 derivative.
- Public mode is projects-only and UNCONNECTED; no signed operational projection, actual career records, application metrics, private resource identifiers or contact data are included.
- The public build has not been deployed and does not reproduce the current hosted dashboard or establish browser end-to-end readiness.
- Live ATLAS/provider connections and future NEBULA/deferred PULSAR application capabilities are not implemented or verified by this release.
- Execution receipts remain bound to the tested baseline. Later registry revisions require their own Actions result.

### Rufus Eval Engine

- Mock scores and scripted adversarial results are fixtures, not measured model quality.
- The full pipeline requires an explicitly built local FAISS index and model files.
- Persisted mock/live/model provenance and strict judge-response validation need further work.
- Live deployment and complete backend suite remain unverified; dependency upgrade work remains open.

### NHS Elective Flow Intelligence

- Independent portfolio project, without NHS affiliation, clinical use or operational deployment claims.
- Official aggregate data and synthetic demo data must be labelled separately.
- Reference numerical results and public API readiness need a current commit-bound receipt.
- Scenario outputs are accounting projections, not causal or achievable capacity estimates.
- Dependency security follow-up remains open.

### PrimeLift AI

- Dataset and campaign outcomes are synthetic; no realised client/business impact is established.
- Existing exploratory champion selection uses test data; a separate validation-selection/final-test protocol is needed.
- Saved-report consistency does not bind a new generated dataset to old reports or rerun models.
- Public-demo write controls, bounded inputs and dependency security remain follow-up work.
- A public deployment has not been established.

## Supporting Public Sources

These 31 repositories are retained for review. Their inclusion is not a recommendation to pin them or a claim of runtime, security or licensing clearance.

| Repository | Audited Commit | Maturity |
|---|---|---|
| [Traveler](https://github.com/jyotheshkar/Traveler) | [f8a54cd671e4](https://github.com/jyotheshkar/Traveler/tree/f8a54cd671e4872ec8a9f0cf8321bd13bc0c95eb) | Learning experiment |
| [Airbnb-clone](https://github.com/jyotheshkar/Airbnb-clone) | [5cf3a4459596](https://github.com/jyotheshkar/Airbnb-clone/tree/5cf3a44595962a61a071baed5d5b28817fcf8ff3) | Frontend prototype |
| [netflixClone.github.io](https://github.com/jyotheshkar/netflixClone.github.io) | [d052e63154cb](https://github.com/jyotheshkar/netflixClone.github.io/tree/d052e63154cb3e38edc400697e876579bc228762) | Learning-reference fork |
| [Assassins-creed](https://github.com/jyotheshkar/Assassins-creed) | [f6f840ec9482](https://github.com/jyotheshkar/Assassins-creed/tree/f6f840ec94823ce08ede3f228b5ff729a882e6c8) | Frontend prototype |
| [DEFI-Decentralized-trading-protocol](https://github.com/jyotheshkar/DEFI-Decentralized-trading-protocol) | [a3a8263f2991](https://github.com/jyotheshkar/DEFI-Decentralized-trading-protocol/tree/a3a8263f29914b6546c80d48c027f5f84a717fb2) | frontend learning demo |
| [Crypto-Explore](https://github.com/jyotheshkar/Crypto-Explore) | [109c00c31f17](https://github.com/jyotheshkar/Crypto-Explore/tree/109c00c31f17e09e5b0488cc7b7fb7efff874f09) | API integration prototype |
| [Covid-Tracker-App](https://github.com/jyotheshkar/Covid-Tracker-App) | [24c501262278](https://github.com/jyotheshkar/Covid-Tracker-App/tree/24c501262278df533f3e0dc7db4c787ab2eed7dc) | tutorial-derived dashboard prototype |
| [Instagram-clone](https://github.com/jyotheshkar/Instagram-clone) | [344a7bf88238](https://github.com/jyotheshkar/Instagram-clone/tree/344a7bf882387cf2f06ba4c9e890d789e75e1afb) | full-stack social prototype |
| [jyotheshkar](https://github.com/jyotheshkar/jyotheshkar) | [5713f8ff53a5](https://github.com/jyotheshkar/jyotheshkar/tree/5713f8ff53a5d1e6ff6f347a29d4fc3046e0a964) | stale profile documentation |
| [Tesla-Clone](https://github.com/jyotheshkar/Tesla-Clone) | [7aebace676a9](https://github.com/jyotheshkar/Tesla-Clone/tree/7aebace676a9e49b194d93e97d70cc9bf8b7f8c2) | frontend learning demo |
| [React.js-Portfolio](https://github.com/jyotheshkar/React.js-Portfolio) | [5063945d223e](https://github.com/jyotheshkar/React.js-Portfolio/tree/5063945d223e08d7be9945455539e45a03b666ce) | historical portfolio |
| [Omnifood-website](https://github.com/jyotheshkar/Omnifood-website) | [e4bdc1fe659f](https://github.com/jyotheshkar/Omnifood-website/tree/e4bdc1fe659fa64308665e062d25e57bc90b4ee9) | upstream learning fork |
| [Car-Parking-System](https://github.com/jyotheshkar/Car-Parking-System) | [b694ee19476e](https://github.com/jyotheshkar/Car-Parking-System/tree/b694ee19476e78ef89601732d083c4c4d3d4a97c) | Academic desktop prototype; not run |
| [Asus-ROG-warehouse-Pro](https://github.com/jyotheshkar/Asus-ROG-warehouse-Pro) | [953a41638b99](https://github.com/jyotheshkar/Asus-ROG-warehouse-Pro/tree/953a41638b99ec8ae81eadbc09f1af66d471989e) | Substantive academic desktop prototype; not run |
| [Data-Analytics](https://github.com/jyotheshkar/Data-Analytics) | [6c276b28fd82](https://github.com/jyotheshkar/Data-Analytics/tree/6c276b28fd829ef91ab308e4dfc2af365c692276) | Analysis scripts; not executed |
| [Quantum-AI-Nexus](https://github.com/jyotheshkar/Quantum-AI-Nexus) | [cdbc8152a2f1](https://github.com/jyotheshkar/Quantum-AI-Nexus/tree/cdbc8152a2f102831d24fceb8015924b91858036) | Frontend prototype using mock data; no implemented AI backend found |
| [CSC-40038](https://github.com/jyotheshkar/CSC-40038) | [d36000cf90d7](https://github.com/jyotheshkar/CSC-40038/tree/d36000cf90d7e2ae260cbef94d65ad99eaf4799d) | Collaborative academic modelling prototype; not run |
| [web-tech](https://github.com/jyotheshkar/web-tech) | [781b5d742b13](https://github.com/jyotheshkar/web-tech/tree/781b5d742b136579c3138905439c4cd7038b5292) | Academic web prototype; not deployed/tested |
| [Software-Engineering-1](https://github.com/jyotheshkar/Software-Engineering-1) | [65951a3a2798](https://github.com/jyotheshkar/Software-Engineering-1/tree/65951a3a27988996556cdf3eab8a056099fa52c0) | Forked collaborative prototype; not run |
| [Time-series-Neural-network-software-application](https://github.com/jyotheshkar/Time-series-Neural-network-software-application) | [ba5e7a92f6ad](https://github.com/jyotheshkar/Time-series-Neural-network-software-application/tree/ba5e7a92f6add180e76d5c533654ea80fe92caa5) | Substantive academic ML desktop prototype; not run |
| [Dairy-Herd-Monitoring](https://github.com/jyotheshkar/Dairy-Herd-Monitoring) | [b6a408c0f3a4](https://github.com/jyotheshkar/Dairy-Herd-Monitoring/tree/b6a408c0f3a4de72d4077ab626a489b686093c30) | Earlier academic prototype with overlap to Time-series-Neural-network repo; not run |
| [Creating-a-Large-Language-Model-from-Scratch](https://github.com/jyotheshkar/Creating-a-Large-Language-Model-from-Scratch) | [7256adc48349](https://github.com/jyotheshkar/Creating-a-Large-Language-Model-from-Scratch/tree/7256adc4834916d816f66be2823e7a658fffc026) | Educational model notebooks; not a production LLM |
| [ReInforcement-Learning-Agent-](https://github.com/jyotheshkar/ReInforcement-Learning-Agent-) | [b8f832daf53d](https://github.com/jyotheshkar/ReInforcement-Learning-Agent-/tree/b8f832daf53df0bb57a2356e798a3a1d13ac3ed4) | Interactive RL prototype; not run |
| [nextwork-web-project](https://github.com/jyotheshkar/nextwork-web-project) | [a536ae778a87](https://github.com/jyotheshkar/nextwork-web-project/tree/a536ae778a87a6c1ca0cf8ff4ffe29def8a28d1a) | Environment-dependent AWS CI/CD web lab source; build not reproduced. |
| [jyotheshkar-RAG-Based-AI-Chatbot-with-AWS-Bedrock](https://github.com/jyotheshkar/jyotheshkar-RAG-Based-AI-Chatbot-with-AWS-Bedrock) | [292747aa9854](https://github.com/jyotheshkar/jyotheshkar-RAG-Based-AI-Chatbot-with-AWS-Bedrock/tree/292747aa98545532cf21505a44e5fbb18613efec) | Documentation-only AWS lab and architecture case study. |
| [AWS-Three-Tier-Web-Application-](https://github.com/jyotheshkar/AWS-Three-Tier-Web-Application-) | [d4988dccc767](https://github.com/jyotheshkar/AWS-Three-Tier-Web-Application-/tree/d4988dccc76726f162920a70a5f9b89917871cac) | Documentation-only AWS three-tier lab and architecture case study. |
| [Jyothesh-Karnam-Portfolio](https://github.com/jyotheshkar/Jyothesh-Karnam-Portfolio) | [a0baa2ad33f9](https://github.com/jyotheshkar/Jyothesh-Karnam-Portfolio/tree/a0baa2ad33f91e4c97103230701eb9ff501d7470) | Implemented website source; run/deployment unverified |
| [Car-Sharing-Demand-Analysis](https://github.com/jyotheshkar/Car-Sharing-Demand-Analysis) | [c1338d77b16a](https://github.com/jyotheshkar/Car-Sharing-Demand-Analysis/tree/c1338d77b16af250a28eab346fd6e60f103c3b2d) | Coursework notebooks and SQLite scripts; missing inputs, stored modelling error and leakage risk. |
| [Portfolio-](https://github.com/jyotheshkar/Portfolio-) | [6f00659525b8](https://github.com/jyotheshkar/Portfolio-/tree/6f00659525b8af7e37aced03b1d7436937aa2bd4) | Static page for another person |
| [sentinel-ai](https://github.com/jyotheshkar/sentinel-ai) | [f17cc6109d2b](https://github.com/jyotheshkar/sentinel-ai/tree/f17cc6109d2b3a1b852a62fff0fdd2d11e40ff56) | Multi-agent prototype; live model-provider path unvalidated. |
| [random](https://github.com/jyotheshkar/random) | [179e54859ff1](https://github.com/jyotheshkar/random/tree/179e54859ff1ce9e83cb709e321486d88186277c) | Personal notes |

## Validate and Update

Run from this directory with Python3.11+; no external packages or network access are required.

```bash
python validate_registry.py
python validate_registry.py --require-published
python test_registry.py
python render_index.py
```

The first validation can accept a truthful draft. Strict validation fails when clean release receipts or design links remain pending. Neither result is a security scan, URL reachability check, claim approval or runtime test.

Update exact commit/file/test receipts before regenerating this README and projects.csv. Keep review-branch tests distinct from default-branch evidence; keep external Site revisions distinct from GitHub source revisions.

Use PROJECT_EVIDENCE_TEMPLATE.md when adding source-specific evidence. Do not add private CVs, contacts, application records, credentials or original private source links.
