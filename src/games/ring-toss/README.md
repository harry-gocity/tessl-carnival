# Ring Toss

Land rings on the necks of the bottles at the back of the booth.

## How to play

- Move the mouse to aim, and click to throw a ring at that spot.
- You have 8 rings, thrown one at a time: the next ring is ready when the last one lands.
- The game ends when the last ring has landed.
- Click again on the game over screen to play another round.

## Scoring

A ring scores when it lands on a bottle neck. Bottles further back have
narrower necks and score more:

| Row    | Points |
| ------ | ------ |
| Back   | 30     |
| Middle | 20     |
| Front  | 10     |

Each bottle scores once per round: a ring that lands on a bottle already
wearing one is a miss.

Your final score is saved to the carnival's score board when the game ends.

## Files

- `game.ts`: the game logic (`createState`, `toss`, `step`, `isRinger`,
  `ringPosition`) and the `ringToss` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
