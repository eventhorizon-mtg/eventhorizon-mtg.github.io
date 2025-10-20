# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records for EventHorizon.mtg.

## What are ADRs?

Architecture Decision Records document important architectural decisions made during the project. Each ADR captures:
- **Context:** Why the decision was needed
- **Options considered:** Different approaches evaluated
- **Decision:** What was chosen and why
- **Consequences:** Impact of the decision

## ADR Index

| # | Title | Status | Date |
|---|-------|--------|------|
| [001](./001-scss-architecture-itcss.md) | SCSS Architecture using ITCSS Methodology | ✅ Accepted | 2025-10-20 |
| [002](./002-javascript-es6-modules.md) | JavaScript ES6 Modules Strategy | ⏸️ Deferred | 2025-10-20 |
| [003](./003-breakpoint-strategy.md) | Responsive Breakpoint Strategy | ✅ Implemented | 2025-10-20 |

## Status Legend

- **✅ Accepted** - Decision approved and being implemented
- **✅ Implemented** - Decision fully implemented and active
- **⏸️ Deferred** - Decision postponed, will be reconsidered later
- **❌ Rejected** - Decision rejected, not being pursued
- **🔄 Superseded** - Replaced by a newer decision

## Quick Links

### CSS Architecture
- **ADR 001:** [SCSS Architecture (ITCSS)](./001-scss-architecture-itcss.md)
- **ADR 003:** [Breakpoint Strategy](./003-breakpoint-strategy.md)

### JavaScript Architecture
- **ADR 002:** [ES6 Modules Strategy](./002-javascript-es6-modules.md) (Deferred)

### Related Documentation
- [Image Optimization Guide](../IMAGE_OPTIMIZATION.md)
- [Code Splitting Evaluation](../CODE_SPLITTING_EVALUATION.md)
- [Optimization Progress](../../OPTIMIZATION_PROGRESS.md)

## When to Create an ADR

Create a new ADR when:
- Making a significant architectural decision
- Choosing between multiple valid approaches
- Decision will impact future development
- Team needs to understand why something was done

## ADR Template

```markdown
# ADR NNN: Title

**Status:** [Proposed | Accepted | Rejected | Deferred | Superseded]
**Date:** YYYY-MM-DD
**Decision Maker:** Team Name
**Context:** Related tasks/projects

## Context and Problem Statement
[Describe the problem and why a decision is needed]

## Decision Drivers
[List important factors influencing the decision]

## Considered Options
### Option 1: [Name]
**Pros:** ...
**Cons:** ...

### Option 2: [Name]
...

## Decision Outcome
**Chosen Option:** ...
**Rationale:** ...

## Consequences
### Positive
### Negative
### Neutral

## Related Decisions
[Links to related ADRs]

## References
[External resources]
```

## Contributing

When adding a new ADR:
1. Copy the template above
2. Use the next available number (004, 005, etc.)
3. Fill in all sections thoroughly
4. Update this README index
5. Link related ADRs bi-directionally

## Contact

Questions about architectural decisions?
- Check existing ADRs first
- Review related documentation
- Open a discussion issue on GitHub

---

**Last Updated:** 2025-10-20
**Maintained by:** EventHorizon.mtg Team
