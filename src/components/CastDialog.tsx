import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AbilityConfig } from "@/types/habitica";

interface CastDialogProps {
  ability: AbilityConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCast: (iterations: number, delay: number, scheduledTime?: Date) => void;
}

export const CastDialog = ({ ability, open, onOpenChange, onCast }: CastDialogProps) => {
  const [iterations, setIterations] = useState(1);
  const [delay, setDelay] = useState(1000);
  const [castMode, setCastMode] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("12:00");

  const handleCast = () => {
    if (!ability) return;
    
    const validIterations = Math.max(
      ability.minIterations,
      Math.min(ability.maxIterations, iterations)
    );
    const validDelay = Math.max(0, Math.min(10000, delay));
    
    let scheduledDateTime: Date | undefined;
    if (castMode === "scheduled" && scheduledDate) {
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
    }
    
    onCast(validIterations, validDelay, scheduledDateTime);
    onOpenChange(false);
    setIterations(1);
    setDelay(1000);
    setCastMode("immediate");
    setScheduledDate(undefined);
    setScheduledTime("12:00");
  };

  if (!ability) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{ability.icon}</span>
            Cast {ability.name}
          </DialogTitle>
          <DialogDescription>
            Configure the casting parameters for this ability
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cast Mode</Label>
            <RadioGroup value={castMode} onValueChange={(value) => setCastMode(value as "immediate" | "scheduled")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="immediate" id="immediate" />
                <Label htmlFor="immediate" className="font-normal cursor-pointer">Immediate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scheduled" id="scheduled" />
                <Label htmlFor="scheduled" className="font-normal cursor-pointer">Scheduled</Label>
              </div>
            </RadioGroup>
          </div>

          {castMode === "scheduled" && (
            <>
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Scheduled Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="iterations">
              Iterations (min: {ability.minIterations}, max: {ability.maxIterations})
            </Label>
            <Input
              id="iterations"
              type="number"
              min={ability.minIterations}
              max={ability.maxIterations}
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delay">Delay (ms, 0-10000)</Label>
            <Input
              id="delay"
              type="number"
              min={0}
              max={10000}
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCast}>Cast Ability</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
