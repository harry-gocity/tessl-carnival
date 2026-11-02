import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const CASTS = 8;
export const DUCK_SPEED = 90;
export const DUCK_RADIUS = 18;
/** How far either side of the hook a duck can be and still get caught. */
export const CATCH_REACH = 22;
export const LOWER_TIME = 0.4;
export const RAISE_TIME = 0.5;
/** The number on the base of each duck, in order round the stream. */
export const DUCK_VALUES = [1, 3, 1, 5, 2, 1, 10, 2, 1, 3] as const;

// The stream is a loop: a straight along the front, a bend on the right, a
// straight along the back and a bend on the left.
export const STREAM = { left: 220, right: 580, centerY: 280, radius: 100 } as const;
const STRAIGHT = STREAM.right - STREAM.left;
const BEND = Math.PI * STREAM.radius;
export const LOOP_LENGTH = 2 * STRAIGHT + 2 * BEND;
/** The front straight, where the hook reaches the water. */
export const WATER_Y = STREAM.centerY + STREAM.radius;
const ROD_Y = 60;

export interface Duck {
  /** Distance round the stream from the left end of the front straight. */
  distance: number;
  value: number;
  /** True while the duck is on the hook, out of the stream. */
  hooked: boolean;
}

export interface Hook {
  x: number;
  /** 0 is up by the rod, 1 is down at the water. */
  depth: number;
  phase: 'up' | 'lowering' | 'raising';
  /** The duck on the hook, if any. */
  duck: Duck | null;
}

export interface Popup {
  x: number;
  y: number;
  value: number;
  age: number;
}

export interface HookADuckState {
  ducks: Duck[];
  hook: Hook;
  casts: number;
  score: number;
  popups: Popup[];
  phase: 'playing' | 'over';
}

export function createState(): HookADuckState {
  const spacing = LOOP_LENGTH / DUCK_VALUES.length;
  const ducks = DUCK_VALUES.map((value, i) => ({ distance: spacing * i, value, hooked: false }));
  return {
    ducks,
    hook: { x: WIDTH / 2, depth: 0, phase: 'up', duck: null },
    casts: CASTS,
    score: 0,
    popups: [],
    phase: 'playing',
  };
}

