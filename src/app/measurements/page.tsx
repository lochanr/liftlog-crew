import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MeasurementTracker } from "@/components/measurement-tracker";

export default async function MeasurementsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: logs } = await supabase
    .from("body_measurement_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  return <MeasurementTracker logs={logs || []} userId={user.id} />;
}
