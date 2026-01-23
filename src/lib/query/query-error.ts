import { showMessage } from 'react-native-flash-message';

const FALLBACK_MESSAGE = 'Something went wrong';

function extractMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    if (
      'error' in error &&
      (error as { error?: unknown }).error &&
      typeof (error as { error?: { message?: unknown } }).error?.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }
  }
  return FALLBACK_MESSAGE;
}

export function showQueryError(error: unknown): void {
  showMessage({
    message: 'Error',
    description: extractMessage(error),
    type: 'danger',
    duration: 4000,
    icon: 'danger',
  });
}
