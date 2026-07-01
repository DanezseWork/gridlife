import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<number>();

export function runWithTimezoneOffset<T>(
  offsetMinutes: number,
  fn: () => T,
): T {
  return storage.run(offsetMinutes, fn);
}

export function getTimezoneOffsetMinutes(): number {
  return storage.getStore() ?? 0;
}

export function parseTimezoneOffsetHeader(
  value: string | string[] | undefined,
): number {
  if (value === undefined) {
    return 0;
  }

  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}
