# Shared Code

This folder is reserved for cross-app code that is genuinely shared by multiple tools or deployments.

Current rule: do not move existing apps here yet. The first deployment split should preserve current imports and build behavior.

Future candidates:

- `shared/config/`
- `shared/auth/`
- `shared/ui/`
- `shared/types/`
- `shared/utilities/`

Add shared modules only when they remove real duplication without destabilizing current deployments.
