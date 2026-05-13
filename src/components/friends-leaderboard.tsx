"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Dumbbell, Flame, TrendingUp, Award } from "lucide-react";
import { startOfMonth, isSameMonth } from "date-fns";
import type { Profile, Workout, AttendanceLog, BodyWeightLog } from "@/types/database";

type WorkoutWithSets = Workout & { workout_sets: any[] };

export function FriendsLeaderboard({
  currentUserId,
  profiles,
  workouts,
  attendance,
  weights,
}: {
  currentUserId: string;
  profiles: Profile[];
  workouts: WorkoutWithSets[];
  attendance: AttendanceLog[];
  weights: BodyWeightLog[];
}) {
  const currentMonth = startOfMonth(new Date());

  const getUserStats = (userId: string) => {
    const userWorkouts = workouts.filter((w) => w.user_id === userId);
    const userAttendance = attendance.filter((a) => a.user_id === userId);
    const userWeights = weights.filter((w) => w.user_id === userId);
    
    const monthAttendance = userAttendance.filter((a) => 
      isSameMonth(new Date(a.date), currentMonth) && a.status === "present"
    ).length;

    const prs = userWorkouts.filter((w) => w.is_pr).length;
    
    const latestWeight = userWeights[0]?.weight;
    const firstWeight = userWeights[userWeights.length - 1]?.weight;
    const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : 0;

    const totalVolume = userWorkouts.reduce((acc, w) => 
      acc + w.workout_sets.reduce((sacc: number, s: any) => sacc + (s.weight * s.reps), 0), 0
    );

    return { monthAttendance, prs, weightChange, totalVolume, latestWeight };
  };

  const getBadge = (stats: ReturnType<typeof getUserStats>) => {
    if (stats.prs >= 3) return { label: "PR Monster", icon: Crown, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    if (stats.monthAttendance >= 20) return { label: "Consistency King", icon: Flame, color: "text-orange-400 bg-orange-500/10 border-orange-500/30" };
    if (stats.weightChange >= 2) return { label: "Bulk Mode", icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    if (stats.weightChange <= -2) return { label: "Cut Mode", icon: TrendingUp, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" };
    return { label: "Comeback Arc", icon: Award, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" };
  };

  const sortedProfiles = [...profiles].sort((a, b) => {
    const statsA = getUserStats(a.user_id);
    const statsB = getUserStats(b.user_id);
    return statsB.monthAttendance - statsA.monthAttendance;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Crew Leaderboard</h2>
      <p className="text-zinc-500 text-sm">Friendly competition keeps us accountable 💪</p>

      <div className="space-y-4">
        {sortedProfiles.map((profile, index) => {
          const stats = getUserStats(profile.user_id);
          const badge = getBadge(stats);
          const isCurrentUser = profile.user_id === currentUserId;

          return (
            <Card 
              key={profile.id} 
              className={`bg-zinc-900/50 border-zinc-800 ${isCurrentUser ? "border-emerald-500/30" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12 bg-zinc-800">
                      <AvatarFallback className="bg-zinc-800 text-zinc-300 text-lg">
                        {profile.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1">
                        <Crown className="h-3 w-3 text-black" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {profile.name}
                          {isCurrentUser && (
                            <span className="text-xs text-emerald-400 font-normal">(You)</span>
                          )}
                        </h3>
                        <Badge variant="outline" className={`text-xs mt-1 ${badge.color}`}>
                          <badge.icon className="h-3 w-3 mr-1" />
                          {badge.label}
                        </Badge>
                      </div>
                      <span className="text-2xl font-bold text-zinc-600">#{index + 1}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">This Month</p>
                        <div className="flex items-center gap-2">
                          <Progress value={(stats.monthAttendance / 30) * 100} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{stats.monthAttendance}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">PRs</p>
                        <div className="flex items-center gap-1">
                          <Dumbbell className="h-3 w-3 text-amber-500" />
                          <span className="text-sm font-medium">{stats.prs}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-3 text-xs text-zinc-400">
                      <span>Weight: {stats.latestWeight ? `${stats.latestWeight}kg` : "--"}</span>
                      <span className={stats.weightChange > 0 ? "text-emerald-400" : stats.weightChange < 0 ? "text-red-400" : ""}>
                        {stats.weightChange > 0 ? "+" : ""}{stats.weightChange.toFixed(1)}kg
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
