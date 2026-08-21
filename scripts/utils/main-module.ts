export function isMainModule(url: string, argv = process.argv[1]) {
  if (!argv) return false;
  const href = url.startsWith('file://') ? url : `file://${url}`;
  const entry = argv.replace(/\\/g, '/');
  return href.endsWith(entry) || href.endsWith(entry.replace(/^\//, ''));
}
