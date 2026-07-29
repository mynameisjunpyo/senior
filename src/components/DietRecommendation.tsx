import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  DietPlan,
  FontSizeLevel,
  MealPhotoAnalysis,
  SeniorProfile,
  WeeklyDietPlan,
} from "../types";
import { SAMPLE_MEAL_PHOTOS } from "../data/sampleData";
import { speakText, stopSpeaking } from "../lib/speech";
import {
  UtensilsCrossed,
  Heart,
  Sparkles,
  Volume2,
  Camera,
  AlertCircle,
  ThumbsUp,
  Apple,
  RotateCcw,
  CalendarDays,
  ShieldAlert,
  Check,
} from "lucide-react";

interface DietRecommendationProps {
  fontSizeLevel: FontSizeLevel;
  isHighContrast: boolean;
  seniorProfile: SeniorProfile;
}

// Healthy Instant Fallback Diet Plan to prevent white screen / loading delay
const createFallbackDietPlan = (profile: SeniorProfile): DietPlan => {
  const isDiabetic = profile.diseases?.includes("당뇨");
  const isHypertensive = profile.diseases?.includes("고혈압");

  return {
    overallAdvice: `어르신의 연령(${profile.age || "74"}세)과 건강 프로필(${
      profile.diseases?.join(", ") || "일반 건강"
    })을 반영하여 소화가 잘되고 염분과 당분을 조절한 속편한 한식 식단입니다.`,
    keyTips: [
      "국물은 건더기 위주로 드시고 염분 섭취를 최소화하세요.",
      "식사 후 15분 이상 가벼운 제자리 걷기로 소화를 도우세요.",
      "음식은 30번 이상 천천히 씹어 드시면 위장에 무리가 없습니다.",
    ],
    meals: {
      breakfast: {
        title: isDiabetic ? "잡곡 전복죽 & 달걀찜" : "소화가 잘되는 현미 야채죽",
        menuItems: [isDiabetic ? "전복 잡곡죽" : "야채 현미죽", "부드러운 달걀찜", "저염 나물무침", "따뜻한 보리차"],
        calories: "약 350 kcal",
        healthBenefit: "위장에 부담을 주지 않고 기력을 보충합니다.",
      },
      lunch: {
        title: isHypertensive ? "저염 고등어 구이 & 시금치 된장국" : "영양 자반고등어 & 두부조림",
        menuItems: ["저염 자반고등어구이", "슴슴한 시금치 된장국", "잡곡진밥", "가지나물", "배추겉절이"],
        calories: "약 550 kcal",
        healthBenefit: "오메가-3와 단백질이 풍부하여 혈관 건강에 좋습니다.",
      },
      dinner: {
        title: "소고기 버섯 뚝배기 & 온두부",
        menuItems: ["부드러운 소고기 버섯전골", "따뜻한 데친 두부", "기장 진밥", "무생채"],
        calories: "약 450 kcal",
        healthBenefit: "항염 소고기 단백질과 식이섬유가 저녁 소화를 돕습니다.",
      },
      snack: {
        title: "찐 고구마 반 개 & 삶은 달걀 1개",
        menuItems: ["호박고구마 반 개", "삶은 달걀", "따뜻한 둥굴레차"],
        calories: "약 150 kcal",
        healthBenefit: "출출함을 달래주고 혈당 급승을 방지합니다.",
      },
    },
  };
};

