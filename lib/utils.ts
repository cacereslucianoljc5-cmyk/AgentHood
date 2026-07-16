// Minimal classnames joiner. This project uses hand-written CSS (no Tailwind),
// so `cn` just filters + joins truthy class strings.
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
