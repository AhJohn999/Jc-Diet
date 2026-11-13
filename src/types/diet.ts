export type WeightUnit = 'kg' | 'lbs';
export type LengthUnit = 'cm' | 'in';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealItem {
  id: string;
  type: MealType;
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
  fiber?: number;  // in grams
  time?: string;
  notes?: string;
  rating?: number; // 1-5 satisfaction
  photoUrl?: string; // base64 or image data URL
}

export interface BodyMeasurements {
  waist?: number;
  hips?: number;
  chest?: number;
  thigh?: number;
  arm?: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  weight?: number; // morning weight (drives charts)
  weightEvening?: number; // optional evening weight
  waterIntake?: number; // in ml
  waterTarget?: number; // in ml
  caloriesBurned?: number; // active calories burned
  meals: MealItem[];
  measurements?: BodyMeasurements;
  notes?: string;
  hungerRating?: number; // 1-5 (1=starving, 5=very full)
  energyRating?: number; // 1-5 (1=exhausted, 5=vibrant)
  dietAdherence?: number; // 1-5 (1=fell off, 5=perfect adherence)
  photoUrl?: string;
}

export interface UserProfile {
  name: string;
  unit: WeightUnit;
  measurementUnit: LengthUnit;
  startWeight: number;
  goalWeight: number;
  currentWeight: number;
  startDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  dailyCalorieTarget: number;
  dailyProteinTarget: number; // grams
  dailyCarbsTarget: number;   // grams
  dailyFatTarget: number;     // grams
  dailyWaterTarget: number;   // ml (default 2200ml)
  dietStyle: 'balanced' | 'low-carb' | 'keto' | 'high-protein' | 'deficit-focused';
  weeklyLossGoal: number; // e.g. 0.5 kg or 1 lb per week
  language?: 'zh' | 'en'; // default 'zh'
  customTitle?: string; // custom journal/app title
  customEmoji?: string; // custom icon/emoji (e.g. ✨, 🌸, 🍓, 🎀, 🥗, 🥑)
}

export interface WeekSummary {
  weekNumber: number;
  label: string;
  startDate: string;
  endDate: string;
  avgWeight?: number;
  startWeight?: number;
  endWeight?: number;
  weightDelta?: number;
  avgCalories: number;
  calorieTarget: number;
  avgDeficit: number;
  daysLogged: number;
  avgAdherence: number;
}

export interface MonthSummary {
  monthKey: string; // YYYY-MM
  label: string;
  avgWeight?: number;
  startWeight?: number;
  endWeight?: number;
  netWeightChange?: number;
  avgCalories: number;
  daysLogged: number;
  totalDays: number;
  logs: DailyLog[];
}