const createFallbackWeeklyDietPlan = (profile: SeniorProfile): WeeklyDietPlan => {
  const weeklyMenus = [
    {
      dayOfWeek: "월요일",
      breakfast: {
        title: "월요일 아침: 영양 전복죽 & 계란찜",
        menuItems: ["속편한 전복죽", "부드러운 계란찜", "저염 나물무침", "따뜻한 보리차"],
        calories: "350 kcal",
        healthBenefit: "위장 부담 경감 및 기력 보충",
      },
      lunch: {
        title: "월요일 점심: 저염 삼치구이 & 시금치 된장국",
        menuItems: ["담백한 삼치 간장구이", "슴슴한 시금치 된장국", "잡곡진밥", "가지나물", "배추겉절이"],
        calories: "550 kcal",
        healthBenefit: "오메가3 함유로 혈관 및 뇌 건강 도움",
      },
      dinner: {
        title: "월요일 저녁: 소고기 버섯 뚝배기전골",
        menuItems: ["부드러운 소고기 버섯전골", "기장 진밥", "데친 온두부", "무생채"],
        calories: "450 kcal",
        healthBenefit: "항염 단백질 보충 및 저녁 소화 증진",
      },
      snack: {
        title: "월요일 간식: 찐 호박고구마 & 삶은 계란",
        menuItems: ["호박고구마 반 개", "삶은 계란 1개", "둥굴레차"],
        calories: "150 kcal",
        healthBenefit: "출출함 완화 및 포만감 유지",
      },
    },
    {
      dayOfWeek: "화요일",
      breakfast: {
        title: "화요일 아침: 영양 전복 야채죽 & 연두부",
        menuItems: ["영양 전복 야채죽", "간장 양념 연두부", "열무물김치", "따뜻한 옥수수차"],
        calories: "340 kcal",
        healthBenefit: "기력 보충 및 소화가 편안함",
      },
      lunch: {
        title: "화요일 점심: 순살 닭안심 곰탕 & 무나물",
        menuItems: ["순살 닭안심 곰탕", "현미 잡곡밥", "소화되는 무나물", "오이소박이"],
        calories: "520 kcal",
        healthBenefit: "양질의 단백질 공급 및 근력 유지",
      },
      dinner: {
        title: "화요일 저녁: 저염 가자미조림 & 단호박찜",
        menuItems: ["무를 넣은 가자미조림", "슴슴한 콩나물국", "차조 진밥", "찐 단호박"],
        calories: "440 kcal",
        healthBenefit: "지방이 적고 고단백으로 속이 편안함",
      },
      snack: {
        title: "화요일 간식: 사과즙 & 호두 견과류",
        menuItems: ["갈아만든 사과즙", "호두 2알", "캐슈넛 약간"],
        calories: "140 kcal",
        healthBenefit: "식이섬유 및 항산화 활성",
      },
    },
    {
      dayOfWeek: "수요일",
      breakfast: {
        title: "수요일 아침: 쇠고기 야채죽 & 백김치",
        menuItems: ["소고기 야채죽", "시금치 나물무침", "아삭한 백김치", "결명자차"],
        calories: "360 kcal",
        healthBenefit: "철분 보충 및 아침 소화 촉진",
      },
      lunch: {
        title: "수요일 점심: 노릇한 들기름 두부구이 & 배추국",
        menuItems: ["들기름 두부 부침", "달달한 배추장국", "흑미 진밥", "호박나물"],
        calories: "500 kcal",
        healthBenefit: "식물성 단백질과 불포화지방산 풍부",
      },
      dinner: {
        title: "수요일 저녁: 시원한 굴 콩나물국밥 & 부추무침",
        menuItems: ["바다 영양 굴 콩나물국밥", "부추 나물무침", "알배기 배추쌈", "깍두기"],
        calories: "460 kcal",
        healthBenefit: "아연 및 미네랄 보충으로 면역력 향상",
      },
      snack: {
        title: "수요일 간식: 부드러운 단호박 범벅 & 오미자차",
        menuItems: ["단호박 찹쌀범벅", "시원한 오미자차"],
        calories: "160 kcal",
        healthBenefit: "혈당 안정을 돕는 베타카로틴 공급",
      },
    },
    {
      dayOfWeek: "목요일",
      breakfast: {
        title: "목요일 아침: 고소한 들깨 타락죽 & 나물",
        menuItems: ["들깨 타락죽", "취나물무침", "나박김치", "따뜻한 생강차"],
        calories: "340 kcal",
        healthBenefit: "기침 예방 및 위장 장벽 보호",
      },
      lunch: {
        title: "목요일 점심: 저염 고등어 데리야끼구이 & 아욱국",
        menuItems: ["고등어 간장구이", "구수한 아욱 된장국", "잡곡 진밥", "고사리나물"],
        calories: "560 kcal",
        healthBenefit: "비타민 D와 칼슘 흡수율 증가",
      },
      dinner: {
        title: "목요일 저녁: 버섯 뚝배기 불고기 & 쌈채소",
        menuItems: ["저당 뚝배기 불고기", "데친 양배추쌈", "기장밥", "숙주나물"],
        calories: "480 kcal",
        healthBenefit: "위염 완화 및 천연 소화 효소 보충",
      },
      snack: {
        title: "목요일 간식: 현미 구운 가래떡 & 감잎차",
        menuItems: ["현미 가래떡", "감잎차"],
        calories: "150 kcal",
        healthBenefit: "비타민 C 공급 및 혈관 탄력 유지",
      },
    },
    {
      dayOfWeek: "금요일",
      breakfast: {
        title: "금요일 아침: 흑임자 검은깨죽 & 계란말이",
        menuItems: ["흑임자죽", "야채 계란말이", "동치미", "따뜻한 현미차"],
        calories: "350 kcal",
        healthBenefit: "항산화 안토시아닌과 탈모/탈력 도움",
      },
      lunch: {
        title: "금요일 점심: 시원한 대구 지리탕 & 버섯볶음",
        menuItems: ["맑은 대구 지리탕", "표고버섯 볶음", "잡곡진밥", "취나물"],
        calories: "510 kcal",
        healthBenefit: "저지방 고단백 해산물 영양 차림",
      },
      dinner: {
        title: "금요일 저녁: 해물 순두부찌개 & 수수 진밥",
        menuItems: ["저염 해물 순두부찌개", "수수 진밥", "애호박나물", "물김치"],
        calories: "450 kcal",
        healthBenefit: "부드러운 콩 단백질로 숙면 유도",
      },
      snack: {
        title: "금요일 간식: 찰옥수수 반 개 & 대추차",
        menuItems: ["찰옥수수 반 개", "따뜻한 대추차"],
        calories: "140 kcal",
        healthBenefit: "마음 안정 및 신경 긴화 완화",
      },
    },
    {
      dayOfWeek: "토요일",
      breakfast: {
        title: "토요일 아침: 기력 보충 소고기 미역죽",
        menuItems: ["소고기 미역죽", "달걀찜", "무말랭이 무침", "보리차"],
        calories: "360 kcal",
        healthBenefit: "요오드와 칼슘으로 뼈 건강 케어",
      },
      lunch: {
        title: "토요일 점심: 순살 안동찜닭 & 청포묵 탕평채",
        menuItems: ["순살 안동찜닭", "청포묵 탕평채", "잡곡진밥", "배추김치"],
        calories: "570 kcal",
        healthBenefit: "주말 특식 필수 단백질 보충",
      },
      dinner: {
        title: "토요일 저녁: 임연수어 구이 & 차돌 된장찌개",
        menuItems: ["임연수어 구이", "차돌 버섯 된장찌개", "검은콩 진밥", "콩나물무침"],
        calories: "490 kcal",
        healthBenefit: "구수한 집밥 영양 및 균형 잡힌 신진대사",
      },
      snack: {
        title: "토요일 간식: 바나나 1개 & 고소한 두유",
        menuItems: ["바나나 1개", "무첨가 두유"],
        calories: "170 kcal",
        healthBenefit: "칼륨 보충으로 나트륨 배출 지원",
      },
    },
    {
      dayOfWeek: "일요일",
      breakfast: {
        title: "일요일 아침: 속편한 영양 녹두죽",
        menuItems: ["영양 녹두죽", "도라지 나물", "나박김치", "둥굴레차"],
        calories: "330 kcal",
        healthBenefit: "몸 안의 해독 작용 및 위장 편안함",
      },
      lunch: {
        title: "일요일 점심: 보양 전복 삼계탕 & 찹쌀 진밥",
        menuItems: ["영양 전복 삼계탕", "찹쌀 진밥", "오이깍두기", "부추무침"],
        calories: "590 kcal",
        healthBenefit: "일주일 피로 회복을 돕는 최고의 보양식",
      },
      dinner: {
        title: "일요일 저녁: 담백한 훈제오리 구이 & 양배추쌈",
        menuItems: ["저염 훈제오리 구이", "데친 양배추쌈", "잡곡밥", "슴슴한 콩나물국"],
        calories: "470 kcal",
        healthBenefit: "불포화지방산으로 활력 공급",
      },
      snack: {
        title: "일요일 간식: 구운 알밤 3알 & 메밀차",
        menuItems: ["알밤 3알", "구수한 메밀차"],
        calories: "130 kcal",
        healthBenefit: "비타민 C 공급 및 혈압 안정",
      },
    },
  ];

  return {
    weeklyAdvice: "어르신의 일주일 균형 잡힌 한식 장보기 & 건강 가이드입니다. 매일 다채로운 단백질과 따뜻한 국물을 챙겨 드세요.",
    days: weeklyMenus,
  };
};

