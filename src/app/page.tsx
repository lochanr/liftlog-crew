import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has profile (invited users only)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/not-invited");
  }

  // Fetch all friends' profiles
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("*");

  // Fetch current user's latest weight
  const { data: latestWeight } = await supabase
    .from("body_weight_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  // Fetch attendance for streak calculation
  const { data: attendance } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "present")
    .order("date", { ascending: false });

  // Fetch this week's attendance
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: weekAttendance } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", weekStart.toISOString().split("T")[0])
    .lte("date", weekEnd.toISOString().split("T")[0]);

  // Fetch latest workout
  const { data: latestWorkout } = await supabase
    .from("workouts")
    .select("*, workout_sets(*)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  // Fetch PRs
  const { data: prs } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_pr", true)
    .order("date", { ascending: false })
    .limit(5);

  // Calculate streak
  const presentDates = (attendance || []).map((a) => new Date(a.date));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < presentDates.length; i++) {
    const d = new Date(presentDates[i]);
    d.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    
    if (d.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  const weekProgress = weekDays.map((day) => {
    const log = weekAttendance?.find((a) => 
      isSameDay(new Date(a.date), day)
    );
    return {
      day: format(day, "EEE"),
      status: log?.status || null,
      date: day,
    };
  });

  return (
    <DashboardClient
      profile={profile}
      allProfiles={allProfiles || []}
      latestWeight={latestWeight}
      streak={streak}
      weekProgress={weekProgress}
      latestWorkout={latestWorkout}
      prs={prs || []}
      currentUserId={user.id}
    />
  );
}
