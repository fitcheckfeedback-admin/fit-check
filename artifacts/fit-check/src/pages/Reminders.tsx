import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFitCheckSettings } from "@/hooks/useFitCheckSettings";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import { trackEvent } from "@/lib/analytics";
import { Bell, Plus, Trash2, Calendar, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Link } from "wouter";

export default function Reminders() {
  const { settings } = useFitCheckSettings();
  const deviceId = getOrCreateDeviceId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', deviceId],
    queryFn: async () => {
      const res = await fetch(`/api/push/reminders?deviceId=${deviceId}`);
      if (!res.ok) throw new Error("Failed to load reminders");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: { deviceId: string; title: string; scheduledAt: string }) => {
      const res = await fetch('/api/push/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create reminder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', deviceId] });
      setIsOpen(false);
      setTitle("");
      setDate("");
      setTime("");
      toast({ title: "Reminder added" });
      trackEvent("reminder_created");
    },
    onError: () => {
      toast({ title: "Error adding reminder", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/push/reminders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete reminder");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', deviceId] });
      toast({ title: "Reminder deleted" });
    }
  });

  const handleAdd = () => {
    if (!title || !date || !time) return;
    const datetime = new Date(`${date}T${time}`);
    if (datetime <= new Date()) {
      toast({ title: "Time must be in the future", variant: "destructive" });
      return;
    }
    
    createMutation.mutate({
      deviceId,
      title,
      scheduledAt: datetime.toISOString()
    });
  };

  const isFormValid = title.trim().length > 0 && date && time;

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 pb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-sm" />
          <div>
            <h1 className="text-3xl font-display font-bold"><span className="brand-gradient-text">Remind</span>ers</h1>
            <p className="text-muted-foreground font-medium text-sm">Stay on top of your day.</p>
          </div>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="w-10 h-10 rounded-full shadow-sm">
              <Plus className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2rem] border-x-0 h-auto pb-10">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="font-display text-2xl">New Reminder</SheetTitle>
              <SheetDescription>What do you need to remember?</SheetDescription>
            </SheetHeader>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Reminder Title</Label>
                <Input 
                  placeholder="e.g. Bring umbrella, Pack gym clothes" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  className="h-14 rounded-2xl border-2 bg-card text-base"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      className="h-14 rounded-2xl border-2 bg-card pl-11 block w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      type="time" 
                      value={time} 
                      onChange={e => setTime(e.target.value)}
                      className="h-14 rounded-2xl border-2 bg-card pl-11 block w-full"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full h-14 rounded-2xl text-base font-semibold mt-4" 
                onClick={handleAdd}
                disabled={!isFormValid || createMutation.isPending}
              >
                {createMutation.isPending ? "Adding..." : "Add Reminder"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {!settings.notificationsEnabled && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-500 text-sm">Notifications disabled</h3>
            <p className="text-xs text-amber-800/80 dark:text-amber-400/80 mt-1 mb-2">
              You won't receive push alerts for these reminders. Enable them in Settings.
            </p>
            <Link href="/settings" className="text-xs font-bold text-amber-700 dark:text-amber-400 underline underline-offset-2">
              Go to Settings
            </Link>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <Bell className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">No reminders yet</h2>
            <p className="text-muted-foreground mt-2 text-sm">Add one to stay on top of your day.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {reminders.map((reminder: any, index: number) => {
              const d = new Date(reminder.scheduledAt);
              const isToday = new Date().toDateString() === d.toDateString();
              
              return (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border shadow-sm rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground truncate">{reminder.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {isToday ? "Today" : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                    onClick={() => deleteMutation.mutate(reminder.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}