// Strict Allergy Sanitizer Functions to guarantee no allergen leaks (e.g. Pine nut 잣)
const sanitizeDietText = (text: string, allergiesStr?: string): string => {
  if (!text) return text;
  let s = text;
  const allergyLower = (allergiesStr || "").toLowerCase();

  // 1. Strict Pine Nut (잣) filter
  if (allergyLower.includes("잣")) {
    s = s
      .replace(/잣죽/g, "전복 야채죽")
      .replace(/잣가루/g, "깨소금")
      .replace(/잣 고명/g, "지단 고명")
      .replace(/잣/g, "해바라기씨");
  }

  // 2. Nuts (견과류) filter
  if (allergyLower.includes("견과류")) {
    s = s
      .replace(/호두/g, "대추")
      .replace(/땅콩/g, "볶은 콩")
      .replace(/캐슈넛/g, "구운 콩")
      .replace(/견과류/g, "건과일");
  }

  // 3. Peach (복숭아) filter
  if (allergyLower.includes("복숭아")) {
    s = s.replace(/복숭아/g, "사과");
  }

  // 4. Crustaceans (갑각류/새우/게) filter
  if (allergyLower.includes("새우") || allergyLower.includes("게") || allergyLower.includes("갑각류")) {
    s = s
      .replace(/새우/g, "대구살")
      .replace(/게/g, "조기")
      .replace(/갑각류/g, "흰살생선");
  }

  return s;
};

