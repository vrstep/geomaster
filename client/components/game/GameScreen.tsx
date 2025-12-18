"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { useMutation } from "@apollo/client/react";
import { Check, X, Clock, Trophy, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SUBMIT_ANSWER_MUTATION } from "@/lib/graphql";
import { useAuthStore } from "@/store/useAuthStore";

// --- Types ---
interface Player {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
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
  config: {
    isHostPlaying: boolean;
    type: string;
    mode: string;
  };
  host: { id: string } | null;
  players: Player[];
  questions: Question[];
}

interface GameScreenProps {
  room: Room;
}

// ----------------------------------------------------------------------
// SUB-COMPONENT: The Active Question Area
// ----------------------------------------------------------------------
function ActiveQuestionView({ room, myPlayer }: { room: Room; myPlayer?: Player }) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [submitAnswer, { loading: submitting }] = useMutation(SUBMIT_ANSWER_MUTATION);
  const [feedback, setFeedback] = useState<"CORRECT" | "WRONG" | "TIMEOUT" | null>(null);
  
  const initialScore = useRef(myPlayer?.score || 0);
  const { user } = useAuthStore();
  const isProjectorMode = room.host?.id === user?.id && !room.config.isHostPlaying;
  const currentQuestion = room.questions[room.currentQuestionIndex];

  // 1. Timer Logic
  useEffect(() => {
    if (!room.roundStartTime) return;

    let start = new Date(room.roundStartTime).getTime();
    if (Number.isNaN(start)) {
      const parsedInt = parseInt(String(room.roundStartTime), 10);
      if (!Number.isNaN(parsedInt)) start = new Date(parsedInt).getTime();
    }

    if (Number.isNaN(start)) return;

    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      const remaining = Math.max(0, 20 - elapsed);
      setTimeLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [room.roundStartTime]);

  // 2. Score Feedback Logic
  useEffect(() => {
    if (!myPlayer) return;
    if (myPlayer.score > initialScore.current) {
      setFeedback("CORRECT");
    } else if (myPlayer.hasAnsweredCurrent && myPlayer.score === initialScore.current && !feedback) {
      // If timeLeft is 0, assume it was a timeout, otherwise it was a wrong click
      setFeedback(timeLeft === 0 ? "TIMEOUT" : "WRONG");
    }
  }, [myPlayer?.score, myPlayer?.hasAnsweredCurrent, feedback, myPlayer, timeLeft]);

  // 3. Handle Answer Submission
  const handleAnswer = (index: number) => {
    // Prevent manual clicks if time is out, BUT allow index -1 (auto-submit)
    if ((timeLeft === 0 && index !== -1) || submitting) return;

    submitAnswer({
      variables: { code: room.code, answerIndex: index },
      onError: (err) => toast.error("Failed", { description: err.message })
    });
  };

  // 4. ✅ AUTO-SUBMIT ON TIMEOUT
  useEffect(() => {
    // If time is up, player exists, hasn't answered, and isn't currently submitting
    if (timeLeft === 0 && myPlayer && !myPlayer.hasAnsweredCurrent && !submitting) {
      console.log("Time up! Auto-submitting...");
      handleAnswer(-1); // -1 ensures it matches no option and counts as wrong
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, myPlayer?.hasAnsweredCurrent, submitting]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1 border-2">
            Round {room.currentQuestionIndex + 1} / {room.questions.length}
          </Badge>
          <span className="font-bold text-slate-400 uppercase tracking-widest text-sm hidden md:inline-block">
            {room.config.type} Mode
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className={cn("w-6 h-6", timeLeft < 5 ? "text-red-500 animate-pulse" : "text-slate-600")} />
          <span className={cn("text-2xl font-black font-mono", timeLeft < 5 ? "text-red-500" : "text-slate-700")}>
            {timeLeft}s
          </span>
        </div>
      </div>
      
      <Progress value={(timeLeft / 20) * 100} className="h-3 mb-8 transition-all duration-1000 ease-linear" />

      {/* Question Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl md:text-4xl font-bold text-center text-slate-800 leading-tight">
          {currentQuestion.questionText}
        </h2>
        {currentQuestion.imageUrl && (
          <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-white max-h-[300px] md:max-h-[400px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={currentQuestion.imageUrl} 
              alt="Question" 
              className="object-contain h-full w-full bg-slate-200"
            />
          </div>
        )}
        
        {/* Answer Buttons */}
        {!isProjectorMode && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {currentQuestion.options.map((option, idx) => {
               const colors = [
                 "bg-red-500 hover:bg-red-600 border-red-700",
                 "bg-blue-500 hover:bg-blue-600 border-blue-700",
                 "bg-yellow-500 hover:bg-yellow-600 border-yellow-700",
                 "bg-green-500 hover:bg-green-600 border-green-700"
               ];
               return (
                 <Button
                   key={idx}
                   onClick={() => handleAnswer(idx)}
                   disabled={myPlayer?.hasAnsweredCurrent || timeLeft === 0 || submitting}
                   className={cn(
                     "h-20 md:h-24 text-xl md:text-2xl font-bold shadow-lg border-b-4 transition-all active:border-b-0 active:translate-y-1",
                     colors[idx % 4],
                     myPlayer?.hasAnsweredCurrent && "opacity-50 cursor-not-allowed"
                   )}
                 >
                   <span className="mr-3 opacity-50">
                     {idx === 0 && "▲"} {idx === 1 && "◆"} {idx === 2 && "●"} {idx === 3 && "■"}
                   </span>
                   {option}
                 </Button>
               );
            })}
          </div>
        )}

        {/* Feedback Overlay */}
        {myPlayer?.hasAnsweredCurrent && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in">
            <Card className="w-[90%] max-w-md shadow-2xl border-0">
              <CardContent className="flex flex-col items-center p-8 text-center">
                {feedback === "CORRECT" ? (
                    <>
                      <Check className="w-20 h-20 text-green-500 mb-4 animate-bounce" />
                      <h2 className="text-3xl font-black text-green-600 mb-2">Correct!</h2>
                      <p className="text-muted-foreground">+100 pts (+speed bonus)</p>
                    </>
                ) : feedback === "WRONG" ? (
                    <>
                      <X className="w-20 h-20 text-red-500 mb-4 animate-shake" />
                      <h2 className="text-3xl font-black text-red-600 mb-2">Wrong Answer</h2>
                      <p className="text-muted-foreground">Better luck next round!</p>
                    </>
                ) : feedback === "TIMEOUT" ? (
                    <>
                      <Clock className="w-20 h-20 text-orange-500 mb-4 animate-pulse" />
                      <h2 className="text-3xl font-black text-orange-600 mb-2">Time's Up!</h2>
                      <p className="text-muted-foreground">Too slow this time.</p>
                    </>
                ) : (
                    <>
                      <Loader2 className="w-16 h-16 text-indigo-500 mb-4 animate-spin" />
                      <h2 className="text-2xl font-bold text-indigo-900 mb-2">Submitted</h2>
                      <p className="text-muted-foreground">Waiting for others...</p>
                    </>
                )}
                
                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Trophy className="w-4 h-4" /> 
                  Streak: {myPlayer.streak} 🔥
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENT: Game Over
// ----------------------------------------------------------------------
function GameOverScreen({ players }: { players: Player[] }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const second = sortedPlayers[1];
  const third = sortedPlayers[2];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white p-6 animate-in fade-in zoom-in duration-500">
      <Trophy className="w-24 h-24 text-yellow-400 mb-6 animate-bounce" />
      <h1 className="text-5xl font-black mb-2">GAME OVER</h1>
      <p className="text-xl text-indigo-200 mb-12">Final Standings</p>

      <div className="flex items-end gap-4 mb-12">
        {second && (
          <div 
            className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700"
            style={{ animationDelay: '300ms', animationFillMode: 'both' }}
          >
            <Avatar className="w-16 h-16 border-4 border-slate-400 mb-2">
              <AvatarImage src={second.avatar} />
              <AvatarFallback className="text-slate-900 font-bold">{second.username[0]}</AvatarFallback>
            </Avatar>
            <div className="h-32 w-24 bg-slate-500 rounded-t-lg flex items-center justify-center text-2xl font-bold">2nd</div>
            <p className="mt-2 font-bold">{second.username}</p>
            <p className="text-sm opacity-80">{second.score} pts</p>
          </div>
        )}

        {winner && (
          <div 
            className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-12 duration-700"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
          >
             <div className="relative">
               <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
               <Avatar className="w-24 h-24 border-4 border-yellow-400 mb-4">
                  <AvatarImage src={winner.avatar} />
                  <AvatarFallback className="text-slate-900 font-bold text-2xl">{winner.username[0]}</AvatarFallback>
               </Avatar>
             </div>
             <div className="h-48 w-32 bg-yellow-500 rounded-t-lg flex items-center justify-center text-4xl font-black shadow-xl text-yellow-900">1st</div>
             <p className="mt-2 font-bold text-xl">{winner.username}</p>
             <p className="text-sm opacity-80">{winner.score} pts</p>
          </div>
        )}

        {third && (
          <div 
            className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700"
            style={{ animationDelay: '500ms', animationFillMode: 'both' }}
          >
            <Avatar className="w-16 h-16 border-4 border-orange-700 mb-2">
              <AvatarImage src={third.avatar} />
              <AvatarFallback className="text-slate-900 font-bold">{third.username[0]}</AvatarFallback>
            </Avatar>
            <div className="h-24 w-24 bg-orange-800 rounded-t-lg flex items-center justify-center text-2xl font-bold">3rd</div>
            <p className="mt-2 font-bold">{third.username}</p>
            <p className="text-sm opacity-80">{third.score} pts</p>
          </div>
        )}
      </div>

      <Button onClick={() => window.location.href = "/"} variant="secondary" size="lg" className="font-bold">
        Back to Dashboard
      </Button>
    </div>
  );
}

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export function GameScreen({ room }: GameScreenProps) {
  const { user } = useAuthStore();
  const myPlayer = room.players.find(p => p.userId === user?.id);

  if (room.status === "FINISHED") {
    return <GameOverScreen players={room.players} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* KEY TRICK: passing room.currentQuestionIndex as 'key' 
        forces ActiveQuestionView to unmount/remount on question change.
        This automatically resets timer, feedback, and local state!
      */}
      <ActiveQuestionView 
        key={room.currentQuestionIndex} 
        room={room} 
        myPlayer={myPlayer} 
      />

      {/* RIGHT: Sidebar (Leaderboard) */}
      <div className="w-full md:w-80 bg-white border-l p-4 flex flex-col shadow-xl z-10">
         <div className="flex items-center gap-2 mb-4 pb-4 border-b">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-lg">Leaderboard</h3>
         </div>
         
         <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {[...room.players]
              .sort((a, b) => b.score - a.score)
              .map((player, idx) => (
               <div 
                 key={player.userId} 
                 className={cn(
                   "flex items-center gap-3 p-2 rounded-lg transition-all",
                   player.userId === user?.id ? "bg-indigo-50 border border-indigo-200" : "hover:bg-slate-50"
                 )}
               >
                  <div className={cn(
                    "w-6 h-6 flex items-center justify-center rounded font-bold text-xs",
                    idx === 0 ? "bg-yellow-100 text-yellow-700" :
                    idx === 1 ? "bg-slate-100 text-slate-700" :
                    idx === 2 ? "bg-orange-100 text-orange-700" : "text-slate-400"
                  )}>
                    {idx + 1}
                  </div>
                  
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={player.avatar} />
                    <AvatarFallback className="text-xs">{player.username[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold truncate">{player.username}</p>
                     <p className="text-xs text-muted-foreground">{player.score} pts</p>
                  </div>

                  {player.hasAnsweredCurrent && (
                     <Check className="w-4 h-4 text-green-500" />
                  )}
               </div>
            ))}
         </div>
         
         <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Room Code</p>
            <p className="text-2xl font-mono font-black">{room.code}</p>
         </div>
      </div>
    </div>
  );
}