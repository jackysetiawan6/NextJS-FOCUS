
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
import { KeyRound } from "lucide-react";
import { useState, useActionState, startTransition } from "react";
import { resetPassword } from "../actions"; 

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return;
    }
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  const passwordsMatch = newPassword === confirmPassword;

  return (
    <Card className="w-full shadow-xl border-border">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary p-3 rounded-full inline-flex">
            <KeyRound className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold">Change Password</CardTitle>
        <CardDescription>
          Please choose a new password for your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 text-center font-medium">
              {state.error}
            </div>
          )}
          {!passwordsMatch && confirmPassword.length > 0 && (
            <div className="p-3 text-sm text-destructive bg-destructive/5 rounded-md border border-destructive/20 text-center font-medium">
              Passwords do not match.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input 
              id="newPassword" 
              name="newPassword"
              type="password" 
              placeholder="Enter new password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password" 
              placeholder="Confirm new password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit"
            className="w-full"
            disabled={isPending || (!passwordsMatch && confirmPassword.length > 0)}
          >
            {isPending ? "Updating..." : "Update Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
