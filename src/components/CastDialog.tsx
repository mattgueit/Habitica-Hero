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
import { AbilityConfig } from "@/types/habitica";

interface CastDialogProps {
  ability: AbilityConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCast: (iterations: number, delay: number) => void;
}

export const CastDialog = ({ ability, open, onOpenChange, onCast }: CastDialogProps) => {
  const [iterations, setIterations] = useState(1);
  const [delay, setDelay] = useState(1000);

  const handleCast = () => {
    if (!ability) return;
    
    const validIterations = Math.max(
      ability.minIterations,
      Math.min(ability.maxIterations, iterations)
    );
    const validDelay = Math.max(0, Math.min(10000, delay));
    
    onCast(validIterations, validDelay);
    onOpenChange(false);
    setIterations(1);
    setDelay(1000);
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
