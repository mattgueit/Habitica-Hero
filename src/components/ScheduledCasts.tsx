import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Clock } from "lucide-react";
import { ScheduledCast } from "@/types/habitica";
import { format } from "date-fns";

interface ScheduledCastsProps {
  scheduledCasts: ScheduledCast[];
  onCancel: (id: string) => void;
}

export const ScheduledCasts = ({ scheduledCasts, onCancel }: ScheduledCastsProps) => {
  if (scheduledCasts.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Scheduled Casts</h2>
      </div>
      <div className="space-y-2">
        {scheduledCasts.map((cast) => (
          <div
            key={cast.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
          >
            <div className="flex items-center gap-3">
                <img src={cast.ability.icon} alt={cast.ability.name} className="w-10 h-10 object-contain" />
              <div>
                <p className="font-medium">{cast.ability.name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(cast.scheduledTime, "PPP 'at' p")} • {cast.iterations}x
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={cast.status === "pending" ? "secondary" : "default"}>
                {cast.status}
              </Badge>
              {cast.status === "pending" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(cast.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
