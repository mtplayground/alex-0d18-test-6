import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  registerGlobalErrorHandlers,
  renderFatalStartupError,
  reportClientError,
} from '../globalErrorHandlers';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('global error handlers', () => {
  it('reports normalized client errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const report = reportClientError('bootstrap', new Error('boom'));

    expect(report).toMatchObject({
      message: 'boom',
      source: 'bootstrap',
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      '[client-error]',
      expect.objectContaining({
        message: 'boom',
        source: 'bootstrap',
      }),
    );
  });

  it('registers removable window error handlers', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const target = {
      addEventListener,
      removeEventListener,
    } as unknown as Window;

    const unregister = registerGlobalErrorHandlers(target);

    expect(addEventListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );
    expect(addEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function),
    );

    unregister();

    expect(removeEventListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );
    expect(removeEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function),
    );
  });

  it('renders a fatal startup fallback into the mount container', () => {
    const classNames = new Set<string>();
    const container = {
      classList: {
        add: vi.fn((className: string) => {
          classNames.add(className);
        }),
        contains: (className: string) => classNames.has(className),
      },
      replaceChildren: vi.fn(),
      textContent: 'loading',
    } as unknown as HTMLElement;

    renderFatalStartupError(container);

    expect(container.classList.contains('fatal-error')).toBe(true);
    expect(container.replaceChildren).toHaveBeenCalled();
    expect(container.textContent).toBe('Unable to start the game.');
  });
});
