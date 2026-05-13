import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkoutTracker } from "@/components/workout-tracker";

export default async function WorkoutsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
    
  if (!profile) redirect("/not-invited");

  const { data: exercises } = await supabase
    .from("exercise_catalog")
    .select("*")
    .order("name");

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*, workout_sets(*)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(50);

  return (
    <WorkoutTracker 
      exercises={exercises || []} 
      initialWorkouts={workouts || []}
      userId={user.id}
    />
  );
}
