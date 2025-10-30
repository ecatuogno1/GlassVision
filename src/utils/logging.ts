interface LogPayload {
  message: string;
  context?: Record<string, unknown>;
  error?: unknown;
}

function formatContext(context?: Record<string, unknown>) {
  if (!context) {
    return '';
  }
  try {
    return JSON.stringify(context);
  } catch (error) {
    return '[unserializable context]';
  }
}

export function logEvent(payload: LogPayload) {
  const timestamp = new Date().toISOString();
  const details = formatContext(payload.context);
  // eslint-disable-next-line no-console
  console.info(`[GlassVision][${timestamp}] ${payload.message}${details ? ` :: ${details}` : ''}`);
}

export function logError(payload: LogPayload) {
  const timestamp = new Date().toISOString();
  const details = formatContext(payload.context);
  // eslint-disable-next-line no-console
  console.error(`[GlassVision][${timestamp}] ${payload.message}${details ? ` :: ${details}` : ''}`);
  if (payload.error instanceof Error && typeof window !== 'undefined') {
    if (!window.__glassVisionErrors) {
      Object.defineProperty(window, '__glassVisionErrors', {
        value: [],
        writable: false,
        configurable: true,
      });
    }
    try {
      (window.__glassVisionErrors as Error[]).push(payload.error);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist error to window for diagnostics', err);
    }
  }
}

declare global {
  interface Window {
    __glassVisionErrors?: Error[];
  }
}

export function safeExecute<T>(callback: () => T, fallback: T, context?: string): T {
  try {
    return callback();
  } catch (error) {
    logError({
      message: `Safe execution failed${context ? ` in ${context}` : ''}`,
      error,
    });
    return fallback;
  }
}
