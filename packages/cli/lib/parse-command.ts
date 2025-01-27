function parseTokens(part: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < part.length; i++) {
    const char = part[i];

    // Handle quotes
    if ((char === '"' || char === "'") && part[i - 1] !== '\\') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar) {
        inQuotes = false;
        current += char;
        tokens.push(current);
        current = '';
      } else {
        current += char;
      }
      continue;
    }

    // Handle spaces
    if (char === ' ' && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

export interface CommandSegment {
  env: Record<string, string>;
  command: string;
  args: string[];
}

export function parseFullCommand(cmd: string) {
  const parts = cmd.trim().split(/(\|\|?|&&?)/).map((p) => p.trim()).filter(
    Boolean,
  );
  const segments: (CommandSegment | string)[] = [];

  for (const part of parts) {
    if (['&&', '||', '&', '|'].includes(part)) {
      segments.push(part);
      continue;
    }

    const env: Record<string, string> = {};
    let remainingPart = part;

    // Parse env vars
    const envRegex = /^(\w[\w\d_]*=\S+)\s*/;
    let match: RegExpExecArray | null;

    while ((match = envRegex.exec(remainingPart))) {
      const [envPart] = match;
      const [key, ...valParts] = envPart.split('=');
      env[key] = valParts.map((p) => p.trim()).join('=');
      remainingPart = remainingPart.slice(envPart.length).trim();
    }

    // Parse command and args
    const tokens = parseTokens(remainingPart);
    const command = tokens.shift() || '';
    const args = tokens;

    segments.push({
      env,
      command,
      args,
    });
  }

  return segments;
}
