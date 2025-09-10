export function slugifyFilename(filename: string): string {
  // Remove path, lowercase, replace spaces and non-alphanum with dash, keep extension
  const parts = filename.split('.');
  const ext = parts.length > 1 ? '.' + parts.pop() : '';
  const base = parts.join('.');
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + ext.toLowerCase()
  );
}
