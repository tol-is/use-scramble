import { useEffect, useRef, useState } from 'react';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomChar(range: RangeOrCharCodes) {
  let rand = 0;
  if (range.length === 2) {
    rand = getRandomInt(range[0], range[1]);
  } else {
    rand = range[getRandomInt(0, range.length - 1)];
  }

  return String.fromCharCode(rand);
}

type RangeOrCharCodes = [number, number] | number[];

export type UseScrambleProps = {
  /**
   * When playOnMount is true, the animation will not play the first time a text input is provided.
   */
  playOnMount?: boolean;
  /**
   * Optional text input
   */
  text?: string;
  /**
   * 0-1 range that determines the scramble speed. A speed of 1 will redraw 60 times a second. A speed of 0 will pause the animation
   *
   * @default 1
   */
  speed?: number;
  /**
   * The controller will move forward along the text input and scramble more characters, at a pace of `tick` frames. Combined with the `speed` prop, you can control the animation rate
   *
   * @default 1
   */
  tick?: number;
  /**
   * Step forward on every tick
   *
   * @default 1
   */
  step?: number;

  /**
   * Chance of scrambling a character, range from 0 to 1, 0 being no chance, and 1 being 100% chance
   */
  chance?: number;
  /**
   * Randomize `seed` characters at random text positions
   *
   * @default 1
   */
  seed?: number;
  /**
   * How many times to scramble each character?
   *
   * @default 1
   */
  scramble?: number;
  /**
   * Characters to avoid scrambling
   */
  ignore?: string[];

  /**
   * Unicode character range for scrambler.
   *
   * If a tupple is provided [60,125], it will randomly choose a unicode character code within that range.
   *
   * If the array contains more than two unicode values, it will choose randomly from the array values only.
   *
   * To randomize with only two values, you can repeat them in the array [91,93,91,93]
   *
   * @default [65,125]
   */
  range?: RangeOrCharCodes;
  /**
   * Set the animation to overdrive mode, and set the unicode character code to use in the animation
   */
  overdrive?: boolean | number;
  /**
   * Always start text animation from an empty string
   *
   * @default false
   */
  overflow?: boolean;

  /**
   * Delay in milliseconds before the animation starts.
   * Applies to both initial mount and replay.
   *
   * @default 0
   */
  delay?: number;

  /**
   * Direction in which characters are resolved during the animation.
   *
   * - `ltr`: left to right (default)
   * - `rtl`: right to left
   * - `random`: characters resolve in random order
   *
   * @default 'ltr'
   */
  direction?: 'ltr' | 'rtl' | 'random';

  /**
   * Callback when animation starts drawing
   */
  onAnimationStart?: () => void;

  /**
   * Callback for when the animation finished
   */
  onAnimationEnd?: () => void;

  /**
   * onRedraw callback
   */
  onAnimationFrame?: (result: string) => void;
};

