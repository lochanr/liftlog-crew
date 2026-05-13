"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Plus, Trash2, Trophy, TrendingUp, History } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ExerciseCatalog, Workout, WorkoutSet } from "@/types/database";

type WorkoutWithSets = Workout & { workout_sets: WorkoutSet[] };

export function WorkoutTracker({
  exercises,
  initialWorkouts,
  userId,
}: {
  exercises: ExerciseCatalog[];
  initialWorkouts: WorkoutWithSets[];
  userId: string;
}) {
  const [workouts, setWorkouts] = useState<WorkoutWithSets[]>(initialWorkouts);
  const [selectedExercise, setSelectedExercise] = useState<string>("all");
  const [isLogging, setIsLogging] = useState(false);
  
  const supabase = createClient();

  // Form state
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [sets, setSets] = useState<{ reps: string; weight: string; rpe: string }[]>([
    { reps: "", weight: "", rpe: "" },
  ]);
  const [notes, setNotes] = useState("");

  const muscleGroups = useMemo(() => 
    [...new Set(exercises.map((e) => e.muscle_group))],
    [exercises]
  );

  const filteredWorkouts = useMemo(() => {
    if (selectedExercise === "all") return workouts;
    return workouts.filter((w) => w.exercise_name === selectedExercise);
  }, [workouts, selectedExercise]);

  const exerciseHistory = useMemo(() => {
    if (selectedExercise === "all") return [];
    return workouts
      .filter((w) => w.exercise_name === selectedExercise)
      .map((w) => ({
        date: w.date,
        maxWeight: Math.max(...w.workout_sets.map((s) => s.weight)),
        totalVolume: w.workout_sets.reduce((acc, s) => acc + s.weight * s.reps, 0),
      }))
      .reverse();
  }, [workouts, selectedExercise]);

  const bestLift = useMemo(() => {
    if (selectedExercise === "all") return null;
    const relevant = workouts.filter((w) => w.exercise_name === selectedExercise);
    if (!relevant.length) return null;
    return Math.max(...relevant.flatMap((w) => w.workout_sets.map((s) => s.weight)));
  }, [workouts, selectedExercise]);

  const addSet = () => {
    setSets([...sets, { reps: "", weight: "", rpe: "" }]);
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const updateSet = (index: number, field: string, value: string) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  const handleExerciseSelect = (value: string) => {
    setExerciseName(value);
    const ex = exercises.find((e) => e.name === value);
    if (ex) setMuscleGroup(ex.muscle_group);
  };

  const checkForPR = async (exercise: string, weight: number): Promise<boolean> => {
    const { data } = await supabase
      .from("workouts")
      .select("workout_sets(weight)")
      .eq("user_id", userId)
      .eq("exercise_name", exercise);
    
    if (!data || data.length === 0) return true;
    
    const maxWeight = Math.max(...data.flatMap((w: any) => 
      w.workout_sets.map((s: any) => s.weight)
    ));
    
    return weight > maxWeight;
  };

  const handleSubmit = async () => {
    if (!exerciseName || !date || sets.some((s) => !s.reps || !s.weight)) {
      toast.error("Please fill in all required fields");
      return;
    }

    const maxWeight = Math.max(...sets.map((s) => parseFloat(s.weight)));
    const isPR = await checkForPR(exerciseName, maxWeight);

    const { data: workout, error } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        date,
        exercise_name: exerciseName,
        muscle_group: muscleGroup,
        notes: notes || null,
        is_pr: isPR,
      })
      .select()
      .single();

    if (error || !workout) {
      toast.error("Failed to log workout");
      return;
    }

    const setsData = sets.map((s, i) => ({
      workout_id: workout.id,
      set_number: i + 1,
      reps: parseInt(s.reps),
      weight: parseFloat(s.weight),
      rpe: s.rpe ? parseInt(s.rpe) : null,
    }));

    const { error: setsError } = await supabase
      .from("workout_sets")
      .insert(setsData);

    if (setsError) {
      toast.error("Failed to log sets");
      return;
    }

    toast.success(isPR ? "New PR logged! 🏆" : "Workout logged!");

    // Refresh data
    const { data: newWorkouts } = await supabase
      .from("workouts")
      .select("*, workout_sets(*)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(50);

    setWorkouts(newWorkouts || []);
    setIsLogging(false);
    setSets([{ reps: "", weight: "", rpe: "" }]);
    setNotes("");
  };

  const handleDelete = async (workoutId: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setWorkouts(workouts.filter((w) => w.id !== workoutId));
    toast.success("Workout deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Workout Tracker</h2>
        <Dialog open={isLogging} onOpenChange={setIsLogging}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Log Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Workout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
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
                <Label>Exercise</Label>
                <Select onValueChange={handleExerciseSelect}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {exercises.map((ex) => (
                      <SelectItem key={ex.id} value={ex.name}>
                        {ex.name} ({ex.muscle_group})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {muscleGroup && (
                <Badge variant="outline" className="border-zinc-600">
                  {muscleGroup}
                </Badge>
              )}

              <div className="space-y-3">
                <Label>Sets</Label>
                {sets.map((set, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <span className="text-xs text-zinc-500">Set {i + 1}</span>
                      <div className="flex gap-2 mt-1">
                        <Input
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => updateSet(i, "reps", e.target.value)}
                          className="bg-zinc-800 border-zinc-700"
                          type="number"
                        />
                        <Input
                          placeholder="Weight (kg)"
                          value={set.weight}
                          onChange={(e) => updateSet(i, "weight", e.target.value)}
                          className="bg-zinc-800 border-zinc-700"
                          type="number"
                          step="0.5"
                        />
                        <Input
                          placeholder="RPE"
                          value={set.rpe}
                          onChange={(e) => updateSet(i, "rpe", e.target.value)}
                          className="bg-zinc-800 border-zinc-700 w-20"
                          type="number"
                          min="1"
                          max="10"
                        />
                      </div>
                    </div>
                    {sets.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSet(i)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSet}
                  className="w-full border-zinc-700"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Set
                </Button>
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did it feel?"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <Button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Save Workout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exercise Filter */}
      <Select onValueChange={setSelectedExercise} defaultValue="all">
        <SelectTrigger className="bg-zinc-800 border-zinc-700">
          <SelectValue placeholder="Filter by exercise" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          <SelectItem value="all">All Exercises</SelectItem>
          {exercises.map((ex) => (
            <SelectItem key={ex.id} value={ex.name}>
              {ex.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Stats Cards */}
      {selectedExercise !== "all" && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-xs">Best Lift</span>
              </div>
              <p className="text-xl font-bold">{bestLift ? `${bestLift}kg` : "--"}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <History className="h-4 w-4" />
                <span className="text-xs">Sessions</span>
              </div>
              <p className="text-xl font-bold">
                {workouts.filter((w) => w.exercise_name === selectedExercise).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Chart */}
      {selectedExercise !== "all" && exerciseHistory.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={exerciseHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717a" 
                    fontSize={12}
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                  />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout History */}
      <div className="space-y-3">
        <h3 className="font-semibold text-zinc-300">History</h3>
        {filteredWorkouts.length === 0 ? (
          <Card className="bg-zinc-900/30 border-zinc-800 border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-zinc-500">No workouts logged yet</p>
              <p className="text-zinc-600 text-sm mt-1">Hit the + button to get started</p>
            </CardContent>
          </Card>
        ) : (
          filteredWorkouts.map((workout) => (
            <Card key={workout.id} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{workout.exercise_name}</span>
                      {workout.is_pr && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          <Trophy className="h-3 w-3 mr-1" /> PR
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">
                      {format(new Date(workout.date), "MMM d, yyyy")} • {workout.muscle_group}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {workout.workout_sets.map((set) => (
                        <Badge key={set.id} variant="secondary" className="bg-zinc-800">
                          {set.reps} × {set.weight}kg
                          {set.rpe && ` @ RPE${set.rpe}`}
                        </Badge>
                      ))}
                    </div>
                    {workout.notes && (
                      <p className="text-sm text-zinc-400 mt-2 italic">{workout.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(workout.id)}
                    className="text-zinc-600 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
