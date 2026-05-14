"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [name, setName] = useState(profile?.name || "");
  const [goal, setGoal] = useState(profile?.fitness_goal || "");
  const [startingWeight, setStartingWeight] = useState(profile?.starting_weight?.toString() || "");
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight?.toString() || "");
  const [height, setHeight] = useState(profile?.height?.toString() || "");
  const supabase = createClient();

  const handleSave = async () => {
    const payload: any = {
      user_id: userId,
      name,
      fitness_goal: goal || null,
      starting_weight: startingWeight ? parseFloat(startingWeight) : null,
      target_weight: targetWeight ? parseFloat(targetWeight) : null,
      height: height ? parseFloat(height) : null,
    };

    // If we already have a profile row, include its id so upsert targets the right row
    if (profile?.id) {
      payload.id = profile.id;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.error(error);
      toast.error("Failed to save profile");
      return;
    }

    toast.success("Profile updated!");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile</h2>

      <div className="flex justify-center">
        <Avatar className="h-20 w-20 bg-emerald-500/20">
          <AvatarFallback className="text-2xl text-emerald-400">
            {name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm">Your Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Fitness Goal</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="bulk">Bulk 💪</SelectItem>
                <SelectItem value="cut">Cut ✂️</SelectItem>
                <SelectItem value="maintain">Maintain ⚖️</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Start Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={startingWeight}
                onChange={(e) => setStartingWeight(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <Label>Target (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <Label>Height (cm)</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700">
            Save Profile
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full border-red-600/30 text-red-400 hover:bg-red-950"
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }}
      >
        Sign Out
      </Button>
    </div>
  );
}
