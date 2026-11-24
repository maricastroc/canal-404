export function eachKeyOnce(handler: (event: KeyboardEvent) => void) {
  const seen = new WeakSet<KeyboardEvent>();
  return (event: KeyboardEvent) => {
    if (seen.has(event)) return;
    seen.add(event);
    handler(event);
  };
}
