import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { AnnouncementModal } from "./AnnouncementModal";

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav = false }: AppShellProps) {
  return (
    <div className="h-[100dvh] w-full bg-zinc-100 dark:bg-zinc-950 flex justify-center">
      <div className="w-full max-w-[480px] bg-background h-full relative shadow-2xl overflow-hidden flex flex-col mx-auto border-x border-border/50">
        <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth flex flex-col">
          {children}
        </main>
        {!hideNav && <BottomNav />}
        <AnnouncementModal />
      </div>
    </div>
  );
}
