const isSupabaseAuthFetchNoise = (error: unknown) => {
  const candidate = error as { message?: unknown; stack?: unknown };
  const message = typeof candidate?.message === 'string' ? candidate.message : String(error ?? '');
  const stack = typeof candidate?.stack === 'string' ? candidate.stack : String(error ?? '');
  return message.includes('Failed to fetch') && stack.includes('_getUser');
};

const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (args.some(isSupabaseAuthFetchNoise)) {
    return;
  }
  originalConsoleError(...args);
};

window.addEventListener('unhandledrejection', (event) => {
  if (isSupabaseAuthFetchNoise(event.reason)) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (isSupabaseAuthFetchNoise(event.error)) {
    event.preventDefault();
  }
});

void import('./bootstrap');
