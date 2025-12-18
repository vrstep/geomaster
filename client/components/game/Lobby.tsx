"use client";

import { useMutation } from "@apollo/client/react";
import { Users, Copy, Play, Crown, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { START_GAME_MUTATION } from "@/lib/graphql";
import { useAuthStore } from "@/store/useAuthStore";

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
  host: Host;
  players: Player[];
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

export function Lobby({ room }: LobbyProps) {
  const { user } = useAuthStore();
  const isHost = user?.id === room.host?.id;

  const [startGame, { loading }] = useMutation<StartGameData>(START_GAME_MUTATION, {
    onError: (err) => toast.error("Failed to start", { description: err.message }),
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    toast("Copied!", { description: "Room code copied to clipboard" });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 max-w-4xl mx-auto w-full">
      {/* Room Info Card */}
      <Card className="w-full shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <Badge variant="outline" className="w-fit mx-auto mb-2">
            Waiting for players...
          </Badge>
          <CardTitle className="text-4xl font-black tracking-tight flex items-center justify-center gap-3">
            {room.code}
            <Button size="icon" variant="ghost" onClick={handleCopyCode}>
              <Copy className="w-5 h-5 text-muted-foreground" />
            </Button>
          </CardTitle>
          <CardDescription>Share this code to invite friends</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
           <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              <Users className="w-4 h-4" />
              <span className="font-medium">{room.players.length} Players joined</span>
           </div>
        </CardContent>
      </Card>

      {/* Players Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
        {room.players.map((player) => (
          <Card key={player.userId} className="overflow-hidden border-2 transition-all hover:border-primary/50">
            <CardContent className="p-4 flex flex-col items-center gap-3 relative">
              {room.host?.id === player.userId && (
                <div className="absolute top-2 right-2">
                  <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
              )}
              
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                <AvatarImage src={player.avatar || "/default_avatar.png"} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {player.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <p className="font-bold truncate w-full max-w-[120px]">{player.username}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {player.isReady ? (
                    <span className="text-xs text-green-600 flex items-center font-medium bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3 mr-1" /> Not Ready
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center p-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
          <Button 
            size="lg" 
            className="h-16 px-12 text-xl font-bold shadow-xl animate-in slide-in-from-bottom-4 pointer-events-auto"
            onClick={() => startGame({ variables: { code: room.code } })}
            disabled={loading}
          >
            {loading ? "Starting..." : (
              <>
                Start Game <Play className="ml-2 w-6 h-6 fill-current" />
              </>
            )}
          </Button>
        </div>
      )}
      
      {!isHost && (
        <p className="text-muted-foreground animate-pulse mt-8">
          Waiting for host to start the game...
        </p>
      )}
    </div>
  );
}