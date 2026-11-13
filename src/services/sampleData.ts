import { DailyLog, UserProfile, MealItem } from '../types/diet';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'JC',
  unit: 'kg',
  measurementUnit: 'cm',
  startWeight: 68.5,
  currentWeight: 63.8,
  goalWeight: 59.0,
  startDate: '2026-08-11',
  targetDate: '2026-11-20',
  dailyCalorieTarget: 1550,
  dailyProteinTarget: 110,
  dailyCarbsTarget: 140,
  dailyFatTarget: 48,
  dailyWaterTarget: 2250,
  dietStyle: 'high-protein',
  weeklyLossGoal: 0.5,
  language: 'zh',
  customTitle: 'JC 饮食日记',
  customEmoji: '🌸',
};

const SAMPLE_BREAKFASTS: Array<Omit<MealItem, 'id' | 'type'>> = [
  { name: 'Pink Berry Greek Yogurt Bowl with Chia & Granola', calories: 340, protein: 28, carbs: 36, fat: 8, rating: 5, notes: 'Strawberries, raspberries, 0% greek yogurt' },
  { name: 'Avocado Toast with 2 Poached Eggs', calories: 380, protein: 22, carbs: 28, fat: 19, rating: 5, notes: 'Sourdough slice with chili flakes' },
  { name: 'Strawberry Protein Smoothie Bowl', calories: 310, protein: 32, carbs: 34, fat: 5, rating: 4, notes: 'Vanilla whey, almond milk, frozen berries' },
  { name: 'Oatmeal with Almond Butter & Blueberries', calories: 360, protein: 14, carbs: 48, fat: 12, rating: 4, notes: 'Warm rolled oats with dash of cinnamon' },
  { name: 'Egg White Frittata with Spinach & Feta', calories: 290, protein: 26, carbs: 12, fat: 14, rating: 4, notes: 'Light and very filling' },
];

const SAMPLE_LUNCHES: Array<Omit<MealItem, 'id' | 'type'>> = [
  { name: 'Grilled Chicken & Quinoa Nourish Bowl', calories: 460, protein: 42, carbs: 44, fat: 12, rating: 5, notes: 'Baby greens, cucumber, lemon tahini drizzle' },
  { name: 'Salmon Poke Bowl with Edamame & Brown Rice', calories: 510, protein: 36, carbs: 48, fat: 18, rating: 5, notes: 'Ponzu dressing, nori, pickled ginger' },
  { name: 'Turkey Breast Avocado Wrap in Whole Wheat', calories: 420, protein: 35, carbs: 36, fat: 14, rating: 4, notes: 'Tomato, crisp romaine lettuce' },
  { name: 'Lemon Herb Shrimp Salad with Walnuts', calories: 390, protein: 34, carbs: 18, fat: 16, rating: 4, notes: 'Fresh arugula, shaved parmesan' },
  { name: 'Tofu & Vegetable Stir-Fry with Cauliflower Rice', calories: 370, protein: 26, carbs: 32, fat: 14, rating: 4, notes: 'Snap peas, carrots, sesame ginger glaze' },
];

const SAMPLE_DINNERS: Array<Omit<MealItem, 'id' | 'type'>> = [
  { name: 'Pan-Seared Salmon with Roasted Asparagus', calories: 490, protein: 40, carbs: 14, fat: 28, rating: 5, notes: 'Garlic herb butter finish' },
  { name: 'Tender Lean Beef Strips with Sweet Potato Mash', calories: 520, protein: 44, carbs: 42, fat: 16, rating: 5, notes: 'Steamed green beans' },
  { name: 'Baked Lemon Garlic Chicken with Broccoli', calories: 440, protein: 45, carbs: 16, fat: 18, rating: 4, notes: 'Extra crispy baked florets' },
  { name: 'Mediterranean Baked White Fish with Cherry Tomatoes', calories: 380, protein: 38, carbs: 16, fat: 15, rating: 5, notes: 'Kalamata olives, capers, fresh basil' },
  { name: 'Turkey & Zucchini Noodle Bolognese', calories: 410, protein: 39, carbs: 22, fat: 17, rating: 4, notes: 'Rich tomato basil sauce' },
];

