import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { AbilityButton } from "@/components/AbilityButton";
import { CastDialog } from "@/components/CastDialog";
import { ResponseLog } from "@/components/ResponseLog";
import { HabiticaUser, AbilityConfig, CastResponse } from "@/types/habitica";
import { fetchUserDetails, castAbility } from "@/services/habiticaApi";
import { toast } from "@/hooks/use-toast";

// Define available abilities with their API endpoints (stubs)
const ABILITIES: AbilityConfig[] = [
  {
    id: "blessing",
    name: "Blessing",
    type: "buff",
    icon: "✨",
    endpoint: "/user/class/cast/blessing",
    minIterations: 1,
    maxIterations: 10,
  },
  {
    id: "fireball",
    name: "Fireball",
    type: "attack",
    icon: "🔥",
    endpoint: "/user/class/cast/fireball",
    minIterations: 1,
    maxIterations: 20,
  },
  {
    id: "heal",
    name: "Healing Light",
    type: "heal",
    icon: "💚",
    endpoint: "/user/class/cast/healAll",
    minIterations: 1,
    maxIterations: 5,
  },
  {
    id: "protect",
    name: "Protective Aura",
    type: "special",
    icon: "🛡️",
    endpoint: "/user/class/cast/protectAura",
    minIterations: 1,
    maxIterations: 15,
  },
];

const Index = () => {
  const [userData, setUserData] = useState<HabiticaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [casting, setCasting] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<AbilityConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responses, setResponses] = useState<CastResponse[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const data = await fetchUserDetails();
      setUserData(data);
    } catch (error) {
      toast({
        title: "Error loading user data",
        description: "Failed to fetch Habitica user details. Using mock data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAbilityClick = (ability: AbilityConfig) => {
    setSelectedAbility(ability);
    setDialogOpen(true);
  };

  const handleCast = async (iterations: number, delay: number) => {
    if (!selectedAbility) return;

    setCasting(true);
    setResponses([]); // Clear previous responses
    const newResponses: CastResponse[] = [];

    try {
      for (let i = 0; i < iterations; i++) {
        const result = await castAbility(selectedAbility.endpoint);
        
        const response: CastResponse = {
          id: `${Date.now()}-${i}`,
          httpCode: result.status,
          timeElapsed: result.time,
          responseSize: result.size,
          timestamp: new Date(),
        };
        
        newResponses.push(response);
        setResponses([...newResponses]);

        if (i < iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      toast({
        title: "Cast complete!",
        description: `Successfully cast ${selectedAbility.name} ${iterations} time(s)`,
      });

      // Refresh user data after all casts complete
      await loadUserData();
    } catch (error) {
      toast({
        title: "Cast failed",
        description: "An error occurred while casting the ability.",
        variant: "destructive",
      });
    } finally {
      setCasting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-gradient-to-r from-primary to-accent border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {userData?.username || "Habitica Hero"}
                </h1>
                <p className="text-white/80 text-sm">Habitica Dashboard</p>
              </div>
            </div>
            <Button
              onClick={loadUserData}
              variant="secondary"
              size="sm"
              disabled={loading || casting}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Health"
            value={userData?.stats.hp || 0}
            maxValue={userData?.stats.maxHealth || 50}
            variant="hp"
          />
          <StatCard
            label="Experience"
            value={userData?.stats.exp || 0}
            maxValue={userData?.stats.toNextLevel || 100}
            variant="exp"
          />
          <StatCard
            label="Mana"
            value={userData?.stats.mp || 0}
            maxValue={userData?.stats.maxMP || 50}
            variant="mana"
          />
          <StatCard
            label="Quest Progress"
            value={userData?.party?.quest?.progress?.hp || 0}
            variant="quest"
            showProgress={false}
          />
        </div>

        {/* Current Quest */}
        {userData?.party?.quest && (
          <Card className="p-4 bg-quest/10 border-quest">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐉</span>
              <div>
                <p className="text-sm text-muted-foreground">Current Quest</p>
                <p className="font-semibold text-quest-foreground">
                  {userData.party.quest.key}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Abilities */}
        <div>
          <h2 className="text-xl font-bold mb-4">Cast Abilities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ABILITIES.map((ability) => (
              <AbilityButton
                key={ability.id}
                ability={ability}
                onClick={() => handleAbilityClick(ability)}
                disabled={casting}
              />
            ))}
          </div>
        </div>

        {/* Response Log */}
        <ResponseLog responses={responses} onClear={() => setResponses([])} />

        {/* Cast Dialog */}
        <CastDialog
          ability={selectedAbility}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCast={handleCast}
        />
      </div>
    </div>
  );
};

export default Index;
