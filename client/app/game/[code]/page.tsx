"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useSubscription } from "@apollo/client/react";
import { useMutation } from "@apollo/client/react";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Lobby } from "@/components/game/Lobby";
import { GET_ROOM_QUERY, ROOM_UPDATED_SUBSCRIPTION, JOIN_ROOM_MUTATION } from "@/lib/graphql";
import { useAuthStore } from "@/store/useAuthStore";
import { GameScreen } from "@/components/game/GameScreen";

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
  } | null;
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
    code: string;
    players: Player[];
  };
}


export default function GameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Safely extract code from params
  const code = typeof params.code === 'string' ? params.code : Array.isArray(params.code) ? params.code[0] : '';

  // 1. Initial Query
  const { data, loading, error, refetch } = useQuery<GetRoomData>(GET_ROOM_QUERY, {
    variables: { code },
    fetchPolicy: "network-only",
    skip: !code, // Skip if no code
  });

  // 2. Realtime Subscription
  const { data: subData } = useSubscription<RoomUpdatedData>(ROOM_UPDATED_SUBSCRIPTION, {
    variables: { code },
    skip: !code, // Skip if no code
  });

  // 3. Join Mutation
  const [joinRoom, { loading: joining }] = useMutation<JoinRoomData>(JOIN_ROOM_MUTATION, {
    onCompleted: (joinData) => {
      toast("Joined!", { description: "You have entered the lobby" });
      // Refetch to get the latest room data
      refetch();
    },
    onError: (err) => toast.error("Join Failed", { description: err.message }),
  });

  // Get the current room (prefer subscription data over initial query)
  const room = subData?.roomUpdated || data?.getRoom;

  // Check if user is the host
  const isHost = useMemo(() => {
    if (!room || !user) return false;
    return room.host?.id === user.id;
  }, [room, user]);

  // Check if user is already in the player list
  const isUserInRoom = useMemo(() => {
    if (!room || !user) return false;
    return room.players.some((p) => p.userId === user.id);
  }, [room, user]);

  // Determine if we should show the join screen
  // Show join screen only if: user is NOT the host AND user is NOT in the players list
  const shouldShowJoinScreen = !isHost && !isUserInRoom;

  if (!code) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-red-500">Invalid Room Code</h2>
        <Button variant="outline" onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

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
        <Button variant="outline" onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  // If user should see join screen (not host, not in players)
  if (shouldShowJoinScreen) {
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