import { useState, useEffect } from "react";
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
import { CalendarIcon, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AbilityConfig } from "@/types/habitica";
import {toast} from "@/hooks/use-toast.ts";

interface CastDialogProps {
  ability: AbilityConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCast: (iterations: number, scheduledTime?: Date) => void;
  remainingDailyBuffs: number;
}

export const CastDialog = ({ ability, open, onOpenChange, onCast, remainingDailyBuffs }: CastDialogProps) => {
  const [iterations, setIterations] = useState(1);
  const [castMode, setCastMode] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [scheduledTime, setScheduledTime] = useState("09:14");

  // Set scheduled time to current local time when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      setScheduledTime(currentTime);
    }
  }, [open]);

  const incrementTime = () => {
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    let newMinutes = minutes + 1;
    let newHours = hours;
    
    if (newMinutes >= 60) {
      newMinutes = 0;
      newHours = (newHours + 1) % 24;
    }
    
    const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    setScheduledTime(newTime);
  };

  const decrementTime = () => {
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    let newMinutes = minutes - 1;
    let newHours = hours;
    
    if (newMinutes < 0) {
      newMinutes = 59;
      newHours = newHours - 1;
      if (newHours < 0) {
        newHours = 23;
      }
    }
    
    const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    setScheduledTime(newTime);
  };

  const handleCast = () => {
    if (!ability) return;

    if (iterations > remainingDailyBuffs && castMode === "immediate" && ability.type != "attack") {
      toast({
        title: "Max daily  buffs reached",
        description: "You have reached your daily buff limit.",
        variant: "destructive",
      });

      return;
    }

    const validIterations = Math.max(
      ability.minIterations,
      Math.min(ability.maxIterations, iterations)
    );

    let scheduledDateTime: Date | undefined;
    if (castMode === "scheduled" && scheduledDate) {
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
    }
    
    onCast(validIterations, scheduledDateTime);
    onOpenChange(false);
    setIterations(1);
    setCastMode("immediate");
    setScheduledDate(new Date());
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    setScheduledTime(currentTime);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCast();
    }
  };

  if (!ability) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={ability.icon} alt={ability.name} className="w-10 h-10 object-contain" />
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
                  <div className="flex items-center">
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="rounded-r-none"
                    />
                    <div className="flex flex-col border border-l-0 rounded-r-md">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-[19px] px-2 rounded-none rounded-tr-md border-b"
                        onClick={incrementTime}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-[19px] px-2 rounded-none rounded-br-md"
                        onClick={decrementTime}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="iterations">
              Iterations ({ability.minIterations} - {ability.maxIterations})
            </Label>
            <Input
              id="iterations"
              type="number"
              min={ability.minIterations}
              max={ability.maxIterations}
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value) || 1)}
              className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
            />
          </div>
        </div>
        <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button onClick={handleCast}>Cast Ability</Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
