// src/components/attendance-tracker.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { format, isSameDay, isToday } from "date-fns";
import { Check, X, Moon, Flame, Trophy, Calendar } from "lucide-react";
import type { AttendanceLog } from "@/types/database";

export function AttendanceTracker({
  days,
  attendance,
  currentStreak,
  longestStreak,
  percentage,
  userId,
}: {
  days: Date[];
  attendance: AttendanceLog[];
  currentStreak: number;
  longestStreak: number;
  percentage: number;
  userId: string;
}) {
  const [logs, setLogs] = useState(attendance);
  const supabase = createClient();

  const getStatus = (day: Date) => {
    const log = logs.find((l) => isSameDay(new Date(l.date), day));
    return log?.status || null;
  };

  const markAttendance = async (day: Date, status: "present" | "absent" | "rest") => {
    const dateStr = format(day, "yyyy-MM-dd");
    
    const { data, error } = await supabase
      .from("attendance_logs")
      .upsert(
        { user_id: userId, date: dateStr, status },
        { onConflict: "user_id,date" }
      )
      .select()
      .single();

    if (error) {
      toast.error("Failed to update");
      return;
    }

    setLogs([...logs.filter((l) => l.date !== dateStr), data]);
    toast.success(`${status} marked for ${format(day, "MMM d")}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Attendance</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-3 text-center">
            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{currentStreak}</p>
            <p className="text-[10px] text-zinc-500">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-3 text-center">
            <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{longestStreak}</p>
            <p className="text-[10px] text-zinc-500">Best Streak</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-3 text-center">
            <Calendar className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{percentage}%</p>
            <p className="text-[10px] text-zinc-500">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm">{format(new Date(), "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => (
              <span key={d} className="text-xs text-zinc-600 font-medium">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const status = getStatus(day);
              const isTodayDate = isToday(day);
              
              return (
                <div key={day.toISOString()} className="aspect-square">
                  <button
                    onClick={() => {
                      const next = status === "present" ? "rest" : status === "rest" ? "absent" : "present";
                      markAttendance(day, next);
                    }}
                    className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-xs transition-all border
                      ${status === "present"
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : status === "rest"
                        ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                        : status === "absent"
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-zinc-800/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800"
                      }
                      ${isTodayDate ? "ring-2 ring-zinc-400" : ""}
                    `}
                  >
                    <span className="font-medium">{format(day, "d")}</span>
                    {status === "present" && <Check className="h-3 w-3" />}
                    {status === "rest" && <Moon className="h-3 w-3" />}
                    {status === "absent" && <X className="h-3 w-3" />}
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Button 
          onClick={() => markAttendance(new Date(), "present")}
          className="bg-emerald-600 hover:bg-emerald-700 h-12"
        >
          <Check className="h-4 w-4 mr-1" /> Present
        </Button>
        <Button 
          onClick={() => markAttendance(new Date(), "rest")}
          variant="outline"
          className="border-blue-600 text-blue-400 hover:bg-blue-950 h-12"
        >
          <Moon className="h-4 w-4 mr-1" /> Rest
        </Button>
        <Button 
          onClick={() => markAttendance(new Date(), "absent")}
          variant="outline"
          className="border-red-600 text-red-400 hover:bg-red-950 h-12"
        >
          <X className="h-4 w-4 mr-1" /> Absent
        </Button>
      </div>
    </div>
  );
}
