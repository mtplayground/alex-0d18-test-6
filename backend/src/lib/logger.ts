type LogLevel = 'error' | 'info' | 'warn';

export type LogFields = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN = /(authorization|cookie|database_url|password|secret|token)/i;

const redactFields = (fields: LogFields = {}): LogFields =>
  Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : value,
    ]),
  );

const writeLog = (
  level: LogLevel,
  message: string,
  fields: LogFields = {},
): void => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...redactFields(fields),
  };
  const serializedPayload = JSON.stringify(payload);

  if (level === 'error') {
    console.error(serializedPayload);
    return;
  }

  if (level === 'warn') {
    console.warn(serializedPayload);
    return;
  }

  console.log(serializedPayload);
};

export const logger = {
  error(message: string, fields?: LogFields): void {
    writeLog('error', message, fields);
  },
  info(message: string, fields?: LogFields): void {
    writeLog('info', message, fields);
  },
  warn(message: string, fields?: LogFields): void {
    writeLog('warn', message, fields);
  },
};
