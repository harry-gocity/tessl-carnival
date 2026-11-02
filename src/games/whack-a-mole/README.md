# Whack-a-Mole

Moles pop up from a grid of nine holes. Whack them before they duck back down.

## How to play

- Click a mole while it's up to whack it.
- Each round lasts 30 seconds.
- Moles pop up faster, and stay up for less time, as the round goes on: a new
  mole every 1.2 seconds at the start, down to every 0.4 seconds by the end, and
  each one stays up for 1.5 seconds at the start, down to 0.6 seconds.
- Click again on the game over screen to play another round.

## Scoring

Every mole you whack scores 10 points. Clicking an empty hole costs nothing.

Your final score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `step`, `whack`, `popInterval`,
  `upTime`) and the `whackAMole` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
