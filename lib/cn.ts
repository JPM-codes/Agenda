export function cn(...classes: (string | number | boolean | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
