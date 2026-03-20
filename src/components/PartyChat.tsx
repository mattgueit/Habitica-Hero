import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { fetchPartyChat, HabiticaChatMessage } from "@/services/habiticaApi";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const PartyChat = () => {
  const [partyChat, setPartyChat] = useState<HabiticaChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChat();
  }, []);

  const loadChat = async () => {
    setLoading(true);
    try {
      const messages = await fetchPartyChat();
      const sorted = [...messages].sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });
      setPartyChat(sorted);
    } catch (error) {
      toast({
        title: "Error loading party chat",
        description: "Failed to fetch party chat messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-sm">Loading chat messages...</p>
      </Card>
    );
  }

  if (partyChat.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-sm">No chat messages found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold mb-4">Party Chat</h2>
      {partyChat.map((msg) => (
        <Card key={msg.id || msg._id || msg.timestamp} className="p-4">
          {msg.uuid !== "system" && msg.user && (
            <p className="font-semibold text-sm">{msg.user}</p>
          )}
          {msg.text && <p className="text-sm mt-1">{msg.text}</p>}
          {msg.timestamp && (
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(msg.timestamp), "PPP 'at' p")}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
};
