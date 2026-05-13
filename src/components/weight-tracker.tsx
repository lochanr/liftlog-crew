// src/components/weight-tracker.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { BodyWeightLog } from "@/types/database";

export function WeightTracker({
  logs,
  profile,
  userId,
}: {
  logs: BodyWeightLog[];
  profile: { starting_weight: number | null; target_weight: number | null } | null;
  userId: string;
}) {
  const [weightLogs, setWeightLogs] = useState(logs);
  const [newWeight, setNewWeight] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const supabase = createClient();

  const currentWeight = weightLogs[weightLogs.length - 1]?.weight;
  const startingWeight = profile?.starting_weight;
  const targetWeight = profile?.target_weight;

  const totalChange = currentWeight && startingWeight 
    ? currentWeight - startingWeight 
    : null;

  const toTarget = currentWeight && targetWeight
    ? currentWeight - targetWeight
    : null;

  const chartData = weightLogs.map((log) => ({
    date: log.date,
    weight: log.weight,
  }));

  const handleAdd = async () => {
    if (!newWeight) return;
    
    const weight = parseFloat(newWeight);
    const { data, error } = await supabase
      .from("body_weight_logs")
      .upsert({
        user_id: userId,
        date,
        weight,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to log weight");
      return;
    }

    setWeightLogs([...weightLogs.filter((l) => l.date !== date), data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
    setNewWeight("");
    toast.success("Weight logged!");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Body Weight</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 mb-1">Current</p>
            <p className="text-2xl font-bold">{currentWeight ? `${currentWeight}kg` : "--"}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 mb-1">Total Change</p>
            <div className="flex items-center gap-1">
              {totalChange !== null ? (
                <>
                  {totalChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  ) : totalChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  ) : (
                    <Minus className="h-4 w-4 text-zinc-400" />
                  )}
                  <span className={`text-2xl font-bold ${
                    totalChange > 0 ? "text-emerald-400" : totalChange < 0 ? "text-red-400" : "text-zinc-400"
                  }`}>
                    {totalChange > 0 ? "+" : ""}{totalChange.toFixed(1)}kg
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-zinc-600">--</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {targetWeight && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-zinc-400">Progress to Target</span>
              <span className="text-sm font-medium">{targetWeight}kg</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                style={{ 
                  width: `${Math.min(100, Math.max(0, 
                    startingWeight && currentWeight 
                      ? ((startingWeight - currentWeight) / (startingWeight - targetWeight)) * 100 
                      : 0
                  ))}%` 
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm">Weight Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717a" 
                    fontSize={12}
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                  />
                  <YAxis stroke="#71717a" fontSize={12} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ fill: "#06b6d4", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Form */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm">Log Weight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="75.5"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <Button onClick={handleAdd} className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Log Weight
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-zinc-400">History</h3>
        {weightLogs.length === 0 ? (
          <p className="text-zinc-600 text-center py-8">No entries yet</p>
        ) : (
          <div className="space-y-2">
            {[...weightLogs].reverse().map((log) => (
              <div key={log.id} className="flex justify-between items-center p-3 bg-zinc-900/30 rounded-lg border border-zinc-800">
                <span className="text-sm text-zinc-400">{format(new Date(log.date), "MMM d, yyyy")}</span>
                <span className="font-semibold">{log.weight}kg</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
