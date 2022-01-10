export function parseConfig<T = unknown>(config: string): T {
  return config ? (JSON.parse(config) as T) : null;
}
