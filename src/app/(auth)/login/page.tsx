
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useState, useActionState } from "react";
import { emailLogin } from "@/app/(auth)/actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, formAction, isPending] = useActionState(emailLogin, null);

  return (
    <Card className="w-full shadow-xl border-border">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary p-3 rounded-full inline-flex">
            <LogIn className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 text-center font-medium">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email"
              type="email" 
              placeholder="m@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/update-password"
                className="text-sm text-primary hover:underline"
                onClick={(e) => {
                  if (isPending) e.preventDefault();
                  console.log("Forgot password clicked - (static template)");
                }}
              >
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              name="password"
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            type="submit"
            className="w-full" 
            disabled={isPending}
          >
            {isPending ? "Signing In..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
