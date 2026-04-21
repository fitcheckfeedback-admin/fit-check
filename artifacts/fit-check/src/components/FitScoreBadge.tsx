import { cn } from "@/lib/utils";

interface FitScoreBadgeProps {
  score: number;
}

export function FitScoreBadge({ score }: FitScoreBadgeProps) {
  let colorClass = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800";
  
  if (score < 60) {
    colorClass = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800";
  } else if (score < 80) {
    colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800";
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 shadow-sm font-bold",
      colorClass
    )}>
      <span className="text-[10px] uppercase leading-none opacity-80 mb-0.5">Fit</span>
      <span className="text-sm leading-none">{score}</span>
    </div>
  );
}
