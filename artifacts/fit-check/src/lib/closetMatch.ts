import { ClosetItem, ClosetData, StylePreference } from "./storage";
import { Recommendation } from "./recommend";

export interface ClosetMatchResult {
  tops?: ClosetItem;
  bottoms?: ClosetItem;
  outerwear?: ClosetItem;
  shoes?: ClosetItem;
  accessories?: ClosetItem;
}

// Keywords that indicate a type of accessory is needed
const ACCESSORY_KEYWORDS = [
  "beanie", "hat", "cap", "gloves", "scarf", "sunglasses", "glasses",
  "umbrella", "bag", "belt", "watch", "jewelry", "necklace", "bracelet",
  "socks", "boots", "tote", "backpack", "purse"
];

export function pickClosetItems(
  recommendation: Recommendation,
  closet: ClosetData,
  currentStyle: StylePreference
): ClosetMatchResult {
  const result: ClosetMatchResult = {};
  const recText = `${recommendation.mainOutfit} ${recommendation.outerwear || ""}`.toLowerCase();
  const accText = recommendation.accessories.join(" ").toLowerCase();

  const needsTops = /(shirt|tee|tank|sleeve|sweater|henley|flannel)/i.test(recText);
  const needsBottoms = /(pants|jeans|shorts|joggers|trousers|chinos|cargos|denim)/i.test(recText);
  const needsOuterwear = /(jacket|coat|parka|windbreaker|zip-up|mid-layer)/i.test(recText);
  const needsShoes = true;
  const needsAccessory = ACCESSORY_KEYWORDS.some(kw => accText.includes(kw));

  const pickItem = (items: ClosetItem[]) => {
    if (items.length === 0) return undefined;
    const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
    const styleMatches = sorted.filter(item => item.styles.includes(currentStyle));
    if (styleMatches.length > 0) {
      return styleMatches[Math.floor(Math.random() * Math.min(styleMatches.length, 3))];
    }
    return sorted[Math.floor(Math.random() * Math.min(sorted.length, 3))];
  };

  // For accessories, try keyword matching against item names first
  const pickAccessory = (items: ClosetItem[]) => {
    if (items.length === 0) return undefined;
    const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
    // Try to match an item whose name contains a relevant keyword
    const keywordMatch = sorted.find(item =>
      ACCESSORY_KEYWORDS.some(kw => item.name.toLowerCase().includes(kw)) ||
      recommendation.accessories.some(a => item.name.toLowerCase().includes(a.toLowerCase()))
    );
    if (keywordMatch) return keywordMatch;
    // Otherwise return any accessory from their closet
    return sorted[Math.floor(Math.random() * Math.min(sorted.length, 3))];
  };

  if (needsTops) result.tops = pickItem(closet.tops);
  if (needsBottoms) result.bottoms = pickItem(closet.bottoms);
  if (needsOuterwear) result.outerwear = pickItem(closet.outerwear);
  if (needsShoes) result.shoes = pickItem(closet.shoes);
  if (needsAccessory || (closet.accessories?.length ?? 0) > 0) {
    result.accessories = pickAccessory(closet.accessories ?? []);
  }

  return result;
}
