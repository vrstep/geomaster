"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { useMutation } from "@apollo/client/react";
import { Check, X, Clock, Trophy, Loader2, Crown, LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SUBMIT_ANSWER_MUTATION, LEAVE_ROOM_MUTATION } from "@/lib/graphql";
import { useAuthStore } from "@/store/useAuthStore";

interface Player {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  hasAnsweredCurrent: boolean;
  currentAnswer: number | null;
  streak: number;
}

interface Question {
  questionText: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: string;
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

function ActiveQuestionView({ room, myPlayer }: { room: Room; myPlayer?: Player }) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [submitAnswer, { loading: submitting }] = useMutation(SUBMIT_ANSWER_MUTATION);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [showAnswerDistribution, setShowAnswerDistribution] = useState(false);
  const [answerDistribution, setAnswerDistribution] = useState<number[]>([0, 0, 0, 0]);
  
  const hasSubmittedRef = useRef(false);
  const wasTimeoutRef = useRef(false);
  const previousQuestionIndex = useRef(room.currentQuestionIndex);
  const { user } = useAuthStore();
  const isProjectorMode = room.host?.id === user?.id && !room.config.isHostPlaying;
  const currentQuestion = room.questions[room.currentQuestionIndex];
  
  const allPlayersAnswered = room.players.every(p => p.hasAnsweredCurrent);

  useEffect(() => {
    if (room.currentQuestionIndex !== previousQuestionIndex.current) {
      hasSubmittedRef.current = false;
      wasTimeoutRef.current = false;
      setSelectedAnswerIndex(null);
      setShowAnswerDistribution(false);
      previousQuestionIndex.current = room.currentQuestionIndex;
    }
  }, [room.currentQuestionIndex]);

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

  useEffect(() => {
    if (allPlayersAnswered && !showAnswerDistribution) {
      console.log('All players answered! Showing distribution...');
      
      const distribution = [0, 0, 0, 0];
      room.players.forEach(player => {
        console.log(`Player ${player.username} answered: ${player.currentAnswer}`);
        if (player.currentAnswer !== null && player.currentAnswer >= 0 && player.currentAnswer < 4) {
          distribution[player.currentAnswer]++;
        }
      });
      
      console.log('Distribution:', distribution);
      setAnswerDistribution(distribution);
      setShowAnswerDistribution(true);
      
      setTimeout(() => {
        console.log('Hiding distribution overlay');
        setShowAnswerDistribution(false);
      }, 1500);
    }
  }, [allPlayersAnswered, showAnswerDistribution, room.players]);

  const handleAnswer = (index: number) => {
    if (hasSubmittedRef.current || submitting) return;
    if (timeLeft === 0 && index !== -1) return;

    if (index !== -1) {
      setSelectedAnswerIndex(index);
    }

    if (index === -1) {
      wasTimeoutRef.current = true;
    }

    hasSubmittedRef.current = true;

    submitAnswer({
      variables: { code: room.code, answerIndex: index },
      onError: (err) => toast.error("Failed", { description: err.message })
    });
  };

