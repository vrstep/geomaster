"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Globe, Users, Play, LogOut, Loader2 } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { ME_QUERY } from "@/lib/graphql";

interface MeData {
  me: {
    id: string;
    username: string;
    email: string;
    stats?: {
      totalScore: number;
      gamesWon: number;
      bestStreak: number;
      gamesPlayed: number;
    };
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, login } = useAuthStore();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const handleJoinSubmit = () => {
    if (joinCode.length >= 6) {
      router.push(`/game/${joinCode}`);
    }
  };

  const { data, loading, error } = useQuery<MeData>(ME_QUERY, {
    skip: !user,
    fetchPolicy: "network-only"
  });

  useEffect(() => {
    if (data?.me) {
      login(localStorage.getItem("token") || "", data.me);
    }
  }, [data, login]);

  const handleCreateGame = () => {
    router.push("/game/create");
  };


  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4 text-center">
        <Globe className="h-24 w-24 text-primary mb-6 animate-bounce" />
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-4">GeoMaster</h1>
        <p className="text-xl text-slate-600 mb-8 max-w-lg">
          Master the world map. Compete with friends in real-time. Guess flags, capitals, and borders.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">Hello, {user.username}!</h2>
            <p className="text-sm text-muted-foreground">Ready to explore?</p>
          </div>
        </div>
        {/* CHANGED: Switched to 'outline' variant and added border color */}
        <Button
          variant="outline"
          onClick={logout}
          className="border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </header>

      <main className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
        {/* Left Column: Actions */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Users className="h-6 w-6" /> Multiplayer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-indigo-100">Host a room or join friends in a real-time geography battle.</p>
              <div className="flex gap-3">
                {/* CHANGED: Switched w-full to flex-1 so they split the space evenly */}
                <Button onClick={handleCreateGame} variant="secondary" className="flex-1 font-bold">
                  Host Game
                </Button>
                <Button
                  onClick={() => setShowJoinDialog(true)}
                  variant="outline"
                  className="flex-1 bg-transparent border-white text-white hover:bg-white/20"
                >
                  Join Room
                </Button>

                {/* JOIN GAME DIALOG */}
                <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Join Game</DialogTitle>
                      <DialogDescription>
                        Enter the 6-digit room code shared by the host.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center space-x-2 py-4">
                      <div className="grid flex-1 gap-2">
                        <Label htmlFor="roomCode" className="sr-only">
                          Room Code
                        </Label>
                        <Input
                          id="roomCode"
                          placeholder="123456"
                          className="text-center text-2xl tracking-widest uppercase font-mono"
                          maxLength={6}
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>

                    <DialogFooter className="sm:justify-between">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowJoinDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleJoinSubmit}
                        disabled={joinCode.length < 6}
                      >
                        Enter Room
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>


              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-500" /> Single Player
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Practice your skills before entering the arena.</p>
              <Button variant="outline" className="w-full">Start Practice Mode</Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-100 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-800">{data?.me?.stats?.totalScore || 0}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Score</p>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-800">{data?.me?.stats?.gamesWon || 0}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Games Won</p>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-800">{data?.me?.stats?.bestStreak || 0}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Best Streak</p>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-800">{data?.me?.stats?.gamesPlayed || 0}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Played</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}