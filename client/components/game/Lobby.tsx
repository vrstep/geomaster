"use client";

import { useMutation } from "@apollo/client/react";
import { Users, Copy, Play, Crown, Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { START_GAME_MUTATION, TOGGLE_READY_MUTATION } from "@/lib/graphql";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

// Define types
interface Player {
  userId: string;
  username: string;
  avatar?: string;
  isReady: boolean;
}

interface Host {
  id: string;
  username: string;
}

interface Room {
  id: string;
  code: string;
  status: string;
  host: Host | null;
  players: Player[];
  config: {
    isHostPlaying: boolean;
  };
}

interface LobbyProps {
  room: Room;
}

interface StartGameData {
  startGame: {
    id: string;
    status: string;
    roundStartTime: string;
  };
}

interface ToggleReadyData {
  toggleReady: {
    id: string;
    players: Player[];
  };
}

export function Lobby({ room }: LobbyProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const isHost = user?.id === room.host?.id;
  
  // Check if the current user is in the players list
  const myPlayer = room.players.find((p) => p.userId === user?.id);

  // ✅ Check if all players are ready
  const allPlayersReady = room.players.every((p) => p.isReady);
  const readyCount = room.players.filter((p) => p.isReady).length;

  // ✅ Validate game start conditions
  const canStartGame = () => {
    const playerCount = room.players.length;
    
    // Check minimum player count
    if (room.config.isHostPlaying && playerCount < 2) {
      return { valid: false, reason: "Need at least 2 players to start (including you)" };
    }
    
    if (!room.config.isHostPlaying && playerCount < 2) {
      return { valid: false, reason: "Need at least 2 players to start in Projector Mode" };
    }

    // ✅ Check if all players are ready
    if (!allPlayersReady) {
      return { valid: false, reason: `Waiting for all players to be ready (${readyCount}/${playerCount})` };
    }
    
    return { valid: true, reason: "" };
  };

  const [startGame, { loading: starting }] = useMutation<StartGameData>(START_GAME_MUTATION, {
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const [toggleReady, { loading: toggling }] = useMutation<ToggleReadyData>(TOGGLE_READY_MUTATION, {
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    toast("Copied!", { description: "Room code copied to clipboard" });
  };

  const handleStartGame = () => {
    const validation = canStartGame();
    
    if (!validation.valid) {
      toast.error("Cannot Start Game", { description: validation.reason });
      return;
    }
    
    startGame({ variables: { code: room.code } });
  };

  const handleLeaveRoom = () => {
    if (confirm("Are you sure you want to leave this room?")) {
      router.push("/");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 max-w-4xl mx-auto w-full px-4 pb-32">
      
      {/* Leave Button - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLeaveRoom}
          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <LogOut className="w-4 h-4" />
          Leave Room
        </Button>
      </div>

      {/* Room Info */}
      <Card className="w-full shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <Badge variant="secondary" className="w-fit mx-auto mb-2 text-lg px-4 py-1">
            Waiting for players...
          </Badge>
          <div className="flex flex-col items-center gap-2">
             <h1 className="text-6xl font-black text-primary tracking-widest">{room.code}</h1>
             <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-2">
                <Copy className="w-4 h-4" /> Copy Room Code
             </Button>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-muted-foreground bg-slate-100 px-4 py-2 rounded-full">
                <Users className="w-4 h-4" />
                <span className="font-medium">{room.players.length} {room.players.length === 1 ? 'player' : 'players'} joined</span>
             </div>
             <div className={cn(
               "flex items-center gap-2 px-4 py-2 rounded-full font-medium",
               allPlayersReady ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
             )}>
                <span>{readyCount}/{room.players.length} Ready</span>
             </div>
           </div>
        </CardContent>
      </Card>

      {/* Players Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {room.players.map((player) => (
          <Card key={player.userId} className={cn(
            "overflow-hidden border-2 transition-all",
            player.isReady ? "border-green-500 bg-green-50/30" : "hover:border-primary/50"
          )}>
            <CardContent className="p-4 flex flex-col items-center gap-3 relative">
              {room.host?.id === player.userId && (
                <div className="absolute top-2 right-2" title="Host">
                  <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
              )}
              
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                <AvatarImage src={player.avatar || "/default_avatar.png"} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {player.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center w-full">
                <p className="font-bold truncate">{player.username}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {player.isReady ? (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">✓ Ready</Badge>
                  ) : (
                    <Badge variant="secondary">Not Ready</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Floating Action Bar - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-md border-t shadow-lg flex justify-center gap-4 z-50">
        
        {/* PLAYER: Ready Button - Only show if user is a player */}
        {myPlayer && (
           <Button 
             size="lg" 
             variant={myPlayer.isReady ? "outline" : "default"}
             className={cn(
               "min-w-[200px] text-lg font-bold transition-all",
               myPlayer.isReady ? "border-green-500 text-green-600 hover:bg-green-50" : "bg-indigo-600 hover:bg-indigo-700"
             )}
             onClick={() => toggleReady({ variables: { code: room.code } })}
             disabled={toggling}
           >
             {toggling ? (
               <Loader2 className="mr-2 h-5 w-5 animate-spin" />
             ) : (
               myPlayer.isReady ? "✓ I'm Ready!" : "Get Ready"
             )}
           </Button>
        )}

        {/* HOST: Start Button - Always show for host */}
        {isHost && (
          <Button 
            size="lg" 
            className={cn(
              "min-w-[200px] text-lg font-bold shadow-xl transition-all",
              canStartGame().valid 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-gray-400 cursor-not-allowed"
            )}
            onClick={handleStartGame}
            disabled={starting || !canStartGame().valid}
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting...
              </>
            ) : (
              <>
                Start Game <Play className="ml-2 w-5 h-5 fill-current" />
              </>
            )}
          </Button>
        )}

        {/* Non-host, non-player message (shouldn't normally happen) */}
        {!isHost && !myPlayer && (
          <p className="text-muted-foreground animate-pulse">
            Waiting for host to start the game...
          </p>
        )}
      </div>
    </div>
  );
}