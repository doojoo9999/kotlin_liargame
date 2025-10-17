import type {ReactNode} from 'react';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {axe} from 'vitest-axe';
import {render} from '@/test/utils/test-utils';
import type {PlayerStatusPanelProps} from '../PlayerStatusPanel';
import {PlayerStatusPanel} from '../PlayerStatusPanel';
import meta, {Default, WithLiarPerspective} from '../__stories__/PlayerStatusPanel.stories';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({children}: {children: ReactNode}) => <div data-testid="animate-presence">{children}</div>,
  motion: {
    div: ({children, layout: _layout, ...props}: any) => {
      void _layout;
      return <div {...props}>{children}</div>;
    },
  },
}));

let canvasContextSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeAll(() => {
  canvasContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null) as unknown as ReturnType<typeof vi.spyOn>;
});

afterAll(() => {
  canvasContextSpy?.mockRestore();
});

describe('PlayerStatusPanel stories', () => {
  const baseArgs = meta.args as PlayerStatusPanelProps;

  it('matches snapshot for default story', () => {
    const defaultProps = {
      ...baseArgs,
      ...((Default.args ?? {}) as Partial<PlayerStatusPanelProps>),
    } satisfies PlayerStatusPanelProps;

    const {asFragment} = render(<PlayerStatusPanel {...defaultProps} />);

    expect(asFragment()).toMatchSnapshot();
  });

  it('matches snapshot for liar perspective story', () => {
    const liarProps = {
      ...baseArgs,
      ...((WithLiarPerspective.args ?? {}) as Partial<PlayerStatusPanelProps>),
    } satisfies PlayerStatusPanelProps;

    const {asFragment} = render(<PlayerStatusPanel {...liarProps} />);

    expect(asFragment()).toMatchSnapshot();
  });

  it('has no accessibility violations for default configuration', async () => {
    const defaultProps = {
      ...baseArgs,
      ...((Default.args ?? {}) as Partial<PlayerStatusPanelProps>),
    } satisfies PlayerStatusPanelProps;

    const {container} = render(<PlayerStatusPanel {...defaultProps} />);

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