  useEffect(() => {
    if (timeLeft === 0 && myPlayer && !myPlayer.hasAnsweredCurrent && !submitting && !hasSubmittedRef.current) {
      console.log("Time up! Auto-submitting...");
      handleAnswer(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, myPlayer?.hasAnsweredCurrent, submitting]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 relative overflow-hidden">
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
        
        {!isProjectorMode && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {currentQuestion.options.map((option, idx) => {
               const colors = [
                 "bg-red-500 hover:bg-red-600 border-red-700",
                 "bg-blue-500 hover:bg-blue-600 border-blue-700",
                 "bg-yellow-500 hover:bg-yellow-600 border-yellow-700",
                 "bg-green-500 hover:bg-green-600 border-green-700"
               ];
               const isSelected = selectedAnswerIndex === idx;
               
               return (
                 <Button
                   key={idx}
                   onClick={() => handleAnswer(idx)}
                   disabled={myPlayer?.hasAnsweredCurrent || timeLeft === 0 || submitting}
                   className={cn(
                     "h-20 md:h-24 text-xl md:text-2xl font-bold shadow-lg transition-all",
                     colors[idx % 4],
                     isSelected && myPlayer?.hasAnsweredCurrent 
                       ? "border-b-0 translate-y-1 scale-95 ring-4 ring-white/50" 
                       : "border-b-4 active:border-b-0 active:translate-y-1",
                     myPlayer?.hasAnsweredCurrent && !isSelected && "opacity-50"
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

        {/* Answer Distribution Overlay - Shows briefly after all players answer */}
        {showAnswerDistribution && allPlayersAnswered && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in">
            <Card className="w-[90%] max-w-2xl shadow-2xl border-0">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-center mb-6">Answer Distribution</h3>
                <div className="space-y-4">
                  {currentQuestion.options.map((option, idx) => {
                    const colors = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500"];
                    const icons = ["▲", "◆", "●", "■"];
                    const count = answerDistribution[idx];
                    const percentage = room.players.length > 0 ? (count / room.players.length) * 100 : 0;
                    const isCorrect = option === (currentQuestion as any).correctAnswer;
                    
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-lg transition-all",
                          isCorrect && "bg-green-100 ring-4 ring-green-500 ring-opacity-50"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded flex items-center justify-center text-white font-bold relative",
                          colors[idx]
                        )}>
                          {icons[idx]}
                          {isCorrect && (
                            <Check className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full p-0.5 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className={cn(
                              "font-medium truncate",
                              isCorrect && "font-bold text-green-700"
                            )}>
                              {option}
                              {isCorrect && " ✓"}
                            </span>
                            <span className="font-bold ml-2">{count} player{count !== 1 ? 's' : ''}</span>
                          </div>
                          <Progress 
                            value={percentage} 
                            className={cn(
                              "h-2",
                              isCorrect && "bg-green-200"
                            )} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Waiting for Others - Shows after player answers but before all finish */}
        {myPlayer?.hasAnsweredCurrent && !showAnswerDistribution && !allPlayersAnswered && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
            <Card className="shadow-lg border-2 border-indigo-200 bg-white/95 backdrop-blur">
              <CardContent className="flex items-center gap-3 p-4">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                <div>
                  <p className="font-bold text-sm">Waiting for others...</p>
                  <p className="text-xs text-muted-foreground">
                    {room.players.filter(p => p.hasAnsweredCurrent).length} / {room.players.length} answered
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gray overlay when player has answered */}
        {myPlayer?.hasAnsweredCurrent && !showAnswerDistribution && (
          <div className="absolute inset-0 bg-slate-900/20 pointer-events-none z-10" />
        )}
      </div>
    </div>
  );
}

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
            <p className="text-xs opacity-80">{third.score} pts</p>
          </div>
        )}
      </div>

      <Button onClick={() => window.location.href = "/"} variant="secondary" size="lg" className="font-bold">
        Back to Dashboard
      </Button>
    </div>
  );
}

export function GameScreen({ room }: GameScreenProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const myPlayer = room.players.find(p => p.userId === user?.id);

  const [leaveRoom, { loading: leaving }] = useMutation(LEAVE_ROOM_MUTATION, {
    variables: { code: room.code },
    onCompleted: () => {
      toast.success("Left Game", { description: "You have left the game" });
      router.push("/");
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const handleLeaveRoom = () => {
    if (confirm("Are you sure you want to leave this game? Your current score will be saved.")) {
      leaveRoom();
    }
  };

  if (room.status === "FINISHED") {
    return <GameOverScreen players={room.players} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      <ActiveQuestionView 
        key={room.currentQuestionIndex} 
        room={room} 
        myPlayer={myPlayer} 
      />

      {/* RIGHT: Sidebar (Leaderboard) */}
      <div className="w-full md:w-80 bg-white border-l p-4 flex flex-col shadow-xl z-10">
         <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold text-lg">Leaderboard</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveRoom}
              disabled={leaving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Leave Game"
            >
              {leaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            </Button>
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