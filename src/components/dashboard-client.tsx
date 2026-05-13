"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, Flame, Calendar, Dumbbell, Trophy, ArrowRight, Weight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { Profile, Workout, BodyWeightLog } from "@/types/database";

type WeekDay = {
  day: string;
  status: "present" | "absent" | "rest" | null;
  date: Date;
};

export function DashboardClient({
  profile,
  allProfiles,
  latestWeight,
  streak,
  weekProgress,
  latestWorkout,
  prs,
  currentUserId,
}: {
  profile: Profile;
  allProfiles: Profile[];
  latestWeight: BodyWeightLog | null;
  streak: number;
  weekProgress: WeekDay[];
  latestWorkout: (Workout & { workout_sets: any[] }) | null;
  prs: Workout[];
  currentUserId: string;
}) {
  const friends = allProfiles.filter((p) => p.user_id !== currentUserId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {profile.name} 👊</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {format(new Date(), "EEEE, MMMM do")}
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
          {profile.fitness_goal?.toUpperCase()} MODE
        </Badge>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Weight className="h-4 w-4" />
              <span className="text-xs font-medium">Current Weight</span>
            </div>
            <p className="text-2xl font-bold">
              {latestWeight ? `${latestWeight.weight}kg` : "--"}
            </p>
            {profile.starting_weight && latestWeight && (
              <p className="text-xs text-emerald-400 mt-1">
                {(latestWeight.weight - profile.starting_weight) > 0 ? "+" : ""}
                {(latestWeight.weight - profile.starting_weight).toFixed(1)}kg total
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium">Current Streak</span>
            </div>
            <p className="text-2xl font-bold">{streak} days</p>
            <p className="text-xs text-zinc-500 mt-1">Keep it burning!</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-2">
            {weekProgress.map((day) => (
              <div key={day.day} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs text-zinc-500">{day.day}</span>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold
                    ${day.status === "present"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : day.status === "rest"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                    }`}
                >
                  {day.status === "present" ? "✓" : day.status === "rest" ? "Z" : ""}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Latest Workout */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Latest Workout
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestWorkout ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{latestWorkout.exercise_name}</p>
                  <p className="text-xs text-zinc-500">{latestWorkout.muscle_group}</p>
                </div>
                <Badge variant="secondary">
                  {format(new Date(latestWorkout.date), "MMM d")}
                </Badge>
              </div>
              <div className="flex gap-4 text-sm">
                {latestWorkout.workout_sets?.map((set: any) => (
                  <span key={set.id} className="text-zinc-300">
                    {set.reps}×{set.weight}kg
                  </span>
                ))}
              </div>
              {latestWorkout.is_pr && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  <Trophy className="h-3 w-3 mr-1" /> NEW PR
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No workouts logged yet. Time to hit the gym!</p>
          )}
        </CardContent>
      </Card>

      {/* Personal Records */}
      {prs.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Recent PRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prs.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="font-medium">{pr.exercise_name}</span>
                  <span className="text-sm text-zinc-400">
                    {format(new Date(pr.date), "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Friend Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Crew Activity</h3>
        <div className="space-y-3">
          {friends.map((friend) => (
            <Link key={friend.user_id} href={`/friends/${friend.user_id}`}>
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-zinc-800">
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                        {friend.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{friend.name}</p>
                      <p className="text-xs text-zinc-500 capitalize">{friend.fitness_goal} mode</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 h-14">
          <Link href="/workouts">
            <Dumbbell className="h-5 w-5 mr-2" />
            Log Workout
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-zinc-700 h-14">
          <Link href="/attendance">
            <Calendar className="h-5 w-5 mr-2" />
            Check In
          </Link>
        </Button>
      </div>
    </div>
  );
}
