# 0014: Judging Ao Vivo no 404 on the server

> Rules version 2 (2026-11-22): echo notes, the ones the player repeats by ear and can't see outside assist mode, are judged with the assist windows (60, 120, 180 ms); every note on screen keeps 45, 90, 135. A simulated player who errs about 50 ms on visible notes and 80 ms by ear averaged 72% precision in Vinheta de Intervalo, one star and below every song of the final, and now averages about 80%. The tap log stays `talent-taps` version 2. The bump starts new boards for all six songs.

## Context

Ao Vivo no 404 (EN "Live on 404") is a one-button rhythm game: six songs in three rounds of a talent show. The player taps, and holds on long notes, as notes reach a circle, and the score depends on timing. Two things set it apart from the other replayed games. The "solution" is public: a perfect log is just the chart. And timing depends on the device: audio output and touch or keyboard latency go from a few milliseconds to more than 200 ms with Bluetooth headphones.

## Decision

- **Music and chart share one source.** Each song in `src/games/talent-show/song/` is a step grid (16 steps per bar). Its voices use the same note notation as the room's radio tracks, and its `chart` line sits on the same grid: `x` tap, `o===` hold, `c` Mila's call, `e` the player's echo. Segments set the tempo, swing, featured kid and tap sound per stretch, so the medley can change tempo. The player and the judge take every note time from this data, so there is no second file to drift.
- **The audio clock is the reference.** Taps are read from the browser event's timestamp and mapped to the audio clock with `AudioContext.getOutputTimestamp()`, falling back to `currentTime` minus the reported latency, so the frame rate never changes a judgment. On first play, a timing check takes the median delay between eight clicks and the player's taps. That offset, at most ±250 ms, is subtracted from every tap and from the note positions on screen, and is stored per device in the browser, not in the save.
- **The run is its taps.** `GameResult.replay` has kind `talent-taps`, version 2: the song, the offset, whether assist mode was on, each press in whole milliseconds since the song started, and that press's own release (or `null`). Releases stay paired with their presses because two fingers or keys can overlap on back-to-back held notes.
- **One judge for both sides** (`sim/judge.ts`, rule version 2). Each press goes to the nearest unjudged note within its window: bullseye up to 45 ms, nice up to 90, almost up to 135. Echo notes, played by ear, use the wider assist windows (60, 120, 180), and assist mode uses them for every note. A press with no note is noise and costs a point. A note whose window closes is a miss. A held note counts as held if released no earlier than 110 ms before its end. A crowd meter starts at 70 and moves with every mark; if it empties, the show cuts to commercials and the run ends there (never in assist mode). Notes are worth 3, 2 or 1 points, a held tail 3 more. Precision is points over the maximum, in hundredths of a percent, and stars need a finished song at 50%, 80% and 92%. The score is points × 10.
- **The server replays the log** and takes the score, stars and rank from the replay. The claim must match (`score_mismatch`), malformed logs or logs for another song are refused (`bad_taps`), and stats that differ are flagged `stats_mismatch`. One board per song (`talent-show/<song>/v1`) ranks most points, then more bullseye notes, then less noise. The minimum time since the ticket is the song's length, or the moment of the cut.
- **What stays off the board.** Runs in assist mode (`assisted`), lost runs (`not_won`), and logs whose hit errors are too tight for a person: a standard deviation under 4 ms over at least 30 hits, flagged `inhuman` and stored but not ranked.

## Evidence

- `rules.test.ts` replays a human-like log on all six songs (3 stars, eligible), plus an assisted log, an exact one (flagged), a tampered score, tampered stats, a log for another song, unsorted taps, an offset out of range, an unknown song, a silent run cut to commercials, and early releases on held notes.
- Headless Chrome bots playing through real pointer events landed within a few milliseconds of their intended timing, and every log rejudged the same. A simulated device with a 50 ms delay went from 1 star to 3 after the timing check measured +49 ms. In the desktop app's Chromium, `getOutputTimestamp` gave a clock offset stable to 0.1 ms.

## Consequences

- Changing a chart, a tempo, a window, the crowd values or the points needs a new rule version, which starts new boards.
- The inhuman check only stops naive forgeries. Anyone can add noise to the chart's times and send a plausible log. As with the other replayed games, a record proves that the taps score what they claim, not that a person played them, and ties go to whoever got there first.
- The offset is part of the log, so the server judges with the offset the player measured, within the ±250 ms bound. Players who change headphones or devices should redo the timing check.
