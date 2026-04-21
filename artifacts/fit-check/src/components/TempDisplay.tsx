import { formatTemp } from "@/lib/format";

interface TempDisplayProps {
  tempF: number;
  units: "f" | "c";
}

export function TempDisplay({ tempF, units }: TempDisplayProps) {
  const formatted = formatTemp(tempF, units);
  return (
    <div className="text-7xl font-bold tracking-tighter text-foreground">
      {formatted}
    </div>
  );
}
