export function classNames(...c: string[]) {
  return c.filter(Boolean).join(" ");
}
