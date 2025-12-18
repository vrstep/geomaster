"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useSubscription } from "@apollo/client/react";
import { useMutation } from "@apollo/client/react";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Lobby } from "@/components/game/Lobby";
import { GET_ROOM_QUERY, ROOM_UPDATED_SUBSCRIPTION, JOIN_ROOM_MUTATION } from "@/lib/graphql";
import { useAuthStore } from "@/store/useAuthStore";

// Define types for the queries and subscriptions
interface Player {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  isReady: boolean;
  hasAnsweredCurrent: boolean;
  streak: number;
}

interface Question {
  questionText: string;
  imageUrl?: string;
  options: string[];
}

interface Room {
  id: string;
  code: string;
  status: string;
  currentQuestionIndex: number;
  roundStartTime?: string;
  host: {
    id: string;
    username: string;
  };
  players: Player[];
  questions: Question[];
}

interface GetRoomData {
  getRoom: Room;
}

interface RoomUpdatedData {
  roomUpdated: Room;
}

interface JoinRoomData {
  joinRoom: {
    id: string;
    players: Player[];
  };
}

// Placeholder for now (we will build this next)
const GameScreen = ({ room }: { room: Room }) => (
  <div className="flex items-center justify-center h-screen">
    <h1 className="text-3xl font-bold animate-bounce">🎮 Game In Progress...</h1>
  </div>
);

export default function GameRoomPage() {
  const { code } = useParams();
  const { user } = useAuthStore();

  // 1. Initial Query
  const { data, loading, error, refetch } = useQuery<GetRoomData>(GET_ROOM_QUERY, {
    variables: { code },
    fetchPolicy: "network-only",
  });

  // 2. Realtime Subscription
  const { data: subData } = useSubscription<RoomUpdatedData>(ROOM_UPDATED_SUBSCRIPTION, {
    variables: { code },
  });

  // 3. Join Mutation
  const [joinRoom, { loading: joining }] = useMutation<JoinRoomData>(JOIN_ROOM_MUTATION, {
  onCompleted: () => {
    toast("Joined!", { description: "You have entered the lobby" });
    refetch(); // optional, subscription will also update
  },
  onError: (err) => toast.error("Join Failed", { description: err.message }),
});


  // Get the current room (prefer subscription data over initial query)
  const room = subData?.roomUpdated || data?.getRoom;

  // Check if user is already in the player list using useMemo to avoid re-renders
  const hasJoined = useMemo(() => {
    if (!room || !user) return false;
    return room.players.some((p) => p.userId === user.id);
  }, [room, user]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-red-500">Room Not Found</h2>
        <p className="text-muted-foreground">{error?.message || "The room does not exist"}</p>
        <Button variant="outline" onClick={() => window.location.href = "/"}>Go Home</Button>
      </div>
    );
  }

  // If not joined yet, show Join Screen
  if (!hasJoined) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">Join Room {code}</h1>
          <p className="text-muted-foreground">You are about to enter a multiplayer match.</p>
        </div>
        <Button 
          size="lg" 
          className="text-lg px-10 h-14" 
          onClick={() => joinRoom({ variables: { code } })} 
          disabled={joining}
        >
          {joining ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2" />}
          Join Game
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      {room.status === "WAITING" ? (
        <Lobby room={room} />
      ) : (
        <GameScreen room={room} />
      )}
    </main>
  );
}