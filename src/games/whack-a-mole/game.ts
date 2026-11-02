import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const ROUND_SECONDS = 30;
export const POINTS_PER_WHACK = 10;
export const HOLE_RADIUS = 50;
const COLUMNS = [200, 400, 600];
const ROWS = [140, 260, 380];

export interface Hole {
  x: number;
  y: number;
  /** Seconds the mole in this hole stays up; 0 when the hole is empty. */
  upFor: number;
}

export interface Bonk {
  x: number;
  y: number;
  age: number;
}

export interface WhackAMoleState {
  holes: Hole[];
  bonks: Bonk[];
  /** Seconds until the next mole pops up. */
  nextMole: number;
  elapsed: number;
  score: number;
  phase: 'playing' | 'over';
}

export function createState(): WhackAMoleState {
  const holes = ROWS.flatMap((y) => COLUMNS.map((x) => ({ x, y, upFor: 0 })));
  return { holes, bonks: [], nextMole: popInterval(0), elapsed: 0, score: 0, phase: 'playing' };
}

/** Seconds between moles: 1.2 at the start, down to 0.4 by the end of the round. */
export function popInterval(elapsed: number): number {
  return 1.2 - 0.8 * Math.min(elapsed / ROUND_SECONDS, 1);
}

/** Seconds a mole stays up: 1.5 at the start, down to 0.6 by the end of the round. */
export function upTime(elapsed: number): number {
  return 1.5 - 0.9 * Math.min(elapsed / ROUND_SECONDS, 1);
}

export function timeLeft(state: WhackAMoleState): number {
  return Math.max(ROUND_SECONDS - state.elapsed, 0);
}

export function isOver(hole: Hole, x: number, y: number): boolean {
  return Math.hypot(x - hole.x, y - hole.y) <= HOLE_RADIUS;
}

/** Whacks at a point. Returns true if it hit a mole that was up. */
export function whack(state: WhackAMoleState, x: number, y: number): boolean {
  if (state.phase !== 'playing') return false;
  const hole = state.holes.find((h) => h.upFor > 0 && isOver(h, x, y));
  if (!hole) return false;
  hole.upFor = 0;
  state.score += POINTS_PER_WHACK;
  state.bonks.push({ x: hole.x, y: hole.y, age: 0 });
  return true;
}

/**
 * Advances the game by `dt` seconds. `random` returns a number in [0, 1) and
 * picks which empty hole the next mole pops up from.
 */
export function step(state: WhackAMoleState, dt: number, random: () => number = Math.random) {
  for (const bonk of state.bonks) bonk.age += dt;
  state.bonks = state.bonks.filter((b) => b.age < 0.3);
  if (state.phase !== 'playing') return;

  if (state.elapsed + dt >= ROUND_SECONDS) {
    state.elapsed = ROUND_SECONDS;
    for (const hole of state.holes) hole.upFor = 0;
    state.phase = 'over';
    return;
  }

  // Split the step at every mole that falls due inside it, so a big step
  // plays out the same as many small ones.
  let left = dt;
  while (state.nextMole <= left) {
    const wait = state.nextMole;
    advance(state, wait);
    left -= wait;
    const empty = state.holes.filter((h) => h.upFor === 0);
    if (empty.length > 0) {
      empty[Math.floor(random() * empty.length)].upFor = upTime(state.elapsed);
    }
    state.nextMole = popInterval(state.elapsed);
  }
  advance(state, left);
  state.nextMole -= left;
}

function advance(state: WhackAMoleState, dt: number) {
  state.elapsed += dt;
  for (const hole of state.holes) hole.upFor = Math.max(hole.upFor - dt, 0);
}

function draw(ctx: CanvasRenderingContext2D, state: WhackAMoleState) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  for (const hole of state.holes) {
    ctx.fillStyle = colors.surface;
    ctx.beginPath();
    ctx.ellipse(hole.x, hole.y + 20, HOLE_RADIUS, HOLE_RADIUS * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (hole.upFor > 0) {
      ctx.fillStyle = colors.wood;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, HOLE_RADIUS * 0.6, Math.PI, 0);
      ctx.lineTo(hole.x + HOLE_RADIUS * 0.6, hole.y + 20);
      ctx.lineTo(hole.x - HOLE_RADIUS * 0.6, hole.y + 20);
      ctx.fill();
      ctx.fillStyle = colors.text;
      ctx.beginPath();
      ctx.arc(hole.x - 10, hole.y - 8, 4, 0, Math.PI * 2);
      ctx.arc(hole.x + 10, hole.y - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.stripeA;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y + 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = colors.wood;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(hole.x, hole.y + 20, HOLE_RADIUS, HOLE_RADIUS * 0.4, 0, 0, Math.PI);
    ctx.stroke();
  }

  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  for (const bonk of state.bonks) {
    ctx.globalAlpha = 1 - bonk.age / 0.3;
    ctx.beginPath();
    ctx.arc(bonk.x, bonk.y, 15 + bonk.age * 120, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Time ${Math.ceil(timeLeft(state))}s`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Time's up! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const whackAMole: CarnivalGame = {
  id: 'whack-a-mole',
  name: 'Whack-a-Mole',
  description: 'Whack the moles before they duck back down. They get quicker as the clock runs.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;

    const onDown = (event: PointerEvent) => {
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      whack(
        state,
        ((event.clientX - rect.left) / rect.width) * WIDTH,
        ((event.clientY - rect.top) / rect.height) * HEIGHT,
      );
    };
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't skip the round.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(whackAMole.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default whackAMole;