/** Where a duck `distance` round the stream sits on the canvas. */
export function streamPosition(distance: number): { x: number; y: number } {
  const d = ((distance % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH;
  const { left, right, centerY, radius } = STREAM;
  if (d < STRAIGHT) return { x: left + d, y: centerY + radius };
  if (d < STRAIGHT + BEND) {
    const angle = Math.PI / 2 - (d - STRAIGHT) / radius;
    return { x: right + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
  }
  if (d < 2 * STRAIGHT + BEND) return { x: right - (d - STRAIGHT - BEND), y: centerY - radius };
  const angle = -Math.PI / 2 - (d - 2 * STRAIGHT - BEND) / radius;
  return { x: left + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
}

/** True when the duck is on the front straight, within reach of a hook at `x`. */
export function isUnderHook(duck: Duck, x: number): boolean {
  if (duck.hooked) return false;
  const d = ((duck.distance % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH;
  if (d > STRAIGHT) return false;
  return Math.abs(streamPosition(d).x - x) <= CATCH_REACH;
}

/** Moves the hook along the rod. It only moves while it is up. */
export function aimHook(state: HookADuckState, x: number): void {
  if (state.hook.phase !== 'up') return;
  state.hook.x = Math.min(Math.max(x, STREAM.left), STREAM.right);
}

/** Lowers the hook, using one cast. Returns false if nothing happened. */
export function cast(state: HookADuckState): boolean {
  if (state.phase !== 'playing' || state.hook.phase !== 'up' || state.casts === 0) return false;
  state.hook.phase = 'lowering';
  state.casts -= 1;
  return true;
}

/** Advances the game by `dt` seconds. */
export function step(state: HookADuckState, dt: number): void {
  for (const duck of state.ducks) {
    duck.distance = (duck.distance + DUCK_SPEED * dt) % LOOP_LENGTH;
  }

  const { hook } = state;
  if (hook.phase === 'lowering') {
    hook.depth = Math.min(hook.depth + dt / LOWER_TIME, 1);
    if (hook.depth === 1) {
      const duck = state.ducks.find((d) => isUnderHook(d, hook.x));
      if (duck) {
        duck.hooked = true;
        hook.duck = duck;
        state.score += duck.value;
        state.popups.push({ x: hook.x, y: WATER_Y, value: duck.value, age: 0 });
      }
      hook.phase = 'raising';
    }
  } else if (hook.phase === 'raising') {
    hook.depth = Math.max(hook.depth - dt / RAISE_TIME, 0);
    if (hook.depth === 0) {
      // Put the caught duck back in the stream for the next cast.
      if (hook.duck) hook.duck.hooked = false;
      hook.duck = null;
      hook.phase = 'up';
    }
  }

  for (const popup of state.popups) popup.age += dt;
  state.popups = state.popups.filter((p) => p.age < 1);

  if (state.casts === 0 && hook.phase === 'up') state.phase = 'over';
}

function hookY(hook: Hook): number {
  return ROD_Y + hook.depth * (WATER_Y - ROD_Y);
}

function drawDuck(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const { colors } = theme;
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.ellipse(x, y, DUCK_RADIUS, DUCK_RADIUS * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + DUCK_RADIUS * 0.55, y - DUCK_RADIUS * 0.75, DUCK_RADIUS * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.stripeA;
  ctx.beginPath();
  ctx.moveTo(x + DUCK_RADIUS, y - DUCK_RADIUS * 0.85);
  ctx.lineTo(x + DUCK_RADIUS * 1.45, y - DUCK_RADIUS * 0.7);
  ctx.lineTo(x + DUCK_RADIUS, y - DUCK_RADIUS * 0.55);
  ctx.fill();
  ctx.fillStyle = colors.background;
  ctx.beginPath();
  ctx.arc(x + DUCK_RADIUS * 0.7, y - DUCK_RADIUS * 0.85, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function draw(ctx: CanvasRenderingContext2D, state: HookADuckState) {
  const { colors } = theme;
  const { left, right, centerY, radius } = STREAM;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  // The stream: a wooden trough with water running round it.
  const loop = (width: number, style: string) => {
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(left, centerY + radius);
    ctx.lineTo(right, centerY + radius);
    ctx.arc(right, centerY, radius, Math.PI / 2, -Math.PI / 2, true);
    ctx.lineTo(left, centerY - radius);
    ctx.arc(left, centerY, radius, -Math.PI / 2, Math.PI / 2, true);
    ctx.stroke();
  };
  loop(DUCK_RADIUS * 3, colors.wood);
  loop(DUCK_RADIUS * 2.2, colors.water);

  for (const duck of state.ducks) {
    if (duck.hooked) continue;
    const { x, y } = streamPosition(duck.distance);
    drawDuck(ctx, x, y);
  }

  // The rod along the top, and the hook on its line.
  const { hook } = state;
  const y = hookY(hook);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(left - 40, ROD_Y - 14, right - left + 80, 8);
  ctx.strokeStyle = colors.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hook.x, ROD_Y - 6);
  ctx.lineTo(hook.x, y);
  ctx.stroke();
  if (hook.duck) drawDuck(ctx, hook.x, y + DUCK_RADIUS);
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hook.x - 6, y, 6, 0, Math.PI);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = canvasFont('title', 'bold');
  for (const popup of state.popups) {
    ctx.globalAlpha = 1 - popup.age;
    ctx.fillStyle = colors.accent;
    ctx.fillText(`+${popup.value}`, popup.x, popup.y - 40 - popup.age * 60);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Casts ${state.casts}/${CASTS}`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of casts! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const hookADuck: CarnivalGame = {
  id: 'hook-a-duck',
  name: 'Hook a Duck',
  description:
    'Lower the hook to catch the ducks floating by. Each duck scores the number on its base.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;

    const toCanvasX = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return ((event.clientX - rect.left) / rect.width) * WIDTH;
    };
    const onMove = (event: PointerEvent) => aimHook(state, toCanvasX(event));
    const onDown = (event: PointerEvent) => {
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
      } else {
        aimHook(state, toCanvasX(event));
        cast(state);
      }
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(hookADuck.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default hookADuck;
