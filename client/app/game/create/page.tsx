"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Globe, Flag, Map, Trophy, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldGroup, FieldError } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CREATE_ROOM_MUTATION } from "@/lib/graphql";

// Validation Schema
const formSchema = z.object({
  mode: z.enum(["SINGLE", "MULTI"]),
  type: z.enum(["CAPITALS", "FLAGS", "BORDERS"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  isRanked: z.boolean(),
  region: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Define types for the mutation response
interface CreateRoomData {
  createRoom: {
    id: string;
    code: string;
    status: string;
    host: {
      username: string;
    };
  };
}

export default function CreateGamePage() {
  const router = useRouter();
  
  // Setup Mutation
  const [createRoom, { loading }] = useMutation<CreateRoomData>(CREATE_ROOM_MUTATION, {
    onCompleted: (data) => {
      const code = data.createRoom.code;
      toast("Room Created!", { description: `Room Code: ${code}` });
      // Redirect to the lobby
      router.push(`/game/${code}`);
    },
    onError: (err) => {
      toast.error("Error", { description: err.message });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "MULTI",
      type: "CAPITALS",
      difficulty: "MEDIUM",
      isRanked: false,
      region: "ALL",
    },
  });

  function onSubmit(values: FormValues) {
    createRoom({
      variables: {
        config: {
          mode: values.mode,
          type: values.type,
          difficulty: values.difficulty,
          isRanked: values.isRanked,
          region: values.region === "ALL" ? null : values.region,
        },
      },
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Setup Game</CardTitle>
          <CardDescription className="text-center">Customize your geography challenge</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form id="create-game-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              
              {/* 1. Game Mode (Tabs) */}
              <Controller
                control={form.control}
                name="mode"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Game Mode</FieldLabel>
                    <Tabs 
                      onValueChange={field.onChange} 
                      value={field.value} 
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 h-14">
                        <TabsTrigger value="MULTI" className="text-lg gap-2">
                          <Users className="w-5 h-5" /> Multiplayer
                        </TabsTrigger>
                        <TabsTrigger value="SINGLE" className="text-lg gap-2">
                          <User className="w-5 h-5" /> Single Player
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* 2. Game Type (Visual Cards) */}
              <Controller
                control={form.control}
                name="type"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Quiz Type</FieldLabel>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      {/* Option 1: Capitals */}
                      <label 
                        htmlFor="type-capitals"
                        className={cn(
                          "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                          field.value === "CAPITALS" && "border-primary bg-primary/5 ring-2 ring-primary"
                        )}
                      >
                        <RadioGroupItem value="CAPITALS" id="type-capitals" className="sr-only" />
                        <Globe className="mb-3 h-10 w-10 text-blue-500" />
                        <span className="font-bold">Capitals</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">Guess the capital city</span>
                      </label>

                      {/* Option 2: Flags */}
                      <label 
                        htmlFor="type-flags"
                        className={cn(
                          "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                          field.value === "FLAGS" && "border-primary bg-primary/5 ring-2 ring-primary"
                        )}
                      >
                        <RadioGroupItem value="FLAGS" id="type-flags" className="sr-only" />
                        <Flag className="mb-3 h-10 w-10 text-red-500" />
                        <span className="font-bold">Flags</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">Identify the country flag</span>
                      </label>

                      {/* Option 3: Borders */}
                      <label 
                        htmlFor="type-borders"
                        className={cn(
                          "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                          field.value === "BORDERS" && "border-primary bg-primary/5 ring-2 ring-primary"
                        )}
                      >
                        <RadioGroupItem value="BORDERS" id="type-borders" className="sr-only" />
                        <Map className="mb-3 h-10 w-10 text-green-500" />
                        <span className="font-bold">Outlines</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">Guess by border shape</span>
                      </label>
                    </RadioGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* 3. Difficulty & Region (Row) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  control={form.control}
                  name="difficulty"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="difficulty-select">Difficulty</FieldLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="difficulty-select">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="region"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="region-select">Region (Optional)</FieldLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="region-select">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All World</SelectItem>
                          <SelectItem value="EUROPE">Europe</SelectItem>
                          <SelectItem value="ASIA">Asia</SelectItem>
                          <SelectItem value="AFRICA">Africa</SelectItem>
                          <SelectItem value="AMERICAS">Americas</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* 4. Ranked Toggle */}
              <Controller
                control={form.control}
                name="isRanked"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FieldLabel className="text-base flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-500" /> Ranked Match
                        </FieldLabel>
                        <p className="text-sm text-muted-foreground">
                          Win XP and climb the global leaderboard.
                        </p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

            </FieldGroup>

            <Button type="submit" size="lg" className="w-full text-lg h-12 mt-6" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Room...
                </>
              ) : (
                "Create & Invite Players"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}