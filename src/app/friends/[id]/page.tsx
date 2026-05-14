import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Dumbbell, TrendingUp, Weight, Calendar } from "lucide-react";

export default async function FriendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch friend's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", id)
    .single();

  if (!profile) notFound();

  // Fetch stats
  const { data: latestWeight } = await supabase
    .from("body_weight_logs")
    .select("*")
    .eq("user_id", id)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const { data: prs } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", id)
    .eq("is_pr", true)
    .order("date", { ascending: false })
    .limit(5);

  const { data: recentWorkouts } = await supabase
    .from("workouts")
    .select("*, workout_sets(*)")
    .eq("user_id", id)
    .order("date", { ascending: false })
    .limit(5);

  const { data: attendance } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("user_id", id)
    .eq("status", "present");

  const streak = attendance ? calculateStreak(attendance.map((a) => new Date(a.date))) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 bg-emerald-500/20">
          <AvatarFallback className="text-xl text-emerald-400">
            {profile.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 capitalize">
            {profile.fitness_goal} Mode
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Weight className="h-4 w-4" />
              <span className="text-xs">Current Weight</span>
            </div>
            <p className="text-xl font-bold">{latestWeight ? `${latestWeight.weight}kg` : "--"}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs">Streak</span>
            </div>
            <p className="text-xl font-bold">{streak} days</p>
          </CardContent>
        </Card>
      </div>

      {prs && prs.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Recent PRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prs.map((pr) => (
                <div key={pr.id} className="flex justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="font-medium">{pr.exercise_name}</span>
                  <span className="text-sm text-zinc-400">{format(new Date(pr.date), "MMM d")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Dumbbell className="h-4 w-4" /> Recent Workouts
        </h3>
        {recentWorkouts && recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {recentWorkouts.map((w) => (
              <Card key={w.id} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{w.exercise_name}</p>
                      <p className="text-xs text-zinc-500">{w.muscle_group}</p>
                    </div>
                    <Badge variant="secondary">{format(new Date(w.date), "MMM d")}</Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {w.workout_sets?.map((set: any) => (
                      <Badge key={set.id} variant="outline" className="border-zinc-700">
                        {set.reps} × {set.weight}kg
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-zinc-900/30 border-zinc-800 border-dashed">
            <CardContent className="p-6 text-center text-zinc-500">No recent workouts</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function calculateStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let currentDate = today;
  for (const date of sorted) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
