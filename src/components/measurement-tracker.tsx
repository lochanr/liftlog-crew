"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { BodyMeasurementLog } from "@/types/database";
import { Badge } from "@/components/ui/badge";

const FIELDS = [
  { key: "biceps", label: "Biceps" },
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "shoulders", label: "Shoulders" },
  { key: "thighs", label: "Thighs" },
  { key: "forearms", label: "Forearms" },
  { key: "neck", label: "Neck" },
] as const;

export function MeasurementTracker({ logs, userId }: { logs: BodyMeasurementLog[]; userId: string }) {
  const [measurements, setMeasurements] = useState(logs);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [form, setForm] = useState({} as Record<string, string>);
  const supabase = createClient();

  const latest = measurements[measurements.length - 1];
  const first = measurements[0];

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const payload: any = { user_id: userId, date };
    FIELDS.forEach((f) => {
      if (form[f.key]) payload[f.key] = parseFloat(form[f.key]);
    });

    if (Object.keys(payload).length <= 2) {
      toast.error("Fill at least one measurement");
      return;
    }

    const { data, error } = await supabase
      .from("body_measurement_logs")
      .upsert(payload, { onConflict: "user_id,date" })
      .select()
      .single();

    if (error) {
      toast.error("Failed to save");
      return;
    }

    setMeasurements([...measurements.filter((m) => m.date !== date), data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
    setForm({});
    toast.success("Measurements logged!");
  };

  const getChange = (key: keyof BodyMeasurementLog) => {
    if (!latest || !first) return null;
    const curr = latest[key] as number | null;
    const orig = first[key] as number | null;
    if (curr == null || orig == null) return null;
    return curr - orig;
  };

  const chartData = measurements.map((m) => ({
    date: m.date,
    biceps: m.biceps,
    chest: m.chest,
    waist: m.waist,
    shoulders: m.shoulders,
    thighs: m.thighs,
    forearms: m.forearms,
    neck: m.neck,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Body Measurements</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => {
          const change = getChange(f.key as keyof BodyMeasurementLog);
          const current = latest?.[f.key as keyof BodyMeasurementLog] as number | null;
          return (
            <Card key={f.key} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-3">
                <p className="text-xs text-zinc-500 mb-1">{f.label}</p>
                <p className="text-lg font-bold">{current ? `${current}cm` : "--"}</p>
                {change !== null && (
                  <div className="flex items-center gap-1 mt-1">
                    {change > 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                    ) : change < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    ) : (
                      <Minus className="h-3 w-3 text-zinc-400" />
                    )}
                    <span className={`text-xs ${change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-zinc-400"}`}>
                      {change > 0 ? "+" : ""}{change.toFixed(1)}cm
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      {measurements.length > 1 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickFormatter={(v) => format(new Date(v), "MMM d")} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  {FIELDS.map((f, i) => (
                    <Line
                      key={f.key}
                      type="monotone"
                      dataKey={f.key}
                      stroke={["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"][i]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Form */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm">Log Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-zinc-800 border-zinc-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <Label className="text-xs">{f.label} (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form[f.key] || ""}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  placeholder="--"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            ))}
          </div>
          <Button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Save Measurements
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-zinc-400">History</h3>
        {[...measurements].reverse().map((m) => (
          <div key={m.id} className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-800">
            <p className="text-xs text-zinc-500 mb-2">{format(new Date(m.date), "MMM d, yyyy")}</p>
            <div className="flex flex-wrap gap-2">
              {FIELDS.map((f) => {
                const val = m[f.key as keyof BodyMeasurementLog] as number | null;
                return val ? (
                  <Badge key={f.key} variant="secondary" className="bg-zinc-800 text-xs">
                    {f.label}: {val}cm
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
