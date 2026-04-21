import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav = false }: AppShellProps) {
  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 flex justify-center">
      <div className="w-full max-w-[480px] bg-background min-h-full relative shadow-xl overflow-x-hidden flex flex-col">
        <main className="flex-1 overflow-y-auto pb-[90px] scroll-smooth">
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