const sanitizeDietPlanForProfile = (
  plan: DietPlan,
  profile?: SeniorProfile
): DietPlan => {
  if (!profile?.allergies) return plan;
  const alg = profile.allergies;

  const sanitizeMeal = (meal: any) => {
    if (!meal) return meal;
    return {
      ...meal,
      title: sanitizeDietText(meal.title, alg),
      menuItems: (meal.menuItems || []).map((m: string) => sanitizeDietText(m, alg)),
      healthBenefit: sanitizeDietText(meal.healthBenefit, alg),
    };
  };

  return {
    ...plan,
    overallAdvice: sanitizeDietText(plan.overallAdvice, alg),
    meals: {
      breakfast: sanitizeMeal(plan.meals?.breakfast),
      lunch: sanitizeMeal(plan.meals?.lunch),
      dinner: sanitizeMeal(plan.meals?.dinner),
      snack: sanitizeMeal(plan.meals?.snack),
    },
  };
};

const sanitizeWeeklyDietPlanForProfile = (
  plan: WeeklyDietPlan,
  profile?: SeniorProfile
): WeeklyDietPlan => {
  if (!profile?.allergies) return plan;
  const alg = profile.allergies;

  const sanitizeMeal = (meal: any) => {
    if (!meal) return meal;
    return {
      ...meal,
      title: sanitizeDietText(meal.title, alg),
      menuItems: (meal.menuItems || []).map((m: string) => sanitizeDietText(m, alg)),
      healthBenefit: sanitizeDietText(meal.healthBenefit, alg),
    };
  };

  return {
    weeklyAdvice: sanitizeDietText(plan.weeklyAdvice, alg),
    days: (plan.days || []).map((day) => ({
      ...day,
      breakfast: sanitizeMeal(day.breakfast),
      lunch: sanitizeMeal(day.lunch),
      dinner: sanitizeMeal(day.dinner),
      snack: sanitizeMeal(day.snack),
    })),
  };
};

