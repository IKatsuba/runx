export function parseGitignore(gitignore: string) {
  const values = gitignore.split('\n').map((file) => file.trim()).filter(
    (file) => {
      if (!file) {
        return false;
      }

      if (file.startsWith('#')) {
        return false;
      }

      return true;
    },
  );

  // format to glob patterns
  return values.map((value) => {
    if (value.endsWith('/')) {
      value = `${value}**`;
    }

    if (value.startsWith('/')) {
      value = `**${value}`;
    }

    return value;
  });
}
