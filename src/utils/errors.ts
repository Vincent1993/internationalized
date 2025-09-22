import packageInfo from '../../package.json';

interface ThrowIntlErrorOptions {
  module: string;
  message: string;
  cause?: unknown;
}

const packageSegment = `[${packageInfo.name}@${packageInfo.version}]`;

function buildErrorMessage(module: string, message: string): string {
  const moduleSegment = module ? `[${module}]` : '';
  return `${packageSegment}${moduleSegment} ${message}`.trim();
}

export function throwIntlError({ module, message, cause }: ThrowIntlErrorOptions): never {
  const errorMessage = buildErrorMessage(module, message);
  const error: Error & { cause?: unknown } = new Error(errorMessage);

  if (cause !== undefined) {
    error.cause = cause;
  }

  throw error;
}

export { buildErrorMessage, type ThrowIntlErrorOptions };
