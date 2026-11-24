# 0015: Recovery code and a copy of the progress on the board

## Context

Progress lives in `localStorage` ([0001](0001-save-versioning.md)) and the membership card is a random key in an `httpOnly` cookie ([0003](0003-competition-backend.md)). A player who switched phones, opened another browser, cleared site data, or used Safari, which deletes a site's `localStorage` after seven days of browsing without visiting it, lost every star and save and became a new player on the board. 0003 left a recovery code for later.

## Decision

- **A copy of the progress, only for card holders.** The board keeps one row per player in `player_saves`: every `localStorage` key that starts with `canal404:`, as raw text, except the ones that only make sense on one device (`DEVICE_ONLY_KEYS` in `src/lib/competition/recovery.ts`: the results outbox, the Ao Vivo no 404 latency calibration (no longer written, still kept off the copy) and the sync mark) and the `:backup:` copies. A game with its own save joins the copy without any change. The row has a 64 KB `CHECK`, requests are capped at 48 KB so they fit a `keepalive` request, and leaving the board or two years without visits deletes it with the player.
- **Local stays the source.** The browser sends the copy a few seconds after a result, after joining, after creating a code, after "Apagar meu progresso", and with `keepalive` when a game page or Extras is hidden. It skips sends when nothing changed. Nothing is sent for visitors without a card.
- **The sync mark protects a richer copy.** `canal404:sync:v1` records which player this browser's data belongs to. Without it (a new device, cleared data, Safari's purge) the browser first reads the copy; if the copy has progress and differs, it stops sending and Extras asks whether to bring the copy or keep this browser's. Choosing either one sets the mark.
- **The recovery code is the card's key.** Creating a code replaces the player's token with `base64url(sha256("canal404:recovery:" + code))` and sends the new cookie. Typing the code elsewhere (`POST /api/players/recover`) derives the same token, so every device that used the code keeps working, with no device table, and the database still stores only `sha256(token)`. The code is 16 Crockford base32 characters (80 bits), shown once in groups of four; typing accepts lowercase, spaces and O, I or L for 0 and 1.
- **The card lasts while it's used, and asks for a code.** `GET /api/players/me` sends the cookie again on every check, so an active card never reaches the 400-day limit browsers put on cookies. Until a player creates a code, the card in Extras shows a reminder that it only lives in this browser, and the result panel says the same right after joining from a game.
- **A new code logs out the others.** The server can't show a code again. Creating a new one invalidates the old one and every cookie derived from it, which also covers a code that leaked.
- **Restoring never destroys.** Bringing a copy backs up every local save it replaces or removes (`<key>:backup:restore:<time>`, same rules as 0001) and reloads the page so each game reads its save through `readVersioned`, which migrates older copies and keeps newer ones as backups. A browser with no progress of its own takes the copy right after the code is accepted, without asking.
- **Limits.** Creating codes: 6 per hour per player. Typing codes: 20 per hour and 60 per day per address (schools share addresses; 80 bits make guessing pointless anyway). Sending the copy: 120 per hour per player.

## Consequences

- Playing on two devices with the same card is last-copy-wins: the board holds whatever device sent last. Each device keeps its own progress locally, so nothing is lost, but the copy is not a merge.
- Extras is the only place that offers a copy after Safari's purge. A player who never opens Extras keeps playing with a fresh local save, and the browser doesn't overwrite the copy until they choose.
- A new device-only save must be added to `DEVICE_ONLY_KEYS`, or it will travel with the copy.
- Changing the copy's shape means bumping `Snapshot.version` and accepting the old one in `snapshotSchema`, like any other save.
