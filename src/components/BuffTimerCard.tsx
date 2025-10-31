import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { getNextBuffTime } from "@/services/habiticaApi";
import { cn } from "@/lib/utils";

export const BuffTimerCard = () => {
  const threeHoursMs = 10800000;
  const [nextBuffTime, setNextBuffTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [canCast, setCanCast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);

  const loadBuffTime = async () => {
    try {
      setLoading(true);
      const buffTime = await getNextBuffTime();
      setNextBuffTime(buffTime);
    } catch (error) {
      console.error("Error loading buff time:", error);
      setNextBuffTime(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (targetTime: Date): string => {
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();
    setTimeRemainingMs(diff);

    if (diff <= 0) {
      setCanCast(true);
      return "Ready to cast!";
    }

    setCanCast(false);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  useEffect(() => {
    loadBuffTime();
  }, []);

  useEffect(() => {
    if (!nextBuffTime) return;

    const interval = setInterval(() => {
      const remaining = formatTimeRemaining(nextBuffTime);
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextBuffTime]);

  if (loading) {
    return (
      <Card className="p-4 bg-card border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Next Buff
            </span>
          </div>
          <div className="text-lg font-bold text-muted-foreground">
            Loading...
          </div>
        </div>
      </Card>
    );
  }

  if (!nextBuffTime) {
    return (
      <Card className="p-4 bg-card border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Next Buff
            </span>
          </div>
          <div className="text-lg font-bold text-violet-600">
            Ready to cast!
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Next Buff
          </span>
          <span className={cn("text-lg font-bold", "text-violet-600")}>
            {timeRemaining || "Calculating..."}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
              className={cn("h-full transition-all duration-500", "bg-gradient-to-r from-violet-600 to-violet-700")}
              style={{ width: `${Math.min((timeRemainingMs / threeHoursMs) * 100, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
};