const SAMPLE_SNACKS: Array<Omit<MealItem, 'id' | 'type'>> = [
  { name: 'Pink Lady Apple with 12 Almonds', calories: 150, protein: 4, carbs: 22, fat: 7, rating: 4, notes: 'Crunchy afternoon snack' },
  { name: 'Raspberry Collagen Protein Drink', calories: 120, protein: 20, carbs: 4, fat: 1, rating: 5, notes: 'Chilled iced refreshment' },
  { name: 'Cottage Cheese with Sliced Peaches', calories: 160, protein: 18, carbs: 16, fat: 2, rating: 4, notes: 'Light sprinkle of hemp seeds' },
  { name: 'Dark Chocolate Square (85%) & Herbal Tea', calories: 95, protein: 2, carbs: 7, fat: 7, rating: 5, notes: 'Sweet evening treat' },
  { name: 'Edamame with Sea Salt', calories: 140, protein: 12, carbs: 10, fat: 5, rating: 4, notes: 'High fiber savory bite' },
];

export function generateSampleData(): DailyLog[] {
  const logs: DailyLog[] = [];
  const totalDays = 56; // 8 weeks of progress
  const baseDate = new Date('2026-10-06'); // current date

  // Start at 68.5kg, end around 63.8kg
  const startWeight = 68.5;
  const targetEndWeight = 63.8;
  const weightLossTotal = startWeight - targetEndWeight;

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const progressRatio = (totalDays - 1 - i) / (totalDays - 1);
    
    // Natural weight fluctuation model: downward slope + minor sinusoidal water fluctuation
    const noise = Math.sin(i * 0.9) * 0.28 + (Math.cos(i * 1.5) * 0.15);
    const dayWeight = Math.round((startWeight - (weightLossTotal * progressRatio) + noise) * 10) / 10;

    // Pick meals deterministically based on date index
    const b = SAMPLE_BREAKFASTS[i % SAMPLE_BREAKFASTS.length];
    const l = SAMPLE_LUNCHES[(i + 1) % SAMPLE_LUNCHES.length];
    const dn = SAMPLE_DINNERS[(i + 2) % SAMPLE_DINNERS.length];
    const s = SAMPLE_SNACKS[(i + 3) % SAMPLE_SNACKS.length];

    const meals: MealItem[] = [
      { id: `${dateStr}-b`, type: 'breakfast', time: '08:15', ...b },
      { id: `${dateStr}-l`, type: 'lunch', time: '12:45', ...l },
      { id: `${dateStr}-d`, type: 'dinner', time: '19:10', ...dn },
    ];

    // Some days include snacks
    if (i % 3 !== 0) {
      meals.push({ id: `${dateStr}-s`, type: 'snack', time: '16:00', ...s });
    }

    const waterIntake = 1800 + ((i * 150) % 800);
    const caloriesBurned = 200 + ((i * 45) % 300);

    // Body measurements logged every 7 days
    let measurements = undefined;
    if (i % 7 === 0) {
      const waistReduction = progressRatio * 4.5;
      const hipsReduction = progressRatio * 3.8;
      measurements = {
        waist: Math.round((76 - waistReduction) * 10) / 10,
        hips: Math.round((101 - hipsReduction) * 10) / 10,
        chest: Math.round((92 - progressRatio * 2.0) * 10) / 10,
        thigh: Math.round((58 - progressRatio * 2.5) * 10) / 10,
      };
    }

    const notesList = [
      'Felt great today! Cravings were very manageable.',
      'Slightly lower energy in afternoon, drank extra water.',
      'Super energized morning workout. Meal prep made lunch easy.',
      'Delicious dinner, hit my protein goal with room to spare!',
      'Weekend social dinner, stayed mindful of portions and water.',
      'Weight dropped a bit more, seeing real definition in waistline.',
      'Consistent day. Loving the high protein focus.',
      'Hydration on point, feeling light and refreshed.'
    ];

    logs.push({
      date: dateStr,
      weight: dayWeight,
      waterIntake,
      waterTarget: 2250,
      caloriesBurned,
      meals,
      measurements,
      notes: notesList[i % notesList.length],
      hungerRating: 3 + (i % 3 === 0 ? 1 : 0),
      energyRating: 4 + (i % 4 === 0 ? -1 : 0),
      dietAdherence: 4 + (i % 5 === 0 ? 1 : 0),
    });
  }

  return logs;
}
