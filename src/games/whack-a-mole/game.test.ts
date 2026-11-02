import { describe, expect, it } from 'vitest';
import {
  POINTS_PER_WHACK,
  ROUND_SECONDS,
  createState,
  popInterval,
  step,
  timeLeft,
  upTime,
  whack,
} from './game';

describe('whack-a-mole', () => {
  it('starts with empty holes, no score and the full clock', () => {
    const state = createState();
    expect(state.holes).toHaveLength(9);
    expect(state.holes.every((h) => h.upFor === 0)).toBe(true);
    expect(state.score).toBe(0);
    expect(timeLeft(state)).toBe(ROUND_SECONDS);
    expect(state.phase).toBe('playing');
  });

  it('pops a mole up from an empty hole when the timer runs out', () => {
    const state = createState();
    step(state, popInterval(0), () => 0);
    expect(state.holes[0].upFor).toBeGreaterThan(0);
    expect(state.holes.filter((h) => h.upFor > 0)).toHaveLength(1);
  });

  it('drops a mole back down when its time is up', () => {
    const state = createState();
    state.nextMole = 100;
    state.holes[4].upFor = 0.5;
    step(state, 0.6);
    expect(state.holes[4].upFor).toBe(0);
  });

  it('scores a whack on a mole that is up and knocks it down', () => {
    const state = createState();
    const hole = state.holes[4];
    hole.upFor = 1;
    expect(whack(state, hole.x + 10, hole.y - 10)).toBe(true);
    expect(state.score).toBe(POINTS_PER_WHACK);
    expect(hole.upFor).toBe(0);
  });

  it('scores nothing for a whack on an empty hole or between holes', () => {
    const state = createState();
    const hole = state.holes[4];
    expect(whack(state, hole.x, hole.y)).toBe(false);
    hole.upFor = 1;
    expect(whack(state, hole.x + 100, hole.y)).toBe(false);
    expect(state.score).toBe(0);
  });

  it('pops moles faster and for less time as the round goes on', () => {
    expect(popInterval(ROUND_SECONDS)).toBeLessThan(popInterval(0));
    expect(upTime(ROUND_SECONDS)).toBeLessThan(upTime(0));
  });

  it('ends the round when the clock runs out and puts every mole down', () => {
    const state = createState();
    state.holes[0].upFor = 1;
    state.elapsed = ROUND_SECONDS - 0.01;
    step(state, 0.05);
    expect(state.phase).toBe('over');
    expect(timeLeft(state)).toBe(0);
    expect(state.holes.every((h) => h.upFor === 0)).toBe(true);
  });

  it('ignores whacks once the round is over', () => {
    const state = createState();
    state.phase = 'over';
    state.holes[0].upFor = 1;
    expect(whack(state, state.holes[0].x, state.holes[0].y)).toBe(false);
    expect(state.score).toBe(0);
  });
});
