type ErrorSource =
  | 'bootstrap'
  | 'window.error'
  | 'window.unhandledrejection';

export type ClientErrorReport = {
  message: string;
  source: ErrorSource;
  stack?: string;
};

const normalizeError = (
  source: ErrorSource,
  error: unknown,
): ClientErrorReport => {
  if (error instanceof Error) {
    return {
      message: error.message || 'Unexpected client error.',
      source,
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }

  if (typeof error === 'string' && error.trim()) {
    return {
      message: error.trim(),
      source,
    };
  }

  return {
    message: 'Unexpected client error.',
    source,
  };
};

export const reportClientError = (
  source: ErrorSource,
  error: unknown,
): ClientErrorReport => {
  const report = normalizeError(source, error);

  console.error('[client-error]', report);

  return report;
};

export const registerGlobalErrorHandlers = (
  target: Window = window,
): (() => void) => {
  const handleError = (event: ErrorEvent): void => {
    reportClientError('window.error', event.error ?? event.message);
  };
  const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    reportClientError('window.unhandledrejection', event.reason);
  };

  target.addEventListener('error', handleError);
  target.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    target.removeEventListener('error', handleError);
    target.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
};

export const renderFatalStartupError = (
  container: HTMLElement | null,
): void => {
  const fallbackElement = container ?? document.body;

  fallbackElement.replaceChildren();
  fallbackElement.classList.add('fatal-error');
  fallbackElement.textContent = 'Unable to start the game.';
};
