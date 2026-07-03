# Conventions — myshape_protocol


## TypeScript

- Enable `strict`; avoid `any`; prefer `unknown` + narrowing
- Explicit return types on exported functions and public class methods
- Use discriminated unions for variant results instead of loose strings
- Prefer `import type` for type-only imports
- Co-locate tests as `*.test.ts` or `__tests__/` per repo standard
- Model domain concepts with types/interfaces, not raw primitives — `UserId` not `string`, `Price` not `number`

### Type, interface, and enum placement

Never define types inline in implementation files. Place them in dedicated files and import:

| What | Where | Filename pattern |
|------|-------|-----------------|
| Domain/business interfaces | `src/domain/` or `features/<name>/` | `<concept>.interface.ts` |
| Shared types across features | `src/types/` | `<concept>.types.ts` |
| Request/response shapes | Next to controller or DTO | `<resource>.dto.ts` or `<resource>.schema.ts` |
| Enums | `src/types/enums/` or `features/<name>/` | `<concept>.enum.ts` |
| Constants (typed) | `src/constants/` | `<domain>.constants.ts` |

One concept per file. If a type is used only within one feature, keep it in that feature folder. If two+ features share it, promote to `src/types/`.














## Cross-cutting

- One logical change per commit when possible
- Update public docs when behavior visible to users changes
