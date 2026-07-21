# AI.md — Steward-Admin

## What this is
Steward-Admin is the management dashboard for the Steward restaurant operating system. It is a Next.js App Router application providing multi-branch support, comprehensive analytics, kitchen display system (KDS), and complex role-based access control (Super Admin, Admin, Kitchen Staff, Waiter). It uses Zustand for state, Socket.io for real-time updates, and a feature-slice folder architecture.

## Current focus
not yet established

## Related projects
Steward-Admin references Steward-Backend for its API and WebSocket connections. It shares domain concepts with Steward-Menu.

## Load before working here
- ARCHITECTURE.md
- Relevant files under ai-os/standards/
- ai-os/memory/projects/Steward-Admin.md (once it exists)

## Project-specific rules
- Always use the in-memory access token system for auth. Never write auth tokens to localStorage.
- Respect the feature-slice architecture in `features/` rather than dumping everything in `components/`.

## Verification checklist
- [ ] Standards followed
- [ ] Policies respected
- [ ] Documentation updated
- [ ] Tests passed
- [ ] KNOWN_ISSUES.md checked for related open items
