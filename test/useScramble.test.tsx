import React, { useEffect } from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useScramble } from '../src';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

function TestComponent(props: Parameters<typeof useScramble>[0] & { onRef?: (el: HTMLElement | null) => void }) {
  const { onRef, ...scrambleProps } = props;
  const { ref, replay } = useScramble(scrambleProps);

  useEffect(() => {
    onRef?.(ref.current);
  }, [ref.current]);

  return (
    <div>
      <p ref={ref} data-testid="target" />
      <button onClick={replay} data-testid="replay">
        Replay
      </button>
    </div>
  );
}

async function advanceAnimationFrames(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe('useScramble', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<TestComponent text="hello" />);
    expect(getByTestId('target')).toBeTruthy();
  });

  it('eventually resolves to the target text', async () => {
    const { getByTestId } = render(<TestComponent text="hello" />);
    const target = getByTestId('target');

    await advanceAnimationFrames(3000);

    await waitFor(() => {
      expect(target.textContent).toBe('hello');
    }, { timeout: 5000 });
  });

  it('fires onAnimationEnd when animation completes', async () => {
    const onEnd = vi.fn();
    render(
      <TestComponent text="hi" speed={1} step={5} scramble={1} chance={0} onAnimationEnd={onEnd} />
    );

    await advanceAnimationFrames(3000);

    await waitFor(() => {
      expect(onEnd).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('fires onAnimationStart on replay', async () => {
    const onStart = vi.fn();
    const { getByTestId } = render(
      <TestComponent text="test" onAnimationStart={onStart} />
    );

    await advanceAnimationFrames(2000);

    await act(async () => {
      getByTestId('replay').click();
    });

    expect(onStart).toHaveBeenCalled();
  });

  it('shows target text immediately when playOnMount is false', async () => {
    const { getByTestId } = render(
      <TestComponent text="static" playOnMount={false} />
    );

    await advanceAnimationFrames(100);

    expect(getByTestId('target').textContent).toBe('static');
  });

  it('does not animate when speed is 0', async () => {
    const onFrame = vi.fn();
    render(
      <TestComponent text="frozen" speed={0} onAnimationFrame={onFrame} />
    );

    await advanceAnimationFrames(1000);

    expect(onFrame).not.toHaveBeenCalled();
  });

  it('fires onAnimationFrame during animation', async () => {
    const onFrame = vi.fn();
    render(
      <TestComponent text="hello" speed={1} onAnimationFrame={onFrame} />
    );

    await advanceAnimationFrames(500);

    expect(onFrame).toHaveBeenCalled();
    expect(typeof onFrame.mock.calls[0][0]).toBe('string');
  });

  it('restarts animation on replay', async () => {
    const onEnd = vi.fn();
    const { getByTestId } = render(
      <TestComponent text="ab" speed={1} step={5} scramble={1} chance={0} onAnimationEnd={onEnd} />
    );

    await advanceAnimationFrames(2000);

    await waitFor(() => {
      expect(onEnd).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    await act(async () => {
      getByTestId('replay').click();
    });

    await advanceAnimationFrames(2000);

    await waitFor(() => {
      expect(onEnd).toHaveBeenCalledTimes(2);
    }, { timeout: 3000 });
  });

  it('handles empty text', () => {
    const { getByTestId } = render(<TestComponent text="" />);
    expect(getByTestId('target').textContent).toBe('');
  });

  it('handles text change', async () => {
    const { getByTestId, rerender } = render(<TestComponent text="first" />);

    await advanceAnimationFrames(3000);

    await waitFor(() => {
      expect(getByTestId('target').textContent).toBe('first');
    }, { timeout: 5000 });

    rerender(<TestComponent text="second" />);

    await advanceAnimationFrames(3000);

    await waitFor(() => {
      expect(getByTestId('target').textContent).toBe('second');
    }, { timeout: 5000 });
  });

  it('respects ignore characters', async () => {
    const { getByTestId } = render(
      <TestComponent
        text="a b"
        speed={1}
        step={5}
        scramble={1}
        chance={0}
        ignore={[' ']}
      />
    );

    await advanceAnimationFrames(3000);

    await waitFor(() => {
      expect(getByTestId('target').textContent).toBe('a b');
    }, { timeout: 5000 });
  });
});
