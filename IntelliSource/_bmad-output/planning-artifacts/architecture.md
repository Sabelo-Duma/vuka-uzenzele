# Technical Architecture: IntelliSource

**Project:** IntelliSource — AI-Driven Sourcing & Contracting Platform
**Author:** BMad Architect Agent
**Date:** 2026-07-24
**Version:** 1.0
**Status:** Approved for UX & Implementation Planning
**Inputs:** prd.md (124 FRs, 53 NFRs), research-brief.md, Gijima Architecture Design Principles (20), Hulamin architecture (ADR baseline)

---

## 1. Architecture Overview

IntelliSource is a **multi-tenant, cloud-native Source-to-Contract platform** built as a set of bounded-context services behind an API gateway, with an ASP.NET Core MVC + React frontend, an AI orchestration layer on Microsoft Agent Framework, and an event-sourced immutable audit spine. It deploys to AKS in Azure South Africa North (paired SA West), supports shared-SaaS and in-tenant (dedicated stamp) modes from one codebase, and enforces Zero Trust with defence-in-depth.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Clients: Browser (React+Tailwind) · Teams (bot + adaptive cards) ·      │
│           Supplier Portal (responsive web) · API consumers (OpenAPI 3.2) │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │ HTTPS / OIDC (Entra ID + MFA · supplier tokens)
┌──────────────────────────▼──────────────────────────────────────────────┐
│  Azure Front Door + WAF → APIM / YARP Gateway (authn, rate limits,      │
│  tenant resolution, correlation IDs)                                     │
└───┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
    ▼          ▼          ▼          ▼          ▼          ▼
┌────────┐┌─────────┐┌─────────┐┌──────────┐┌─────────┐┌──────────────┐
│Sourcing││ Intake  ││Evaluation││ Supplier ││Collab/  ││ Platform     │
│Service ││ Service ││ Service  ││ Portal   ││Teams Svc││ Services:    │
│(RFx,CR,││(AI     ││(scores,  ││ Service  ││(bot,    ││ Identity·    │
│publish)││ dialog, ││ envelopes,││(auth,ack,││ cards,  ││ Notification·│
│        ││ specs)  ││ awards)  ││ responses)││ meetings)││ Audit· Docs· │
└───┬────┘└────┬────┘└────┬─────┘└────┬─────┘└────┬────┘│ Dashboard    │
    │          │          │           │           │     └──────┬───────┘
    └──────────┴────┬─────┴───────────┴───────────┴────────────┘
                    ▼
   ┌────────────────────────────────────────────────────────────┐
   │ Async backbone: Azure Service Bus (commands/events) ·      │
   │ SignalR (live UI) · Outbox pattern per service             │
   ├────────────────────────────────────────────────────────────┤
   │ AI Layer: Agent Host (Microsoft Agent Framework) →         │
   │ Azure OpenAI / Foundry (SA-resident routing) + AI Search   │
   ├────────────────────────────────────────────────────────────┤
   │ Data: PostgreSQL Flexible Server (zone-redundant, schema-  │
   │ per-service, RLS tenant isolation) · Azure Blob (docs,     │
   │ per-event-key sealed bids) · Redis (cache/session)         │
   ├────────────────────────────────────────────────────────────┤
   │ Audit spine: append-only hash-chained AuditLog + WORM      │
   │ export container                                            │
   └────────────────────────────────────────────────────────────┘
