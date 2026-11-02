import { describe, expect, it } from 'vitest';
import {
  CASTS,
  CATCH_REACH,
  DUCK_SPEED,
  DUCK_VALUES,
  LOOP_LENGTH,
  LOWER_TIME,
  RAISE_TIME,
  STREAM,
  WATER_Y,
  aimHook,
  cast,
  createState,
  isUnderHook,
  step,
  streamPosition,
} from './game';

/** Runs a whole cast: lower, catch or miss, and raise again. */
function finishCast(state: ReturnType<typeof createState>) {
  step(state, LOWER_TIME);
  step(state, RAISE_TIME);
}

describe('hook a duck', () => {
  it('starts with every cast left, no score and the hook up', () => {
    const state = createState();
    expect(state.casts).toBe(CASTS);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.hook.phase).toBe('up');
    expect(state.ducks.map((d) => d.value)).toEqual([...DUCK_VALUES]);
  });

  it('floats the ducks round the stream in a loop', () => {
    expect(streamPosition(0)).toEqual({ x: STREAM.left, y: WATER_Y });
    const back = streamPosition(LOOP_LENGTH / 2);
    expect(back.x).toBeCloseTo(STREAM.right);
    expect(back.y).toBeCloseTo(STREAM.centerY - STREAM.radius);
    const round = streamPosition(LOOP_LENGTH + 10);
    expect(round.x).toBeCloseTo(STREAM.left + 10);
  });

  it('uses one cast each time the hook goes down', () => {
    const state = createState();
    expect(cast(state)).toBe(true);
    expect(state.casts).toBe(CASTS - 1);
    expect(state.hook.phase).toBe('lowering');
  });

  it('cannot cast again until the hook is back up', () => {
    const state = createState();
    cast(state);
    expect(cast(state)).toBe(false);
    expect(state.casts).toBe(CASTS - 1);
  });

  it('only moves the hook while it is up, and keeps it over the stream', () => {
    const state = createState();
    aimHook(state, 0);
    expect(state.hook.x).toBe(STREAM.left);
    cast(state);
    aimHook(state, 400);
    expect(state.hook.x).toBe(STREAM.left);
  });

  it('scores the number on the base of the duck it catches', () => {
    const state = createState();
    state.ducks = [{ distance: 200, value: 5, hooked: false }];
    // Aim where the duck will be when the hook reaches the water.
    aimHook(state, streamPosition(200 + DUCK_SPEED * LOWER_TIME).x);
    cast(state);
    step(state, LOWER_TIME);
    expect(state.score).toBe(5);
    expect(state.hook.duck).toBe(state.ducks[0]);
    expect(state.ducks[0].hooked).toBe(true);
  });

  it('scores nothing when no duck is under the hook', () => {
    const state = createState();
    state.ducks = [{ distance: LOOP_LENGTH / 2, value: 10, hooked: false }];
    cast(state);
    finishCast(state);
    expect(state.score).toBe(0);
    expect(state.hook.phase).toBe('up');
  });

  it('puts a caught duck back in the stream once the hook is up', () => {
    const state = createState();
    state.ducks = [{ distance: 100, value: 1, hooked: false }];
    aimHook(state, streamPosition(100 + DUCK_SPEED * LOWER_TIME).x);
    cast(state);
    finishCast(state);
    expect(state.score).toBe(1);
    expect(state.ducks[0].hooked).toBe(false);
    expect(state.hook.duck).toBeNull();
  });

  it('only reaches ducks on the front of the stream, near the hook', () => {
    const duck = { distance: 100, value: 1, hooked: false };
    const x = streamPosition(100).x;
    expect(isUnderHook(duck, x)).toBe(true);
    expect(isUnderHook(duck, x + CATCH_REACH + 1)).toBe(false);
    expect(isUnderHook({ ...duck, distance: LOOP_LENGTH / 2 }, STREAM.right)).toBe(false);
    expect(isUnderHook({ ...duck, hooked: true }, x)).toBe(false);
  });

  it('ends the round once the last cast is back up', () => {
    const state = createState();
    state.casts = 1;
    cast(state);
    step(state, LOWER_TIME);
    expect(state.phase).toBe('playing');
    step(state, RAISE_TIME);
    expect(state.phase).toBe('over');
    expect(cast(state)).toBe(false);
  });
});
