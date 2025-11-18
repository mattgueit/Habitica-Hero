import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { fetchPartyChat, getCachedUsername, fetchUserDetails, HabiticaChatMessage } from "@/services/habiticaApi";
import { cn } from "@/lib/utils";

export const BuffTimerCard = () => {
  const [buffCount, setBuffCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const countBuffsSinceLastAttack = async () => {
    try {
      setLoading(true);
      const chatMessages = await fetchPartyChat();
      if (!chatMessages || chatMessages.length === 0) {
        setBuffCount(0);
        return;
      }

      // Get username from cache, fetch if not cached
      let username = getCachedUsername();
      if (!username) {
        const userData = await fetchUserDetails();
        username = userData?.auth?.local?.username;
        if (!username) {
          setBuffCount(0);
          return;
        }
      }

      // Sort messages by timestamp (newest first)
      const sortedMessages = chatMessages
        .filter(msg => msg.timestamp)
        .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());

      const attackPattern = `\`${username} attacks`;
      const buffPattern = `\`${username} casts Valorous Presence for the party`;

      let totalBuffs = 0;
      
      // Count buffs until we hit an attack message
      for (const message of sortedMessages) {
        if (!message.text) continue;
        
        if (message.text.startsWith(attackPattern)) {
          // Found an attack, stop counting
          break;
        }
        
        if (message.text.startsWith(buffPattern)) {
          // Extract the number from the message like "casts Valorous Presence for the party 5 times"
          const match = message.text.match(/party (\d+) times/);
          if (match) {
            const buffAmount = parseInt(match[1], 10);
            if (!isNaN(buffAmount)) {
              totalBuffs += buffAmount;
            }
          } else {
            // messages without "n times" are single buffs
            totalBuffs++;
          }
        }
      }

      setBuffCount(totalBuffs);
    } catch (error) {
      console.error("Error counting buffs:", error);
      setBuffCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    countBuffsSinceLastAttack();
  }, []);

  const maxBuffs = 100;
  const percentage = (buffCount / maxBuffs) * 100;

  if (loading) {
    return (
      <Card className="p-4 bg-card border-border">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Daily Buffs
            </span>
            <span className="text-lg font-bold text-muted-foreground">
              Loading...
            </span>
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
            Daily Buffs
          </span>
          <span className={cn("text-lg font-bold", "text-violet-600")}>
            {buffCount}/{maxBuffs}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-500", "bg-gradient-to-r from-violet-600 to-violet-700")}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  );
};