```

## 2. Gijima Architecture Principles → Design Response

| # | Principle | Design response |
|---|-----------|-----------------|
| 1 | Clean Architecture, .NET 10 | Every service: Domain / Application / Infrastructure / Presentation layers; dependencies point inward; domain has zero framework refs (§4, ADR-01) |
| 2 | MVC + React + Tailwind | ASP.NET Core MVC host per web app, React 18 view islands via Vite, Tailwind themed with gijima-styles.css tokens (ADR-02) |
| 3 | EF Core → Postgres | EF Core 10 + Npgsql; schema-per-service; migrations in CI (ADR-03) |
| 4 | Docker for local dev | docker-compose: Postgres, Redis, Azurite, service containers, mock AI endpoint (§10) |
| 5 | Cloud-native K8s target | AKS, Helm charts, HPA, multi-AZ node pools (ADR-04) |
| 6 | Zero Trust + defence-in-depth | Per-request authn/authz, mTLS east-west, managed identities, WAF, layered validation (§9) |
| 7 | API-first, OAS 3.2.0 + Swagger | Code-first OpenAPI 3.2 generation, CI contract tests, /api/docs (ADR-09) |
| 8 | POPIA | SA data residency, s72 AI routing, subject-rights tooling, DPA pack (§9.4) |
| 9 | Entra ID SSO + MFA + user mgmt | OIDC via Entra ID, conditional-access MFA, supplier local identity + optional External ID (ADR-05) |
| 10 | Full audit & compliance | Hash-chained append-only audit spine, evidence packs, AI invocation logging (ADR-07) |
| 11 | Microservices: single responsibility, autonomous deploy | 6 bounded-context services + platform services, independently deployable Helm releases (ADR-06) |
| 12 | API-based communication | REST + async Service Bus events; no shared databases across services (§3) |
| 13 | 10k+ concurrent users <2s | Stateless scale-out, Redis caching, load-tested gates (§12, NFR-PERF-03) |
| 14 | Operational excellence | Automation-first workflows, dead-letter dashboards, runbooks (§13) |
| 15 | UX & profile management | Profile service in Identity; personalization per role (UX spec) |
| 16 | Real-time dashboards | SignalR hub + projection tables (§3, FR-DASH-04) |
| 17 | Analytics: charts, slices, pies, CSV/PDF export | Dashboard service with projection store + export renderer (§3) |
| 18 | App uptime 99.5% | Multi-replica deployments, PDBs, health probes, blue/green (§10) |
| 19 | Infra uptime 99.99% | Multi-AZ AKS + zone-redundant Postgres/Blob (§10) |
| 20 | Strict boundary enforcement | Schema-per-service, internal NuGet contracts, ArchUnitNET tests in CI blocking cross-boundary refs (§4) |

## 3. Service Decomposition (bounded contexts)

| Service | Responsibility (single) | Owns data | Key FRs |
|---------|------------------------|-----------|---------|
| **Identity & Admin** | Users, roles, tenants, config, POPIA tooling | User, Tenant, Config | FR-ADM-* |
| **Intake** | Plain-language intake, AI dialog, specs, triage | Intake | FR-INT-* |
| **Sourcing** | RFx lifecycle, templates, documents metadata, suppliers-on-event, workflow, publication, CRs | RfxEvent, Criteria, RfxDocument, RfxTemplate, InvitedSupplier, ChangeRequest, Supplier master, StageTimestamp | FR-RFX/DOC/SUP/WF/PUB/CR-* |
| **Supplier Portal** | Supplier identity, acknowledgements, response intake & sealing | SupplierUser, Acknowledgement, SupplierResponse (sealed) | FR-SP/RESP-* |
| **Evaluation** | Panels, CoI, scoring, completeness flags, envelopes, awards | EvaluationAssignment, Score, CompletenessFlag, AwardRecommendation | FR-EVAL-* |
| **Collaboration (Teams)** | Bot, adaptive cards, meeting scheduling, channel posts | Card/message state | FR-TEAMS-* |
| **AI Orchestration** (platform) | Agent host, prompt templates, model routing, s72 policy, AiInvocation log | AiInvocation, PromptProfile | FR-AI-* |
| **Notification** (platform) | Email/Teams dispatch, templates, retries, DLQ | Notification | FR-NOTIF-* |
| **Audit** (platform) | Append-only hash-chained log, verification, evidence packs | AuditLog | FR-AUD-* |
| **Document** (platform) | Blob storage, virus scan pipeline, checksums, chunked upload | Blob metadata | FR-DOC-01/02/03/06 |
| **Dashboard** (platform) | Read-model projections, KPIs, charts, CSV/PDF export, SignalR | Projection tables | FR-DASH-* |

**Pragmatic MVP deployment:** services are code-separated from day 1 (solution-per-service, no shared DB schemas) but deployed as **5 deployable units** initially — Core API (Sourcing+Intake+Evaluation+Identity), Supplier Portal API+web, Collaboration, AI Orchestration, Workers (Notification/Audit/Document/Dashboard projections) — splitting further as scale demands. This satisfies autonomous deployability without day-1 operational sprawl. Boundary rules are enforced regardless (ADR-06, §20 tests).

**Communication:** synchronous REST (via gateway) only client→service; service→service via Service Bus events (integration events: `RfxPublished`, `RfxClosed`, `ResponseSubmitted`, `CrApplied`, `AwardApproved`…) with the **transactional outbox** pattern per service. SignalR for UI push. No distributed transactions — sagas for multi-service flows (e.g., publish = Sourcing commits → event → Notification dispatches → Portal activates links; compensation on dispatch failure = flagged recipients, not rollback).

## 4. Clean Architecture Layout (per service)

```
src/
  IntelliSource.{Service}.Domain/          # entities, value objects, domain events, state machines — zero deps
  IntelliSource.{Service}.Application/     # use cases (CQRS commands/queries via MediatR), interfaces, validation
  IntelliSource.{Service}.Infrastructure/  # EF Core, Service Bus, Blob, Graph, AI clients
  IntelliSource.{Service}.Api/             # controllers/minimal APIs, MVC views where applicable, middleware
