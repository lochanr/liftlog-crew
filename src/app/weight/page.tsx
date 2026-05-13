// src/app/weight/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WeightTracker } from "@/components/weight-tracker";

export default async function WeightPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  const { data: logs } = await supabase
    .from("body_weight_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("starting_weight, target_weight")
    .eq("user_id", user.id)
    .single();

  return <WeightTracker logs={logs || []} profile={profile} userId={user.id} />;
}
