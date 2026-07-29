export type FontSizeLevel = "normal" | "large" | "xlarge";

export interface SeniorProfile {
  height: string; // cm
  weight: string; // kg
  age: string; // 세
  diseases: string[]; // 현재 질환 (e.g. ["고혈압", "당뇨", "관절염"])
  currentMeds: string; // 복용 중인 약 (e.g. "혈압약(아침 1알), 진통제")
  surgeryHistory: string; // 수술 내역 및 과거력 (e.g. "2021년 오른쪽 인공관절 수술, 2020년 백내장 수술")
  allergies?: string; // 알레르기 정보 (e.g. "복숭아, 갑각류, 견과류")
  guardianName?: string; // 보호자 이름/관계 (e.g. "보호자 (자녀)")
  guardianPhone?: string; // 보호자 전화번호 (e.g. "010-1234-5678")
}

export type SeniorHealthCondition =
  | "고혈압"
  | "당뇨"
  | "고지혈증"
  | "관절염"
  | "소화약화"
  | "골다공증"
  | "백내장/시력저하";

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string; // e.g. "1알"
  frequencyPerDay: number; // e.g. 3
  timesOfDay: string[]; // e.g. ["08:30", "12:30", "18:30"]
  days: number;
  note: string; // e.g. "식후 30분 복용"
  cautions: string[]; // e.g. ["운전 금지", "졸음 유발"]
  takenToday: Record<string, boolean>; // e.g. { "08:30": true, "12:30": false }
  createdAt: string;
}

export interface OCRResult {
  originalText: string;
  seniorSummary: string;
  keyInstructions: string[];
  warnings: string[];
  detectedMedications: {
    name: string;
    dosage: string;
    frequencyPerDay: number;
    timesOfDay: string[];
    days: number;
    note: string;
  }[];
}

export interface MealItem {
  title: string;
  menuItems: string[];
  calories: string;
  healthBenefit: string;
}

export interface DietPlan {
  overallAdvice: string;
  meals: {
    breakfast: MealItem;
    lunch: MealItem;
    dinner: MealItem;
    snack: MealItem;
  };
  keyTips: string[];
}

export interface DayDietPlan {
  dayOfWeek: string; // e.g. "월요일", "화요일", ...
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
  snack: MealItem;
}

export interface WeeklyDietPlan {
  weeklyAdvice: string;
  days: DayDietPlan[];
}

export interface MealPhotoAnalysis {
  mealName: string;
  ratingBadge: string;
  seniorFeedback: string;
  goodPoints: string[];
  cautionPoints: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: "병원" | "약복용" | "가족" | "경조사" | "모임" | "기타";
  location?: string;
  seniorVoiceSummary: string;
  reminderTips?: string;
  completed?: boolean;
}