tests/
  IntelliSource.{Service}.Domain.Tests/        # colocated per layer
  IntelliSource.{Service}.Application.Tests/
  IntelliSource.{Service}.Api.Tests/           # integration (Testcontainers)
```

Boundary enforcement: ArchUnitNET tests fail CI on (a) Domain referencing any framework, (b) cross-service project references, (c) Infrastructure types leaking into Application signatures. The RfxStatus state machine is a Domain value object with exhaustively unit-tested transition table (Hulamin pattern, extended with Withdrawn/Evaluating/AwardPendingApproval/Awarded/Unsuccessful).

## 5. Architecture Decision Records

### ADR-01: .NET 10 LTS + Clean Architecture — **mandated (principle #1)**
Context: locked by Gijima principles; validated by Hulamin. Consequences: LTS support to 2028; EF Core 10 perf gains; hiring pool strong in Gijima. Alternatives (Node/Java) not considered — constraint.

### ADR-02: ASP.NET Core MVC host + React 18 + Tailwind (Vite) — **mandated (principle #2)**
Context: principle requires MVC + React + Tailwind. Options: (a) MVC shell hosting React islands per view — proven in Hulamin, SEO-light internal app, simple auth cookie flow; (b) full SPA + MVC-as-BFF — cleaner separation, heavier initial build. **Decision: (a) MVC shell + React islands** for internal app AND supplier portal; Vite bundling with per-route entries (aligns with NFR-BUDGET-02). Tailwind config maps 1:1 to gijima-styles.css tokens (`--gj-*` → theme.extend). Consequences: fast first paint, natural code-splitting per view, minimal client routing complexity.

### ADR-03: PostgreSQL Flexible Server (zone-redundant) + EF Core 10, schema-per-service — **mandated (principle #3)**
RLS + EF global query filters for tenant isolation (belt and braces, NFR-SEC-11); read replicas for Dashboard projections at scale; partitioning AuditLog by month. In-tenant stamps get dedicated server instances.

### ADR-04: AKS multi-AZ + Helm + deployment stamps — **mandated (principle #5)**
Shared-SaaS: namespace-per-environment, pods multi-tenant with data-layer isolation. Regulated/SOE tenants: **stamp** = dedicated namespace (or cluster) + dedicated Postgres + dedicated Key Vault, same Helm chart parameterization (FR-ADM-05). K8s alone is insufficient for hostile multi-tenancy — stamps close that gap. Blue/green via Argo Rollouts; PodDisruptionBudgets; HPA on CPU+RPS+Service Bus queue depth.

### ADR-05: Entra ID (OIDC+MFA) internal · ASP.NET Identity for suppliers
Internal: OIDC auth-code+PKCE, conditional-access MFA, group→role mapping (FR-ADM-02). Suppliers: local identity (bcrypt, lockout policy per FR-SP-02) because forcing Entra External ID on ad-hoc vendors raises friction; External ID optional Stage 2. Teams card actions validated via Bot Framework token + on-behalf-of exchange so actions execute under the actor's identity (FR-TEAMS-01).

### ADR-06: Bounded-context services, 5 deployable units at MVP
Options: (a) full 11-service mesh day 1 — max autonomy, high ops burden for a lean team; (b) modular monolith — simplest, violates principle #11's autonomous deployment; (c) **code-separated contexts, 5 deployment units, split-ready** — chosen. Consequences: single-responsibility + API-only communication honored; ops complexity deferred until traffic justifies; splitting = Helm values change, not refactor.

### ADR-07: Audit = append-only hash-chained relational log (+WORM export), not full event sourcing
Options: (a) full event sourcing for all aggregates — max fidelity, high complexity and team unfamiliarity; (b) **CRUD state + comprehensive hash-chained audit log** (Hulamin ADR-012 hardened) — chosen; (c) plain audit table — insufficient tamper evidence for King V/PPA. Implementation: middleware + domain-event interceptors write entries with `EntryHash = SHA256(PrevHash ‖ canonical(entry))`; daily + on-export chain verification job; evidence packs to immutable (WORM policy) Blob container. Status history derived from log (FR-AUD-06). Consequences: 90% of event-sourcing's audit value at 20% of its complexity; deliberate trade-off documented.

### ADR-08: Sealed bids via envelope encryption with per-event data keys
Response blobs encrypted client-side of storage (AES-256-GCM) with a per-event **data encryption key (DEK)**, wrapped by a Key Vault **key encryption key (KEK)**. Technical-envelope DEK unwrap permitted only when `now ≥ ResponseDueDate` (policy in Evaluation service + Key Vault RBAC); Commercial DEK unwrap additionally requires the audited `open-commercial` action (FR-RESP-05, NFR-SEC-05). DB/storage admins can't read sealed content; premature-access attempts are structurally impossible, not just logged. Trade-off: key-management complexity — mitigated by Key Vault managed rotation and integration tests.

### ADR-09: Code-first OpenAPI 3.2.0, spec as CI artifact + contract tests — **mandated (principle #7)**
ASP.NET OpenAPI generation extended to 3.2 output; Swagger UI at /api/docs; spec exported per build, diffed for breaking changes (oasdiff) — breaking change without version bump fails CI; Spectral linting for style; contract tests (Schemathesis) run against ephemeral env. URL versioning /api/v1; 6-month deprecation policy (NFR-API-02).

### ADR-10: AI layer on Microsoft Agent Framework + Azure OpenAI/Foundry, policy-routed
Options: LangChain/LlamaIndex (Python drift from .NET estate), Semantic Kernel alone (superseded — merged into Agent Framework), **Microsoft Agent Framework** (chosen: .NET-native, deterministic Workflow support GA Q2'26, MCP/A2A interop aligning with Teams/Copilot strategy). Patterns: every agent call carries the invoking user's authorization context (FR-AI-04); prompt templates versioned in repo (PromptProfile) with hash logged (FR-AI-05); **model router** enforces tenant s72 policy — SA-North-available models default, cross-region only when tenant config permits (FR-AI-07, NFR-COMP-02); hybrid RAG via Azure AI Search (keyword+vector+semantic rerank) over tenant-scoped indexes; model tiering (frontier for evaluation summaries, mini for classification/reminders). All AI features feature-flagged per tenant (FR-AI-08) with manual fallbacks (NFR-ERR-04).

### ADR-11: Async backbone = Azure Service Bus + transactional outbox; SignalR for UI push
At-least-once delivery with idempotent consumers (inbox dedupe by MessageId); DLQ monitored with admin surface (FR-NOTIF-04). SignalR backplane on Redis; Azure SignalR Service at scale (NFR-PERF-07).

### ADR-12: Testing stack — xUnit + Testcontainers + Playwright + Vitest (details §7)
### ADR-13: Error handling — RFC 7807 middleware + Polly resilience pipelines (details §8)
### ADR-14: Performance budgets enforced by Vite + Lighthouse CI (details §11)
### ADR-15: Accessibility toolchain — axe-core CI + NVDA manual protocol (details §12)
### ADR-16: Observability — OpenTelemetry → Azure Monitor/App Insights; structured Serilog logs, correlation IDs end-to-end; dashboards per SLO (99.5% app / 99.99% infra); alert runbooks.

## 6. Data Architecture

- Schema-per-service in one Postgres cluster (shared SaaS) or per-stamp cluster (in-tenant). Cross-service reads via APIs/events only (principle #20); Dashboard consumes events into denormalized projection tables.
- Tenant isolation: `tenant_id` NOT NULL on every table + Postgres RLS policies + EF global filters + integration tests asserting cross-tenant 404 (NFR-SEC-11).
- AuditLog: monthly partitions, BRIN index on timestamp, no UPDATE/DELETE grants (enforced in migration tests, FR-AUD-02).
- Migrations: EF Core migrations per service, applied by CI job with drift check; expand-contract pattern for zero-downtime.
- Caching: Redis for reference data (templates, categories, config) with 5-min TTL + event-driven invalidation; no caching of sealed or evaluation data.
- Blob layout: `{tenant}/{rfx}/{class}/{docId}` with immutability policy on evidence container; lifecycle hot→cool 12 months post-close (NFR-SCALE-03).

## 7. Testing Architecture

**Pyramid: 70% unit · 20% integration · 10% E2E.**

| Type | Tool | Config |
|------|------|--------|
| Unit (.NET) | xUnit + FluentAssertions + NSubstitute | Per-layer test projects; domain state machine 100% branch; Bogus factories |
| Unit (React) | Vitest + React Testing Library | jsdom; MSW for API mocks; colocated `*.test.tsx` |
| Integration (API+DB) | xUnit + Testcontainers (Postgres, Azurite, Redis) + WebApplicationFactory | Real Postgres per test class; respawn between tests; Service Bus via emulator/harness |
| Contract | oasdiff (breaking-change gate) + Schemathesis vs OpenAPI 3.2 spec | CI stage on ephemeral env |
| E2E | Playwright (.NET bindings) | 8 critical journeys (J1–J8); trace-on-failure; runs on PR (smoke) + nightly (full) |
| Load | k6 | Profiles: 10k concurrent browse, 1k submission spike at deadline, SignalR fan-out; gates NFR-PERF-01/03/07 pre-GA |
| Security | OWASP ZAP baseline in CI + dependency scanning (Dependabot/Trivy) + secret scanning | ASVS L2 manual verification pre-GA |
| A11y | axe-core in Playwright + Lighthouse CI | 0 critical/serious to merge (NFR-A11Y-06) |
| AI evaluation | Promptfoo regression suite | Golden-set specs/RFx/completeness cases; drift alerts on model/prompt change |

**Patterns:** AAA structure; factory functions (no shared fixtures mutating state); mock at boundaries only (AI client, Graph, Service Bus) — never mock the DB in integration tests; test isolation via Testcontainers + Respawn; naming `MethodName_Should_Expectation_When_Condition`.
**Coverage:** minimum 80% line (CI gate), target 95%; 100% branch on: RfxStatus transitions, sealing/unsealing logic, scoring consolidation math, preference/weight calculations, hash-chain writer. Generated code excluded.
**Test data:** Bogus-based factories per entity; anonymized-realistic seed pack for demo/staging; golden AI datasets versioned in repo.

## 8. Error Handling Architecture

- **Global handler:** ASP.NET middleware maps exceptions → RFC 7807 problem+json with `errorId` (ERR-YYYYMMDD-NNNNN), correlation ID, no stack traces externally; React error boundaries per route with retry affordance (NFR-ERR-02/06).
- **Resilience (Polly v8 pipelines):** retry idempotent operations on 408/429/5xx/network — exponential 100/300/900ms + jitter, max 3 (NFR-ERR-01); **circuit breakers** per dependency (AI: 50% failure over 30s → open 60s; Graph: 5 consecutive → open 30s); timeouts: external HTTP 10s, AI drafting 60s/chat 30s, DB 30s (NFR-ERR-03).
- **Graceful degradation matrix:** AI down → manual forms/scoring with banner (never blocks lifecycle); Teams/Graph down → email within 60s (FR-TEAMS-06); SignalR down → 30s polling fallback; Redis down → direct DB (perf-degraded, functional); Service Bus down → outbox accumulates, publishes on recovery; Blob down → uploads queued client-side with retry UI.
- **Idempotency:** all mutating endpoints accept `Idempotency-Key`; consumers dedupe by MessageId (inbox table).

## 9. Security Architecture (Zero Trust + defence-in-depth)

1. **Edge:** Front Door + WAF (OWASP CRS), TLS 1.2+, HSTS, geo/IP throttling; tiered rate limits (NFR-SEC-09).
2. **Identity:** Entra OIDC + MFA (internal); supplier local identity with lockout + uniform errors (FR-SP-02, NFR-SEC-12); managed identities service→Azure; mTLS east-west (service mesh or app-level).
3. **Authorization:** policy-based RBAC at API + UI; deny-by-default endpoint×role matrix generated from code and tested exhaustively (NFR-SEC-04); tenant resolution middleware before any handler.
4. **Data:** AES-256 at rest; per-event DEK envelope encryption for sealed bids (ADR-08); Key Vault for all secrets (NFR-SEC-08); field-level protection for PII.
5. **POPIA:** SA-North residency; s72 model routing (ADR-10); subject-rights tooling (FR-ADM-04); breach workflow with 72h internal SLA (NFR-COMP-01); DPA pack as onboarding artifact.
6. **AppSec:** server-side validation everywhere, parameterized queries only, CSP nonce-based no unsafe-inline, output encoding, anti-forgery on MVC forms; SAST/DAST/dependency/secret scanning in CI; ASVS L2 pre-GA.
7. **Audit:** every authn/z failure, sealing access, admin change → structured security log → Sentinel-forwardable (NFR-SEC-10).

## 10. Infrastructure & CI/CD

- **Environments:** dev (docker-compose) → CI ephemeral (Testcontainers + kind) → staging (AKS, anonymized seed) → prod (AKS multi-AZ, SA North; DR pair SA West).
- **IaC:** Bicep (or Terraform) modules; identical stamp chart for in-tenant.
- **Pipeline (GitHub Actions/Azure DevOps):** build → unit → integration → contract/oasdiff → SAST/deps → docker build+Trivy → deploy ephemeral → Playwright smoke + axe + Lighthouse budgets → staging → nightly full E2E/k6/ZAP → prod blue/green with auto-rollback on SLO breach.
- **DR:** zone-redundant Postgres + PITR (RPO ≤15 min), geo-restore rehearsed quarterly (RTO ≤1h, NFR-REL-02); deploy freeze window 48h before any tenant event close (NFR-REL-03, scheduler-aware).
- **Observability:** OTel traces across gateway→services→AI calls; RED+USE dashboards; SLO burn-rate alerts; synthetic probes for portal login + submission path every 5 min.

## 11. Performance Architecture

- **Budgets in CI:** Vite rollup budget plugin + Lighthouse CI assertions — initial JS <300KB gz, route chunks <200KB, total <1MB, CSS <50KB (NFR-BUDGET-*); PR fails on breach with diff report.
- **Code-splitting:** per-MVC-view React entries (natural route splitting); vendor chunk separation; dynamic import for charts (recharts), file-upload, and evaluation matrix modules.
- **Images:** WebP/AVIF pipeline, responsive `srcset`, lazy loading; brand assets preloaded (Proxima Nova via Adobe Fonts with `font-display: swap`).
- **CDN:** Front Door caching for static assets (immutable, content-hashed filenames, 1-year max-age); API no-store.
- **Server:** response compression (Brotli); output caching for reference endpoints; pagination everywhere (NFR-SCALE-04 virtualized lists); N+1 guard (EF query counter in integration tests, NFR-PERF-05); Npgsql batching for bulk operations.

## 12. Accessibility Architecture (WCAG 2.1 AA, target 2.2 AA)

- **Tooling:** eslint-plugin-jsx-a11y (lint), axe-core in Playwright per journey (0 critical/serious to merge), Lighthouse CI a11y ≥95, Pa11y CI on supplier portal pages.
- **Manual protocol per release:** NVDA + keyboard-only run of J1 (intake), J3 (approve), J4 (supplier submit), J6 (score), J8 (evidence export); documented in release checklist.
- **Component-level WCAG mapping:** maintained in the UX spec (design tokens ensure contrast: navy #0E355A on white = 10.6:1 ✓; red #F20023 on white = 4.9:1 ✓ for text ≥14px bold; muted #777 on white = 4.48:1 — reserve for ≥18px or decorative); focus ring token (2px, navy on light / white on dark); status badges = icon+text (NFR-A11Y-05).
- **ACR (VPAT)** produced at GA from test evidence — sales asset for public sector.

## 13. Coding Standards

C#: latest lang version, nullable enabled, analyzers as errors (IDExxxx + StyleCop set), `Result<T>`-style application errors (no exception-driven control flow), async suffix, CancellationToken on all async paths. React/TS: strict TS, functional components + hooks, TanStack Query for server state (no ad-hoc fetch), React Hook Form + zod validation mirroring FluentValidation rules, Tailwind class conventions via `gj-` prefixed design-token utilities. Commits: Conventional Commits; PR template includes FR/story reference + test evidence. Docs: ADR for any deviation; XML docs on public application contracts; README per service.

---

**Quality Gate — Architect (artifact_completeness):**
- [x] Tech stack justified: 16 ADRs (mandates flagged vs chosen trade-offs)
- [x] Database strategy covers all 23 PRD entities (schema-per-service, isolation, partitioning)
- [x] **Testing strategy fully defined**: pyramid 70/20/10, 9 tool rows, coverage gates (80% min/95% target/100% critical branches), AI regression suite
- [x] Project structure enables test colocation
- [x] Security: Zero Trust layers, sealed-bid envelope encryption, POPIA/s72
- [x] Error handling: global handler, RFC 7807, Polly pipelines, circuit breakers, degradation matrix
- [x] API documentation: code-first OpenAPI 3.2, oasdiff gate, /api/docs, versioning policy
- [x] Performance: CI budgets, splitting plan, image pipeline, CDN strategy
- [x] Accessibility architecture: tools, CI gates, manual protocol, token contrast mapping
- **Score: 95/100** ✅

**Next:** UX Designer agent → ux-design-specification.md