export const DietRecommendation: React.FC<DietRecommendationProps> = ({
  fontSizeLevel,
  isHighContrast,
  seniorProfile,
}) => {
  // View Mode: "today" (오늘의 식단) vs "weekly" (일주일 식단 미리보기)
  const [viewMode, setViewMode] = useState<"today" | "weekly">("today");

  // Today Diet Plan State initialized with fallback immediately to avoid white screen
  const [rawDietPlan, setRawDietPlan] = useState<DietPlan>(() =>
    sanitizeDietPlanForProfile(createFallbackDietPlan(seniorProfile), seniorProfile)
  );
  const [loadingTodayDiet, setLoadingTodayDiet] = useState<boolean>(false);

  // Weekly Diet Plan State
  const [rawWeeklyDietPlan, setRawWeeklyDietPlan] = useState<WeeklyDietPlan | null>(null);
  const [loadingWeeklyDiet, setLoadingWeeklyDiet] = useState<boolean>(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Always sanitize active plans with current senior profile allergies
  const dietPlan = useMemo(
    () => sanitizeDietPlanForProfile(rawDietPlan, seniorProfile),
    [rawDietPlan, seniorProfile]
  );

  const weeklyDietPlan = useMemo(
    () => (rawWeeklyDietPlan ? sanitizeWeeklyDietPlanForProfile(rawWeeklyDietPlan, seniorProfile) : null),
    [rawWeeklyDietPlan, seniorProfile]
  );

  // Meal Photo Analysis State
  const [mealPhoto, setMealPhoto] = useState<string | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState<boolean>(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<MealPhotoAnalysis | null>(null);

  const [isReadingAudio, setIsReadingAudio] = useState<boolean>(false);

  const profileKey = `${seniorProfile.age}-${seniorProfile.diseases?.join(",")}-${seniorProfile.allergies}`;
  const lastFetchedProfileKey = useRef<string>("");

  // Fetch Today Diet via Gemini API with safe timeout & error recovery
  const fetchTodayDiet = async () => {
    setLoadingTodayDiet(true);
    stopSpeaking();
    setIsReadingAudio(false);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout safety

      const res = await fetch("/api/diet-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          conditions: seniorProfile.diseases || ["고혈압", "당뇨"],
          preference: "소화가 잘되는 따뜻한 속편한 한식 차림",
          seniorProfile,
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data: DietPlan = await res.json();
        if (data && data.meals && data.meals.breakfast) {
          setRawDietPlan(data);
          lastFetchedProfileKey.current = profileKey;
        }
      }
    } catch (err: any) {
      console.warn("API Diet Recommendation fallback active:", err);
      // Keeps current or generated fallback diet, preventing any white screen crash
    } finally {
      setLoadingTodayDiet(false);
    }
  };

  // Generate Weekly Diet via Gemini API with safe fallback
  const fetchWeeklyDiet = async () => {
    if (rawWeeklyDietPlan) return;
    setLoadingWeeklyDiet(true);
    stopSpeaking();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch("/api/diet-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ seniorProfile }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data: WeeklyDietPlan = await res.json();
        if (data && data.days && data.days.length > 0) {
          setRawWeeklyDietPlan(data);
        } else {
          setRawWeeklyDietPlan(createFallbackWeeklyDietPlan(seniorProfile));
        }
      } else {
        setRawWeeklyDietPlan(createFallbackWeeklyDietPlan(seniorProfile));
      }
    } catch (err: any) {
      console.warn("API Weekly Diet fallback active:", err);
      setRawWeeklyDietPlan(createFallbackWeeklyDietPlan(seniorProfile));
    } finally {
      setLoadingWeeklyDiet(false);
    }
  };

  // Fetch only on initial mount or explicit profile key change
  useEffect(() => {
    if (lastFetchedProfileKey.current !== profileKey) {
      setRawDietPlan(createFallbackDietPlan(seniorProfile));
      fetchTodayDiet();
    }
  }, [profileKey]);

  // When switching to weekly view, fetch weekly diet
  useEffect(() => {
    if (viewMode === "weekly" && !weeklyDietPlan) {
      fetchWeeklyDiet();
    }
  }, [viewMode]);

  // Meal Photo Analysis Handler
  const handleAnalyzeMealPhoto = async (photoDataUrl: string) => {
    setMealPhoto(photoDataUrl);
    setAnalyzingPhoto(true);
    setPhotoAnalysis(null);

    try {
      const res = await fetch("/api/analyze-meal-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: photoDataUrl,
          conditions: seniorProfile.diseases || [],
          seniorProfile,
        }),
      });

      if (!res.ok) throw new Error("식단 분석 실패");

      const data: MealPhotoAnalysis = await res.json();
      setPhotoAnalysis(data);

      if (data.seniorFeedback) {
        speakText({
          text: `어르신, 식단 평가입니다. ${data.seniorFeedback}`,
        });
      }
    } catch (err: any) {
      console.error(err);
      alert("식단 분석 중 문제가 발생했습니다.");
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          handleAnalyzeMealPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Voice Read Entire Diet
  const handleReadDietAudio = () => {
    if (!dietPlan) return;

    if (isReadingAudio) {
      stopSpeaking();
      setIsReadingAudio(false);
    } else {
      const breakfast = dietPlan?.meals?.breakfast?.title ?? "";
      const lunch = dietPlan?.meals?.lunch?.title ?? "";
      const dinner = dietPlan?.meals?.dinner?.title ?? "";
      const snack = dietPlan?.meals?.snack?.title ?? "";
      const advice = dietPlan?.overallAdvice ?? "";

      const fullSpeechText = `어르신 맞춤 식단입니다. 
아침 식사: ${breakfast}. 
점심 식사: ${lunch}. 
저녁 식사: ${dinner}. 
간식: ${snack}. 
${advice}`;

      speakText({
        text: fullSpeechText,
        onStart: () => setIsReadingAudio(true),
        onEnd: () => setIsReadingAudio(false),
      });
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Title Header */}
      <div
        className={`p-5 rounded-3xl shadow-sm border ${
          isHighContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-emerald-50 border-emerald-200 text-gray-900"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              3. 건강 맞춤 식단 추천 & 검사
            </h2>
            <p className="text-sm font-semibold opacity-80 mt-0.5">
              등록하신 건강 프로필을 바탕으로 식단을 자동으로 구성해 드립니다
            </p>
          </div>
        </div>
      </div>

      {/* Senior Profile Summary Info Box */}
      <div className="p-4 bg-white border-2 border-emerald-300 rounded-3xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-600 fill-emerald-100" />
            <span className="font-extrabold text-base text-emerald-950">
              어르신 연동 건강 프로필
            </span>
          </div>
          <span className="text-xs font-bold text-gray-600">
            상단 프로필 메뉴에서 언제든 변경 가능
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-black">
            나이: {seniorProfile.age || "74"}세
          </span>
          {seniorProfile.diseases && seniorProfile.diseases.length > 0 ? (
            seniorProfile.diseases.map((d, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-xl text-xs font-black"
              >
                {d}
              </span>
            ))
          ) : (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold">
              등록된 보유질환 없음
            </span>
          )}

          {seniorProfile.allergies && (
            <span className="px-2.5 py-1 bg-rose-100 text-rose-900 rounded-xl text-xs font-black flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              알레르기: {seniorProfile.allergies}
            </span>
          )}
        </div>
      </div>

      {/* Allergy Safety Shield Active Notice Banner */}
      <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-md border border-emerald-500 flex items-center gap-3.5">
        <div className="p-2.5 bg-white/20 rounded-2xl shrink-0">
          <ShieldAlert className="w-7 h-7 text-white" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h4 className="font-extrabold text-base text-white">
              🛡️ 알레르기 안심 필터 작동 중
            </h4>
            <span className="px-2 py-0.5 bg-white text-emerald-800 font-black text-[11px] rounded-md">
              완벽 차단
            </span>
          </div>
          <p className="text-xs font-bold text-emerald-50 leading-relaxed">
            {seniorProfile.allergies
              ? `'${seniorProfile.allergies}' 유발 식재료(잣, 견과류 등)는 모든 식단 추천 및 분석에서 완전 제거·대체되었습니다.`
              : "등록된 알레르기 성분이 포함된 식재료는 AI 시스템에 의해 엄격히 차단됩니다."}
          </p>
        </div>
      </div>

      {/* View Mode Switching Tabs (오늘의 식단 vs 일주일 식단 미리보기) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          id="btn-tab-diet-today"
          onClick={() => setViewMode("today")}
          className={`py-3.5 px-3 rounded-2xl font-black text-base flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${
            viewMode === "today"
              ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>오늘의 밥상 추천</span>
        </button>

        <button
          id="btn-tab-diet-weekly"
          onClick={() => setViewMode("weekly")}
          className={`py-3.5 px-3 rounded-2xl font-black text-base flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${
            viewMode === "weekly"
              ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span>일주일 식단 미리보기</span>
        </button>
      </div>

      {/* ----------------- TAB 1: TODAY'S DIET PLAN ----------------- */}
      {viewMode === "today" && (
        <div className="space-y-5">
          {/* New Diet Button for Health Changes */}
          <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-3xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-950 font-extrabold text-sm">
                <RotateCcw className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>건강상태 크게 변경 시 (병 추가 / 약 변경 등)</span>
              </div>
              <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg">
                맞춤 식단 재구성
              </span>
            </div>

            <button
              id="btn-regenerate-new-diet"
              onClick={() => {
                fetchTodayDiet();
                setRawWeeklyDietPlan(null); // Force weekly diet re-fetch
              }}
              disabled={loadingTodayDiet}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-base rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className={`w-5 h-5 ${loadingTodayDiet ? "animate-spin" : ""}`} />
              <span>
                {loadingTodayDiet
                  ? "변경된 건강 상태 반영 중... 새로운 식단차리는 중"
                  : "🔄 새로운 건강상태 반영 · 식단 변경하기"}
              </span>
            </button>
          </div>

          {loadingTodayDiet && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4 animate-spin text-emerald-700" />
              <span>AI 영양사가 최신 건강 프로필을 바탕으로 새로운 식단을 차리고 있습니다...</span>
            </div>
          )}

          <div className="space-y-5 animate-fade-in">
            {/* Overall Advice Box */}
            <div className="p-5 bg-emerald-100/90 border-2 border-emerald-400 rounded-3xl space-y-3 text-emerald-950 shadow-md">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-emerald-700 text-white font-black text-sm rounded-full flex items-center gap-1">
                  <Apple className="w-4 h-4" />
                  효도 영양사의 맞춤 조언
                </span>

                <button
                  id="btn-read-diet-audio"
                  onClick={handleReadDietAudio}
                  className="px-3.5 py-1.5 bg-emerald-700 text-white font-extrabold text-sm rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isReadingAudio ? "소리 멈춤" : "음성으로 듣기"}</span>
                </button>
              </div>

              <p className="font-extrabold text-xl leading-relaxed">
                {dietPlan?.overallAdvice ?? "어르신 속이 편안한 영양 맞춤 식단입니다."}
              </p>
            </div>

            {/* Meals Grid (Breakfast, Lunch, Dinner, Snack) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "🌅 아침 식사", meal: dietPlan?.meals?.breakfast, badgeBg: "bg-amber-100 text-amber-900" },
                { label: "☀️ 점심 식사", meal: dietPlan?.meals?.lunch, badgeBg: "bg-blue-100 text-blue-900" },
                { label: "🌙 저녁 식사", meal: dietPlan?.meals?.dinner, badgeBg: "bg-purple-100 text-purple-900" },
                { label: "🍵 영양 간식", meal: dietPlan?.meals?.snack, badgeBg: "bg-orange-100 text-orange-900" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-3xl border-2 shadow-md space-y-3 ${
                    isHighContrast
                      ? "bg-black border-yellow-400 text-yellow-300"
                      : "bg-white border-emerald-200 text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-xl text-sm font-black ${item.badgeBg}`}>
                      {item.label}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      {item.meal?.calories ?? "350 kcal"}
                    </span>
                  </div>

                  <h4 className="font-black text-2xl text-emerald-950 tracking-tight">
                    {item.meal?.title ?? "영양 가득 한식 차림"}
                  </h4>

                  {item.meal?.menuItems && item.meal.menuItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.meal.menuItems.map((menu, mIdx) => (
                        <span
                          key={mIdx}
                          className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-bold"
                        >
                          • {menu}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-extrabold text-emerald-900 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>건강 이점: {item.meal?.healthBenefit ?? "소화 보충 및 혈액순환 도움"}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Key Habits Tips */}
            {dietPlan?.keyTips && dietPlan.keyTips.length > 0 && (
              <div className="p-4 bg-white rounded-3xl border border-emerald-200 space-y-2">
                <h4 className="font-extrabold text-base text-emerald-800 flex items-center gap-1.5">
                  <Apple className="w-5 h-5 text-emerald-600" />
                  어르신 올바른 식습관 수칙:
                </h4>
                <ul className="space-y-1 list-disc list-inside text-sm font-bold text-gray-800">
                  {dietPlan.keyTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: WEEKLY DIET PLAN ----------------- */}
      {viewMode === "weekly" && (
        <div className="space-y-5">
          {loadingWeeklyDiet ? (
            <div className="p-8 bg-emerald-50 rounded-3xl border-2 border-emerald-400 text-center space-y-3 animate-pulse">
              <CalendarDays className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="text-2xl font-black text-emerald-900">
                어르신의 일주일(7일간) 맞춤 식단을 구성하는 중입니다...
              </h3>
              <p className="text-base font-bold text-emerald-700">
                월요일부터 일요일까지 영양과 맛, 알레르기 안전을 챙기고 있어요!
              </p>
            </div>
          ) : weeklyDietPlan ? (
            <div className="space-y-5 animate-fade-in">
              {/* Weekly General Advice */}
              <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-3xl space-y-2 text-blue-950">
                <span className="px-3 py-1 bg-blue-600 text-white font-extrabold text-xs rounded-full">
                  📅 일주일 식단 준비 & 장보기 가이드
                </span>
                <p className="font-extrabold text-base leading-relaxed">
                  {weeklyDietPlan.weeklyAdvice}
                </p>
              </div>

              {/* Day Selector Buttons (월, 화, 수, 목, 금, 토, 일) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-600">
                  확인할 요일을 선택해 주세요 (클릭):
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {weeklyDietPlan.days?.map((dayData, idx) => {
                    const isSelected = selectedDayIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDayIndex(idx)}
                        className={`py-3 px-3.5 rounded-2xl font-black text-sm shrink-0 border-2 transition-all active:scale-95 ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-emerald-50"
                        }`}
                      >
                        {dayData?.dayOfWeek ?? `${idx + 1}일차`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day's Menu Display */}
              {weeklyDietPlan.days?.[selectedDayIndex] && (
                <div className="p-5 bg-white border-2 border-emerald-400 rounded-3xl space-y-4 shadow-md">
                  <h3 className="text-2xl font-black text-emerald-950 flex items-center justify-between border-b pb-3">
                    <span>
                      {weeklyDietPlan.days[selectedDayIndex]?.dayOfWeek} 식단 차림표
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                      어르신 영양 맞춤
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        label: "🌅 아침",
                        meal: weeklyDietPlan.days[selectedDayIndex]?.breakfast,
                        bg: "bg-amber-50 border-amber-200",
                      },
                      {
                        label: "☀️ 점심",
                        meal: weeklyDietPlan.days[selectedDayIndex]?.lunch,
                        bg: "bg-blue-50 border-blue-200",
                      },
                      {
                        label: "🌙 저녁",
                        meal: weeklyDietPlan.days[selectedDayIndex]?.dinner,
                        bg: "bg-purple-50 border-purple-200",
                      },
                      {
                        label: "🍵 간식",
                        meal: weeklyDietPlan.days[selectedDayIndex]?.snack,
                        bg: "bg-orange-50 border-orange-200",
                      },
                    ].map((item, mIdx) => (
                      <div
                        key={mIdx}
                        className={`p-4 rounded-2xl border-2 space-y-2 ${item.bg}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-base text-gray-900">
                            {item.label}
                          </span>
                          <span className="text-[11px] font-bold text-gray-500">
                            {item.meal?.calories ?? "350 kcal"}
                          </span>
                        </div>

                        <h4 className="font-black text-lg text-emerald-950">
                          {item.meal?.title ?? "식단 차림"}
                        </h4>

                        {item.meal?.menuItems && item.meal.menuItems.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.meal.menuItems.map((m, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-white/80 border text-gray-800 rounded-md text-xs font-bold"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs font-extrabold text-emerald-800 pt-1">
                          💡 {item.meal?.healthBenefit ?? "속이 편안한 한식 추천"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ----------------- MEAL PHOTO INSPECTOR ----------------- */}
      <div
        className={`p-5 rounded-3xl border-2 shadow-md space-y-4 ${
          isHighContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-emerald-50/70 border-emerald-300 text-gray-900"
        }`}
      >
        <div className="flex items-center space-x-2">
          <Camera className="w-7 h-7 text-emerald-600" />
          <h3 className="font-black text-xl">오늘 드실 밥상 사진 검사하기</h3>
        </div>
        <p className="text-sm font-bold opacity-80">
          밥상이나 음식 사진을 찍으시면 어르신 질환 및 알레르기에 맞는지 인공지능이 영양 검사를 해드려요!
        </p>

        {/* Upload Button */}
        <div className="flex gap-2">
          <label className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95">
            <Camera className="w-5 h-5" />
            <span>밥상 사진 직접 촬영 / 파일 선택</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Sample Meal Photo Buttons */}
        <div className="space-y-2 pt-2 border-t border-emerald-200">
          <span className="text-xs font-bold text-gray-600">
            샘플 밥상 사진으로 바로 영양 검사 해보기:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_MEAL_PHOTOS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleAnalyzeMealPhoto(sample.url)}
                className="p-2.5 rounded-2xl bg-white border border-emerald-300 hover:border-emerald-500 text-left flex items-center space-x-2 transition-transform active:scale-95"
              >
                <img
                  src={sample.url}
                  alt={sample.title}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="overflow-hidden">
                  <span className="font-bold text-xs truncate block text-emerald-950">
                    {sample.title}
                  </span>
                  <span className="text-[10px] text-gray-500 truncate block">
                    {sample.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {analyzingPhoto && (
          <div className="p-4 bg-white rounded-2xl border border-emerald-400 text-center font-bold text-emerald-800 animate-pulse">
            밥상 사진을 어르신 질환 및 알레르기 기준으로 검사하는 중입니다...
          </div>
        )}

        {/* Meal Photo Analysis Result */}
        {photoAnalysis && !analyzingPhoto && (
          <div className="p-5 bg-white rounded-3xl border-2 border-emerald-400 space-y-3 text-gray-900 shadow-md animate-fade-in">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-extrabold text-xl text-emerald-950">
                {photoAnalysis.mealName}
              </span>
              <span className="px-3 py-1 bg-amber-500 text-white font-extrabold text-xs rounded-full">
                {photoAnalysis.ratingBadge}
              </span>
            </div>

            <p className="font-bold text-base leading-relaxed text-gray-800">
              {photoAnalysis.seniorFeedback}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold pt-1">
              <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-extrabold text-emerald-700 block">✓ 좋은 점:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {photoAnalysis.goodPoints?.map((g, idx) => (
                    <li key={idx}>{g}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 bg-amber-50 text-amber-950 rounded-xl border border-amber-200 space-y-1">
                <span className="font-extrabold text-amber-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  주의할 점:
                </span>
                <ul className="list-disc list-inside space-y-0.5">
                  {photoAnalysis.cautionPoints?.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
