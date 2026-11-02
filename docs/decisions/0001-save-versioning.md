# 0001: Versioned saves with migrations and backups

## Context

Everything a player owns lives in `localStorage`: portal progress (`canal404:progress:v1`), the Férias Fora do Ar adventure (`canal404:off-air-vacation:v1`) and Guerra do Pijama stats (`canal404:pajama-war:v1`). Before this change, a save that was corrupt or had an unexpected version was replaced by an empty state, and the next write overwrote it. The Férias intro could even offer "Continuar aventura" and then delete the save. The Pijama stats had no version at all.

## Decision

- Every save carries its schema version inside the payload (`version`, or `v` for Férias). The `:v1` suffix in the key names stays as it is; it is a namespace, not the schema version.
- Saves are read through `readVersioned` (`src/lib/progress/migrate.ts`), which runs one migration per version step, then validates and normalizes the shape. Unknown ids and invalid numbers are dropped instead of trusted.
- Before a save is migrated or rejected, its raw text is copied to `<key>:backup:<v<n>|unreadable>:<timestamp>`. Identical copies are not duplicated, and only the two most recent backups per key are kept.
- A migrated save is written back right away. A rejected save is never cleared by the loader; it is only replaced by the next normal write, after the backup exists.
- "Apagar meu progresso" removes every `canal404:` key except the progress record it rewrites, including game saves and backups.

## Consequences

- Changing a save shape means bumping `version` and adding a migration from the previous version, plus a test that loads an old payload.
- A newer save opened by an older build (for example after a rollback) is rejected and backed up, not destroyed. Restoring it is manual: copy the backup value back to the key from the browser devtools.
- Normalizing on read means a bad value in one field no longer throws away the whole save.
