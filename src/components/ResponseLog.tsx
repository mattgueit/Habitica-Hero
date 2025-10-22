import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { CastResponse } from "@/types/habitica";
import { cn } from "@/lib/utils";

interface ResponseLogProps {
  responses: CastResponse[];
  onClear: () => void;
}

export const ResponseLog = ({ responses, onClear }: ResponseLogProps) => {
  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return "text-green-500";
    if (code >= 400 && code < 500) return "text-yellow-500";
    if (code >= 500) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">HTTP Response Log</h3>
        {responses.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
      <div className="space-y-1 font-mono text-sm max-h-64 overflow-y-auto">
        {responses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No responses yet. Cast an ability to see results.
          </p>
        ) : (
          responses.map((response, index) => (
            <div
              key={response.id}
              className="flex items-center gap-4 py-2 px-3 bg-secondary rounded border border-border"
            >
              <span className="text-muted-foreground w-12">{index + 1}</span>
              <img src={response.icon} alt="buffIcon" className="w-8 h-8 object-contain" />
              <span className={cn("font-bold w-12", getStatusColor(response.httpCode))}>
                {response.httpCode}
              </span>
              <span className="text-muted-foreground w-20">{response.timeElapsed}ms</span>
              <span className="text-muted-foreground w-24">{response.responseSize}KB</span>
              <span className="text-muted-foreground text-xs flex-1 text-right">
                {response.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
