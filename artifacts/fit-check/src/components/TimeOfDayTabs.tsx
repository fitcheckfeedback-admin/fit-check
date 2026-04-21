import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Recommendation } from "@/lib/recommend";
import { OutfitCard } from "./OutfitCard";

interface TimeOfDayTabsProps {
  morning: Recommendation;
  afternoon: Recommendation;
  evening: Recommendation;
}

export function TimeOfDayTabs({ morning, afternoon, evening }: TimeOfDayTabsProps) {
  return (
    <Tabs defaultValue="afternoon" className="w-full mt-8">
      <TabsList className="w-full grid grid-cols-3 mb-6 rounded-2xl h-12 p-1">
        <TabsTrigger value="morning" className="rounded-xl text-sm font-medium">Morning</TabsTrigger>
        <TabsTrigger value="afternoon" className="rounded-xl text-sm font-medium">Afternoon</TabsTrigger>
        <TabsTrigger value="evening" className="rounded-xl text-sm font-medium">Evening</TabsTrigger>
      </TabsList>
      <TabsContent value="morning" className="mt-0 outline-none">
        <OutfitCard recommendation={morning} />
      </TabsContent>
      <TabsContent value="afternoon" className="mt-0 outline-none">
        <OutfitCard recommendation={afternoon} />
      </TabsContent>
      <TabsContent value="evening" className="mt-0 outline-none">
        <OutfitCard recommendation={evening} />
      </TabsContent>
    </Tabs>
  );
}
