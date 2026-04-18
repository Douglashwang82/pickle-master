# My Rules

- Always use TypeScript strict mode
- Prefer functional components
- Never use `any`
- consider rules from .agents/ in the root folder
- consider rules from .claude/ in the root folder
- consider rules from .github/ in the root folder
- if the changes includes db chagnes, also push db to supabase and update the types in database.types.ts
- if the changes includes API route changes, also update the API documentation in docs/api/ and update the API client in lib/api.ts
- if the changes includes UI component changes, also update the Storybook stories in src/stories