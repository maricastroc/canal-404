# Canal 404

## Tests

Keep the suite small. Read [decision 0007](docs/decisions/0007-essential-tests-only.md) before adding or changing any test.

- Only test what breaks silently and costs a lot: player saves (load, migrate, back up, erase), the scoreboard and mission judges, the API's security, the Laboratório replay, and one end-to-end smoke per flow.
- A new feature, polish round or bug fix gets no new test by default. Extend an existing test only when the change touches one of the areas above.
- Never write tests that pin copy, timings, coordinates, colors, markup, balance, bot behavior or level and story content. Check those by playing or with throwaway scratchpad bots, and do not commit the bots.
- No visual snapshots, accessibility snapshots or bundle budgets in CI.
