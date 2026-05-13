import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FriendsLeaderboard } from "@/components/friends-leaderboard";

export default async function FriendsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiles } = await supabase.from("profiles").select("*");
  const { data: allWorkouts } = await supabase
    .from("workouts")
    .select("*, workout_sets(*)");
  const { data: allAttendance } = await supabase
    .from("attendance_logs")
    .select("*");
  const { data: allWeights } = await supabase
    .from("body_weight_logs")
    .select("*")
    .order("date", { ascending: false });

  return (
    <FriendsLeaderboard
      currentUserId={user.id}
      profiles={profiles || []}
      workouts={allWorkouts || []}
      attendance={allAttendance || []}
      weights={allWeights || []}
    />
  );
}
