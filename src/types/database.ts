export type Profile = {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  fitness_goal: "bulk" | "cut" | "maintain" | null;
  starting_weight: number | null;
  target_weight: number | null;
  height: number | null;
  start_date: string;
  created_at: string;
};

export type Workout = {
  id: string;
  user_id: string;
  date: string;
  exercise_name: string;
  muscle_group: string;
  notes: string | null;
  is_pr: boolean;
  created_at: string;
};

export type WorkoutSet = {
  id: string;
  workout_id: string;
  set_number: number;
  reps: number;
  weight: number;
  rpe: number | null;
};

export type BodyWeightLog = {
  id: string;
  user_id: string;
  date: string;
  weight: number;
};

export type BodyMeasurementLog = {
  id: string;
  user_id: string;
  date: string;
  biceps: number | null;
  chest: number | null;
  waist: number | null;
  shoulders: number | null;
  thighs: number | null;
  forearms: number | null;
  neck: number | null;
};

export type AttendanceLog = {
  id: string;
  user_id: string;
  date: string;
  status: "present" | "absent" | "rest";
};

export type ExerciseCatalog = {
  id: string;
  name: string;
  muscle_group: string;
  category: string | null;
};
