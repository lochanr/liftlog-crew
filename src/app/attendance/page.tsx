// src/app/attendance/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AttendanceTracker } from "@/components/attendance-tracker";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

export default async function AttendancePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: attendance } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", format(monthStart, "yyyy-MM-dd"))
    .lte("date", format(monthEnd, "yyyy-MM-dd"));

  const { data: allAttendance } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "present")
    .order("date", { ascending: false });

  // Calculate streaks
  const presentDates = (allAttendance || []).map((a) => new Date(a.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Current streak from today backwards
  const sorted = [...presentDates].sort((a, b) => b.getTime() - a.getTime());
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i]);
    d.setHours(0,0,0,0);
    const expected = new Date(todayDate);
    expected.setDate(expected.getDate() - i);
    if (d.getTime() === expected.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Longest streak
  const allDates = [...presentDates].sort((a, b) => a.getTime() - b.getTime());
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(allDates[i-1]);
      const curr = new Date(allDates[i]);
      prev.setDate(prev.getDate() + 1);
      if (prev.getTime() === curr.getTime()) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  const presentCount = attendance?.filter((a) => a.status === "present").length || 0;
  const totalDays = days.length;
  const percentage = Math.round((presentCount / totalDays) * 100);

  return (
    <AttendanceTracker
      days={days}
      attendance={attendance || []}
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      percentage={percentage}
      userId={user.id}
    />
  );
}
