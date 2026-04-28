import { ClosetMatchResult } from "./closetMatch";

export function buildClosetDescription(match: ClosetMatchResult): string | null {
  const { outerwear, tops, bottoms, shoes } = match;
  const hasAny = outerwear || tops || bottoms || shoes;
  if (!hasAny) return null;

  if (outerwear && tops && bottoms) {
    let desc = `Your ${outerwear.name} over your ${tops.name}, with your ${bottoms.name}`;
    if (shoes) desc += ` and your ${shoes.name}`;
    return desc;
  }

  if (outerwear && bottoms && !tops) {
    let desc = `Your ${outerwear.name} with your ${bottoms.name}`;
    if (shoes) desc += ` and your ${shoes.name}`;
    return desc;
  }

  if (outerwear && tops && !bottoms) {
    let desc = `Your ${outerwear.name} over your ${tops.name}`;
    if (shoes) desc += ` with your ${shoes.name}`;
    return desc;
  }

  if (tops && bottoms) {
    let desc = `Your ${tops.name} with your ${bottoms.name}`;
    if (shoes) desc += ` and your ${shoes.name}`;
    return desc;
  }

  if (tops && shoes) return `Your ${tops.name} with your ${shoes.name}`;
  if (bottoms && shoes) return `Your ${bottoms.name} with your ${shoes.name}`;

  const available = [outerwear, tops, bottoms, shoes].filter(Boolean);
  if (available.length === 1) return `Your ${available[0]!.name}`;
  return available.map(i => `your ${i!.name}`).join(", ");
}
