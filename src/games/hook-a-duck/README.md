# Hook a Duck

Rubber ducks float round a stream in a loop. Lower the hook to catch one as it passes.

## How to play

- Move the mouse left and right to move the hook along the rod.
- Click to lower the hook. It drops to the front of the stream, catches the duck
  under it if there is one, and comes back up. You can't move or cast again
  until it is back up.
- A caught duck goes back in the stream once the hook is up.
- You have 8 casts. The round ends when the last cast is back up.
- Click again on the game over screen to play another round.

## Scoring

Each duck has a number on its base, and catching it scores that number. The ten
ducks are numbered 1, 3, 1, 5, 2, 1, 10, 2, 1 and 3. A cast that catches
nothing scores 0.

Your final score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `aimHook`, `cast`, `step`,
  `streamPosition`, `isUnderHook`) and the `hookADuck` entry, the default export
  the midway finds.
- `game.test.ts`: tests for the game logic.
