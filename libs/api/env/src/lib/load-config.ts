export function loadConfig<T = unknown>(envVar: string): T {
  return envVar ? (JSON.parse(envVar) as T) : null;
}
