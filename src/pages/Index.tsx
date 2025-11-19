import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { AbilityButton } from "@/components/AbilityButton";
import { CastDialog } from "@/components/CastDialog";
import { ResponseLog } from "@/components/ResponseLog";
import { ScheduledCasts } from "@/components/ScheduledCasts";
import { Badge } from "@/components/ui/badge";
import { HabiticaUser, AbilityConfig, CastResponse, ScheduledCast } from "@/types/habitica";
import { fetchPartyChat, getCachedUsername, fetchUserDetails, castAbility, isAuthenticated, logout, castBrutalSmash } from "@/services/habiticaApi";
import { getQuestData } from "@/lib/questData";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

// Define available abilities with their API endpoints (stubs)
const ABILITIES: AbilityConfig[] = [
  {
    id: "brutalSmash",
    name: "Brutal Smash",
    type: "attack",
    icon: "/skills/brutalSmash.png",
    endpoint: "/user/class/cast/smash",
    minIterations: 1,
    maxIterations: 20,
  },
  {
    id: "defensiveStance",
    name: "Defensive Stance",
    type: "heal",
    icon: "/skills/defensiveStance.png",
    endpoint: "/user/class/cast/defensiveStance",
    minIterations: 1,
    maxIterations: 20,
  },
  {
    id: "valorousPresence",
    name: "Valorous Presence",
    type: "buff",
    icon: "/skills/valorousPresence.png",
    endpoint: "/user/class/cast/valorousPresence",
    minIterations: 1,
    maxIterations: 20,
  },
  {
    id: "intimidatingGaze",
    name: "Intimidating Gaze",
    type: "special",
    icon: "/skills/intimidatingGaze.png",
    endpoint: "/user/class/cast/intimidate",
    minIterations: 1,
    maxIterations: 20,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<HabiticaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [casting, setCasting] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<AbilityConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responses, setResponses] = useState<CastResponse[]>([]);
  const [scheduledCasts, setScheduledCasts] = useState<ScheduledCast[]>([]);
  const [buffCount, setBuffCount] = useState<number>(0);
  const [buffLoading, setBuffLoading] = useState(true);
  const [bossRemainingHP, setBossRemainingHP] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    loadUserData();
  }, []);

  // Check scheduled casts every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      scheduledCasts.forEach((scheduledCast) => {
        if (
          scheduledCast.status === "pending" &&
          scheduledCast.scheduledTime <= now
        ) {
          executeScheduledCast(scheduledCast);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduledCasts]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const data = await fetchUserDetails();
      setUserData(data);
      // Calculate buffs and boss HP with the loaded user data
      await countBuffsSinceLastAttack(data);
    } catch (error) {
      toast({
        title: "Error loading user data",
        description: "Failed to fetch Habitica user details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const countBuffsSinceLastAttack = async (currentUserData?: HabiticaUser) => {
    try {
      setBuffLoading(true);
      const chatMessages = await fetchPartyChat();
      if (!chatMessages || chatMessages.length === 0) {
        setBuffCount(0);
        setBossRemainingHP(null);
        return;
      }

      // Get username from cache, fetch if not cached
      let username = getCachedUsername();
      if (!username) {
        const userData = await fetchUserDetails();
        username = userData?.auth?.local?.username;
        if (!username) {
          setBuffCount(0);
          setBossRemainingHP(null);
          return;
        }
      }

      // Sort messages by timestamp (newest first)
      const sortedMessages = chatMessages
        .filter(msg => msg.timestamp)
        .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());

      const currentUserAttackPattern = `\`${username} attacks`;
      const currentUserBuffPattern = `\`${username} casts Valorous Presence for the party`;
      
      // Pattern for boss damage: "{username} attacks {bossname} for {n} damage"
      const bossDamagePattern = /`(.+?) attacks (.+?) for ([\d.]+) damage/;
      // Pattern for quest start: "Your quest, {quest name with spaces}, has started."
      const questStartPattern = /Your quest, .+, has started\./;

      let totalBuffs = 0;
      let totalBossDamage = 0;
      let questStartFound = false;
      let currentUserAttackFound = false;

      // Process messages from newest to oldest
      for (const message of sortedMessages) {
        if (!message.text) continue;
        
        // Stop counting if we hit a quest start message
        if (questStartPattern.test(message.text)) {
          questStartFound = true;
        }
        
        // Count boss damage from any party member
        if (!questStartFound) {
          const bossDamageMatch = message.text.match(bossDamagePattern);
          if (bossDamageMatch) {
            const damage = parseFloat(bossDamageMatch[3]);
            if (!isNaN(damage)) {
              totalBossDamage += damage;
            }
          }
        }

        // Count buffs until we hit an attack message from this user
        if (message.text.startsWith(currentUserAttackPattern)) {
          // Found an attack from this user, stop counting buffs
          currentUserAttackFound = true;
        }
        
        if (!currentUserAttackFound && message.text.startsWith(currentUserBuffPattern)) {
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

        if (currentUserAttackFound && questStartFound) {
          break;
        }
      }

      setBuffCount(totalBuffs);
      
      // Calculate remaining HP if we have current quest data
      if (currentUserData?.party?.quest?.key) {
        const questData = getQuestData(currentUserData.party.quest.key);
        if (questData && questData.boss_HP > 0) {
          const remainingHP = Math.max(0, questData.boss_HP - totalBossDamage);
          setBossRemainingHP(remainingHP);
        } else {
          setBossRemainingHP(null);
        }
      } else {
        setBossRemainingHP(null);
      }
    } catch (error) {
      console.error("Error counting buffs:", error);
      setBuffCount(0);
      setBossRemainingHP(null);
    } finally {
      setBuffLoading(false);
    }
  };

  const handleAbilityClick = (ability: AbilityConfig) => {
    setSelectedAbility(ability);
    setDialogOpen(true);
  };

  const handleCancelScheduled = (id: string) => {
    setScheduledCasts((prev) => prev.filter((cast) => cast.id !== id));
    toast({
      title: "Scheduled cast cancelled",
      description: "The scheduled cast has been removed.",
    });
  };

  const executeScheduledCast = async (scheduledCast: ScheduledCast) => {
    // Update status to executing
    setScheduledCasts((prev) =>
      prev.map((cast) =>
        cast.id === scheduledCast.id ? { ...cast, status: "executing" } : cast
      )
    );

    setCasting(true);
    const newResponses: CastResponse[] = [];

    try {
      let successfulCasts = 0;
      let failedCasts = 0;
      for (let i = 0; i < scheduledCast.iterations; i++) {
        const result = scheduledCast.ability.id === "brutalSmash"
          ? await castBrutalSmash()
          : await castAbility(scheduledCast.ability.endpoint);

        const response: CastResponse = {
          id: `${Date.now()}-${i}`,
          icon: scheduledCast.ability.icon,
          httpCode: result.status,
          timeElapsed: result.time,
          responseSize: result.size,
          timestamp: new Date(),
        };

        if (response.httpCode === 200) {
          successfulCasts++;
        } else {
          failedCasts++;
        }

        newResponses.unshift(response);
        setResponses([...newResponses]);
      }

      toast({
        title: "Scheduled cast complete!",
        description: `Cast ${scheduledCast.ability.name} ${scheduledCast.iterations} time(s). ${successfulCasts} cast(s) were successful. ${failedCasts} cast(s) failed.`,
      });

      // Update status to completed
      setScheduledCasts((prev) =>
        prev.map((cast) =>
          cast.id === scheduledCast.id ? { ...cast, status: "completed" } : cast
        )
      );

      await loadUserData();
    } catch (error) {
      toast({
        title: "Scheduled cast failed",
        description: "An error occurred while casting the ability.",
        variant: "destructive",
      });

      // Update status to 'failed'
      setScheduledCasts((prev) =>
        prev.map((cast) =>
          cast.id === scheduledCast.id ? { ...cast, status: "failed" } : cast
        )
      );
    } finally {
      setCasting(false);
    }
  };

  const handleCast = async (iterations: number, scheduledTime?: Date) => {
    if (!selectedAbility) return;

    // If scheduled, create a scheduled cast
    if (scheduledTime) {
      const newScheduledCast: ScheduledCast = {
        id: `scheduled-${Date.now()}`,
        ability: selectedAbility,
        iterations,
        scheduledTime,
        status: "pending",
      };

      setScheduledCasts((prev) => [...prev, newScheduledCast]);

      toast({
        title: "Cast scheduled!",
        description: `${selectedAbility.name} will be cast at ${format(scheduledTime, "PPP 'at' p")}`,
      });

      return;
    }

    // Otherwise, execute immediately
    setCasting(true);
    const newResponses: CastResponse[] = responses;

    try {
      for (let i = 0; i < iterations; i++) {
        const result = selectedAbility.id === "brutalSmash"
          ? await castBrutalSmash()
          : await castAbility(selectedAbility.endpoint);
        
        const response: CastResponse = {
          id: `${Date.now()}-${i}`,
          icon: selectedAbility.icon,
          httpCode: result.status,
          timeElapsed: result.time,
          responseSize: result.size,
          timestamp: new Date(),
        };

        newResponses.unshift(response);
        setResponses([...newResponses]);
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-4 sm:p-6 bg-gradient-to-r from-primary to-accent border-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img src="/habitica-logo.svg" alt="Habitica Logo" className="w-12 h-12 object-contain flex-shrink-0" />
              {/*<Sparkles className="h-8 w-8 text-white" />*/}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col items-left gap-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                      {userData?.auth?.local?.username || "Habitica Hero"}
                    </h1>
                    {userData?.stats?.lvl !== undefined && (
                      <Badge className="text-white bg-white/10 border-white/20 backdrop-blur-sm self-start mt-2 lg:mt-3">
                        Lv. {userData.stats.lvl}
                      </Badge>
                    )}
                  </div>
                  <p className="text-white/80 text-sm lg:mt-2">Habitica Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={loadUserData}
                variant="secondary"
                size="sm"
                disabled={loading || casting}
                className="text-xs sm:text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  logout();
                  toast({ title: "Logged out", description: "Your session has been cleared." });
                  navigate("/login");
                }}
                variant="default"
                size="sm"
                disabled={casting}
                className="text-xs sm:text-sm"
              >
                Log out
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${loading ? 'blur-sm pointer-events-none select-none' : ''}`}>
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
            label="Daily Buffs"
            value={buffLoading ? 0 : buffCount}
            maxValue={100}
            variant="buff"
          />
        </div>

        {/* Current Quest */}
        {userData?.party?.quest && (
          <Card className={`p-4 bg-quest/10 border-quest ${loading ? 'blur-sm pointer-events-none select-none' : ''}`}>
            <div className="flex items-center gap-4">
              {getQuestData(userData.party.quest.key)?.image && (
                <div className="flex-shrink-0">
                  <img
                    src={getQuestData(userData.party.quest.key)?.image}
                    alt={getQuestData(userData.party.quest.key)?.name || "Quest"}
                    className="w-[78px] h-[78px] object-cover rounded-lg border-2 border-quest/20"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex-grow">
                <p className="text-sm text-muted-foreground mb-1">Current Quest</p>
                <h3 className="font-semibold text-quest-foreground text-lg leading-tight">
                  {getQuestData(userData.party.quest.key)?.name || userData.party.quest.key}
                </h3>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {getQuestData(userData.party.quest.key)?.type || 'Unknown'}
                  </Badge>
                  {getQuestData(userData.party.quest.key)?.boss_HP > 0 ? (
                    <span className="text-sm text-muted-foreground">
                      HP: {bossRemainingHP !== null ? bossRemainingHP.toFixed(1) : '?'} / {getQuestData(userData.party.quest.key)?.boss_HP}
                    </span>
                  ) : null}
                  {getQuestData(userData.party.quest.key)?.type == "boss" && (
                    <span className="text-sm text-muted-foreground">
                      Pending Damage: {Math.round(userData.party.quest.progress.up)}
                    </span>
                  )}
                  {getQuestData(userData.party.quest.key)?.type == "collection" && (
                      <span className="text-sm text-muted-foreground">
                      Collected Items: {userData.party.quest.progress.collectedItems}
                    </span>
                  )}
                </div>
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
                disabled={casting || loading}
              />
            ))}
          </div>
        </div>

        {/* Scheduled Casts */}
        <ScheduledCasts
          scheduledCasts={scheduledCasts}
          onCancel={handleCancelScheduled}
        />

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
