import { ExternalLink } from "lucide-react";
import { Deal, openDealLink } from "@/lib/deals";

/**
 * Renders web deal results (StylistChat, voice assistant, trip packing).
 * Sponsored placements always carry a visible "Sponsored" badge (FTC).
 */
export function DealResults({ deals }: { deals: Deal[] }) {
  if (deals.length === 0) return null;
  return (
    <div className="space-y-2 mt-2">
      {deals.map((d, i) => (
        <button
          key={d.id ?? `${d.url}-${i}`}
          onClick={() => openDealLink(d.url, d.sponsored ? d.id : undefined)}
          className="w-full text-left bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-3 flex items-start gap-3 active:scale-[0.99] transition-transform"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">{d.name}</span>
              {d.sponsored && (
                <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  Sponsored
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {d.brand && <span className="font-semibold">{d.brand}</span>}
              {d.price && <span className="font-bold text-orange-600 dark:text-orange-400">{d.price}</span>}
              {d.retailer && <span className="truncate">· {d.retailer}</span>}
            </div>
            {d.why && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">{d.why}</p>}
          </div>
          <ExternalLink className="w-4 h-4 shrink-0 mt-1 text-neutral-400" />
        </button>
      ))}
    </div>
  );
}
