"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Field, FieldLabel, FieldGroup, FieldError } from "@/components/ui/field";
import { toast } from "sonner";

import { REGISTER_MUTATION } from "@/lib/graphql";
import { useAuthStore } from "@/store/useAuthStore";

// 1️⃣ Validation schema
const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// 2️⃣ Mutation response typing (FIXES `unknown`)
interface RegisterData {
  register: {
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
      avatar?: string;
      stats?: {
        totalScore: number;
        gamesWon: number;
        bestStreak: number;
        gamesPlayed: number;
      };
    };
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const loginUser = useAuthStore((state) => state.login);

  // 3️⃣ Typed mutation (same as Login)
  const [registerMutation, { loading }] = useMutation<RegisterData>(
    REGISTER_MUTATION,
    {
      onCompleted: (data) => {
        loginUser(data.register.token, data.register.user);
        toast("Account created!", {
          description: "Welcome to GeoMaster.",
        });
        router.push("/");
      },
      onError: (err) => {
        toast.error("Registration failed", {
          description: err.message,
        });
      },
    }
  );

  // 4️⃣ Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    registerMutation({ variables: values });
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Create Account
          </CardTitle>
          <CardDescription>Join the GeoMaster community</CardDescription>
        </CardHeader>

        <CardContent>
          <form id="register-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-username">
                      Username
                    </FieldLabel>
                    <Input
                      {...field}
                      id="register-username"
                      placeholder="Geographer123"
                      autoComplete="username"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="register-email"
                      placeholder="user@example.com"
                      autoComplete="email"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-password">
                      Password
                    </FieldLabel>
                    <Input
                      {...field}
                      id="register-password"
                      type="password"
                      autoComplete="new-password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button
              type="submit"
              className="w-full mt-4"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
