import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  maxValue?: number;
  variant: 'hp' | 'exp' | 'mana' | 'quest';
  showProgress?: boolean;
}

export const StatCard = ({ label, value, maxValue, variant, showProgress = true }: StatCardProps) => {
  const percentage = maxValue ? (value / maxValue) * 100 : 0;
  
  const gradientClasses = {
    hp: 'bg-gradient-to-r from-hp to-red-600',
    exp: 'bg-gradient-to-r from-exp to-yellow-600',
    mana: 'bg-gradient-to-r from-mana to-blue-700',
    quest: 'bg-gradient-to-r from-quest to-green-700',
  };

  const textColorClasses = {
    hp: 'text-hp',
    exp: 'text-exp',
    mana: 'text-mana',
    quest: 'text-quest',
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          <span className={cn("text-lg font-bold", textColorClasses[variant])}>
            {showProgress && maxValue ? `${Math.round(value)}/${Math.round(maxValue)}` : Math.round(value)}
          </span>
        </div>
        {showProgress && maxValue && (
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-500", gradientClasses[variant])}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};
