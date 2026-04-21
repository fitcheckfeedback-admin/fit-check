import { ClosetItem, ClosetData, StylePreference } from "./storage";
import { Recommendation } from "./recommend";

export interface ClosetMatchResult {
  tops?: ClosetItem;
  bottoms?: ClosetItem;
  outerwear?: ClosetItem;
  shoes?: ClosetItem;
}

export function pickClosetItems(
  recommendation: Recommendation,
  closet: ClosetData,
  currentStyle: StylePreference
): ClosetMatchResult {
  const result: ClosetMatchResult = {};
  const recText = `${recommendation.mainOutfit} ${recommendation.outerwear || ""}`.toLowerCase();

  const needsTops = /(shirt|tee|tank|sleeve|sweater|henley|flannel)/i.test(recText);
  const needsBottoms = /(pants|jeans|shorts|joggers|trousers|chinos|cargos|denim)/i.test(recText);
  const needsOuterwear = /(jacket|coat|parka|windbreaker|zip-up|mid-layer)/i.test(recText);
  // Always include shoes if user has them, otherwise try matching
  const needsShoes = true; 

  const pickItem = (items: ClosetItem[]) => {
    if (items.length === 0) return undefined;
    
    const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
    const styleMatches = sorted.filter(item => item.styles.includes(currentStyle));
    
    if (styleMatches.length > 0) {
      return styleMatches[Math.floor(Math.random() * Math.min(styleMatches.length, 3))]; // Random from top 3
    }
    
    return sorted[Math.floor(Math.random() * Math.min(sorted.length, 3))];
  };

  if (needsTops) result.tops = pickItem(closet.tops);
  if (needsBottoms) result.bottoms = pickItem(closet.bottoms);
  if (needsOuterwear) result.outerwear = pickItem(closet.outerwear);
  if (needsShoes) result.shoes = pickItem(closet.shoes);

  return result;
}