export const useScramble = <T extends HTMLElement = HTMLElement>(
  props: UseScrambleProps
) => {
  let {
    playOnMount = true,
    text = '',
    speed = 1,
    seed = 1,
    step = 1,
    tick = 1,
    scramble = 1,
    chance = 1,
    overflow = true,
    delay = 0,
    direction = 'ltr',
    range = [65, 125],
    overdrive = true,
    onAnimationStart,
    onAnimationFrame,
    onAnimationEnd,
    ignore = [' '],
  } = props;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  if (prefersReducedMotion) {
    step = text.length;
    chance = 0;
    overdrive = false;
  }

  const nodeRef = useRef<T>(null);
  const rafRef = useRef<number>(0);
  const elapsedRef = useRef(0);
  const stepRef = useRef<number>(0);
  const scrambleIndexRef = useRef<number>(0);
  const controlRef = useRef<Array<string | number | null>>([]);
  const overdriveRef = useRef<number>(0);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(false);
  const resolveOrderRef = useRef<number[]>([]);
  const enteredRef = useRef<boolean[]>([]);

  const buildResolveOrder = () => {
    const indices = Array.from({ length: text.length }, (_, i) => i);
    if (direction === 'rtl') {
      indices.reverse();
    } else if (direction === 'random') {
      for (let i = indices.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i);
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
    }
    return indices;
  };

  const setIfNotIgnored = (
    value: string | number | null,
    replace: string | number | null
  ) => (ignore.includes(`${value}`) ? value : replace);

  const seedForward = () => {
    if (scrambleIndexRef.current === text.length) return;

    for (let i = 0; i < seed; i++) {
      const unresolvedStart = scrambleIndexRef.current;
      const unresolvedEnd = resolveOrderRef.current.length;
      if (unresolvedStart >= unresolvedEnd) return;

      const orderIdx = getRandomInt(unresolvedStart, unresolvedEnd - 1);
      const index = resolveOrderRef.current[orderIdx];

      if (
        typeof controlRef.current[index] !== 'number' &&
        typeof controlRef.current[index] !== 'undefined'
      ) {
        controlRef.current[index] = setIfNotIgnored(
          controlRef.current[index],
          getRandomInt(0, 10) >= (1 - chance) * 10 ? scramble || seed : 0
        );
      }
    }
  };

  const stepForward = () => {
    for (let i = 0; i < step; i++) {
      if (scrambleIndexRef.current < text.length) {
        const currentIndex = resolveOrderRef.current[scrambleIndexRef.current];

        const shouldScramble = getRandomInt(0, 10) >= (1 - chance) * 10;

        controlRef.current[currentIndex] = setIfNotIgnored(
          text[currentIndex],
          shouldScramble
            ? scramble + getRandomInt(0, Math.ceil(scramble / 2))
            : 0
        );
        enteredRef.current[currentIndex] = true;
        scrambleIndexRef.current++;
      }
    }
  };

  const resizeControl = () => {
    if (text.length < controlRef.current.length) {
      controlRef.current.pop();
      controlRef.current.splice(text.length, step);
    }
    for (let i = 0; i < step; i++) {
      if (controlRef.current.length < text.length) {
        controlRef.current.push(
          setIfNotIgnored(text[controlRef.current.length + 1], null)
        );
      }
    }
  };

  const onOverdrive = () => {
    if (!overdrive) return;

    for (let i = 0; i < step; i++) {
      const max = Math.max(controlRef.current.length, text.length);
      if (overdriveRef.current < max) {
        const index = overdriveRef.current < resolveOrderRef.current.length
          ? resolveOrderRef.current[overdriveRef.current]
          : overdriveRef.current;
        controlRef.current[index] = setIfNotIgnored(
          text[index],
          String.fromCharCode(typeof overdrive === 'boolean' ? 95 : overdrive)
        );
        overdriveRef.current++;
      }
    }
  };

  const onTick = () => {
    stepForward();
    resizeControl();
    seedForward();
  };

  const draw = () => {
    if (!nodeRef.current) return;

    let result = '';

    for (let i = 0; i < controlRef.current.length; i++) {
      const controlValue = controlRef.current[i];

      switch (true) {
        case typeof controlValue === 'number' && controlValue > 0:
          result += getRandomChar(range);

          if (enteredRef.current[i]) {
            controlRef.current[i] = (controlRef.current[i] as number) - 1;
          }
          break;

        case typeof controlValue === 'string' &&
          (i >= text.length || !enteredRef.current[i]):
          result += controlValue;
          break;

        case controlValue === text[i] && !!enteredRef.current[i]:
          result += text[i];
          break;

        case controlValue === 0 && i < text.length:
          result += text[i];
          controlRef.current[i] = text[i];
          break;

        default:
          result += '';
      }
    }

    nodeRef.current.textContent = result;

    onAnimationFrame && onAnimationFrame(result);

    if (result === text) {
      controlRef.current.splice(text.length, controlRef.current.length);
      onAnimationEnd && onAnimationEnd();

      cancelAnimationFrame(rafRef.current);
    }

    stepRef.current++;
  };

  /**
   * Ref holding the latest frame handler, updated every render.
   * The rAF loop calls through this ref so it always uses fresh
   * closures without needing to re-fire effects.
   */
  const frameRef = useRef<(time: number) => void>(null!);
  frameRef.current = (time: number) => {
    rafRef.current = requestAnimationFrame((t) => frameRef.current(t));

    if (!speed) return;

    onOverdrive();

    const fpsInterval = 1000 / (60 * speed);
    const timeElapsed = time - elapsedRef.current;
    if (timeElapsed > fpsInterval) {
      elapsedRef.current = time;

      if (stepRef.current % tick === 0) {
        onTick();
      }

      draw();
    }
  };

  const reset = () => {
    stepRef.current = 0;
    scrambleIndexRef.current = 0;
    overdriveRef.current = 0;
    resolveOrderRef.current = buildResolveOrder();
    enteredRef.current = new Array(text.length).fill(false);
    if (!overflow) {
      controlRef.current = new Array(text?.length);
    }
  };

  const startAnimation = () => {
    onAnimationStart && onAnimationStart();
    rafRef.current = requestAnimationFrame((t) => frameRef.current(t));
  };

  const play = () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(delayTimerRef.current);
    reset();
    if (delay > 0) {
      delayTimerRef.current = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (!playOnMount) {
        resolveOrderRef.current = buildResolveOrder();
        enteredRef.current = new Array(text.length).fill(true);
        controlRef.current = text.split('');
        stepRef.current = text.length;
        scrambleIndexRef.current = text.length;
        overdriveRef.current = text.length;
        if (nodeRef.current) {
          nodeRef.current.textContent = text;
        }
        return;
      }
    }

    cancelAnimationFrame(rafRef.current);
    clearTimeout(delayTimerRef.current);
    reset();
    elapsedRef.current = 0;

    if (delay > 0) {
      delayTimerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame((t) => frameRef.current(t));
      }, delay);
    } else {
      rafRef.current = requestAnimationFrame((t) => frameRef.current(t));
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(delayTimerRef.current);
    };
  }, [text]);

  return { ref: nodeRef, replay: play };
};
