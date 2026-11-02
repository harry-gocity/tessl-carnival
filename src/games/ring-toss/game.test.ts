import { describe, expect, it } from 'vitest';
import {
  FLIGHT_TIME,
  RINGS_PER_ROUND,
  createState,
  isRinger,
  step,
  toss,
  type Bottle,
} from './game';

const bottle: Bottle = { x: 400, y: 200, neck: 11, points: 20, ringed: false };

describe('ring toss', () => {
  it('starts with every ring and no score', () => {
    const state = createState();
    expect(state.rings).toBe(RINGS_PER_ROUND);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.bottles.every((b) => !b.ringed)).toBe(true);
  });

  it('uses one ring per toss', () => {
    const state = createState();
    expect(toss(state, 400, 200)).toBe(true);
    expect(state.rings).toBe(RINGS_PER_ROUND - 1);
    expect(state.ring).not.toBeNull();
  });

  it('throws one ring at a time', () => {
    const state = createState();
    toss(state, 400, 200);
    expect(toss(state, 400, 200)).toBe(false);
    expect(state.rings).toBe(RINGS_PER_ROUND - 1);
  });

  it('cannot toss once the rings run out', () => {
    const state = createState();
    state.rings = 0;
    expect(toss(state, 400, 200)).toBe(false);
    expect(state.ring).toBeNull();
  });

  it('scores a ring that lands on a bottle neck', () => {
    const state = createState();
    state.bottles = [{ ...bottle }];
    toss(state, bottle.x + 3, bottle.y - 3);
    step(state, FLIGHT_TIME);
    expect(state.score).toBe(bottle.points);
    expect(state.bottles[0].ringed).toBe(true);
    expect(state.ring).toBeNull();
  });

  it('scores nothing for a ring that misses', () => {
    const state = createState();
    state.bottles = [{ ...bottle }];
    toss(state, bottle.x + 40, bottle.y);
    step(state, FLIGHT_TIME);
    expect(state.score).toBe(0);
    expect(state.misses).toHaveLength(1);
  });

  it('does not score until the ring lands', () => {
    const state = createState();
    state.bottles = [{ ...bottle }];
    toss(state, bottle.x, bottle.y);
    step(state, FLIGHT_TIME / 2);
    expect(state.score).toBe(0);
    expect(state.ring).not.toBeNull();
  });

  it('scores a bottle only once', () => {
    expect(isRinger(bottle.x, bottle.y, bottle)).toBe(true);
    expect(isRinger(bottle.x, bottle.y, { ...bottle, ringed: true })).toBe(false);
  });

  it('scores bottles further back higher', () => {
    const { bottles } = createState();
    const back = bottles.reduce((a, b) => (b.y < a.y ? b : a));
    const front = bottles.reduce((a, b) => (b.y > a.y ? b : a));
    expect(back.points).toBeGreaterThan(front.points);
  });

  it('ends the round when the last ring lands', () => {
    const state = createState();
    state.rings = 1;
    toss(state, 0, 0);
    step(state, FLIGHT_TIME / 2);
    expect(state.phase).toBe('playing');
    step(state, FLIGHT_TIME);
    expect(state.phase).toBe('over');
  });
});
