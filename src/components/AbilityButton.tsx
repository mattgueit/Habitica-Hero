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
    buff: 'bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700',
    attack: 'bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700',
    heal: 'bg-gradient-to-br from-green-600 to-green-800 hover:from-green-500 hover:to-green-700',
    special: 'bg-gradient-to-br from-pink-600 to-pink-800 hover:from-pink-500 hover:to-pink-700',
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
      <span className="text-3xl">{ability.icon}</span>
      <span className="text-sm font-semibold">{ability.name}</span>
    </Button>
  );
};
