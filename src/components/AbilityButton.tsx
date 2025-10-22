import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AbilityConfig } from "@/types/habitica";

interface AbilityButtonProps {
  ability: AbilityConfig;
  onClick: () => void;
  disabled?: boolean;
}

export const AbilityButton = ({ ability, onClick, disabled }: AbilityButtonProps) => {
  const typeColors = {
    attack: 'bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500',
    heal: 'bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500',
    buff: 'bg-gradient-to-br from-violet-400 to-violet-600 hover:from-violet-300 hover:to-violet-500',
    special: 'bg-gradient-to-br from-sky-400 to-sky-600 hover:from-sky-300 hover:to-sky-500',
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-24 flex-col gap-2 text-white border-0 shadow-lg transition-all duration-200",
        "hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100",
        typeColors[ability.type]
      )}
    >
      <img
          src={ability.icon}
          alt={ability.name}
          className="w-10 h-10 object-contain"
      />
      <span className="text-sm font-semibold">{ability.name}</span>
    </Button>
  );
};
