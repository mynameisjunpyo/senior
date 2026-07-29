import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser limits for image base64 uploads
app.use(express.json({ limit: "25mb" }));

// Initialize Gemini Client safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Helper to format senior health profile context
const formatSeniorProfilePrompt = (profile?: any) => {
  if (!profile) return "";
  const parts = [];
  if (profile.age) parts.push(`• 나이: ${profile.age}세`);
  if (profile.height) parts.push(`• 키: ${profile.height}cm`);
  if (profile.weight) parts.push(`• 체중: ${profile.weight}kg`);
  if (profile.diseases && profile.diseases.length) parts.push(`• 현재 보유 질환: ${Array.isArray(profile.diseases) ? profile.diseases.join(", ") : profile.diseases}`);
  if (profile.allergies) {
    parts.push(`• 알레르기 정보: ${profile.allergies}`);
    parts.push(`  🚨 [알레르기 최우선 절대배제 규칙]: '${profile.allergies}' 유발 식재료(잣, 잣죽, 잣가루, 견과류, 갑각류, 복숭아 등)는 식단(메뉴, 반찬, 간식)에 절대 포함시키지 말고 안전한 식재료(야채죽, 전복죽, 생선 등)로 100% 대체하세요!`);
  }
  if (profile.currentMeds) parts.push(`• 현재 복용 중인 약: ${profile.currentMeds}`);
  if (profile.surgeryHistory) parts.push(`• 과거 수술 내역 및 주요 병력: ${profile.surgeryHistory}`);

  return parts.length > 0
    ? `\n[어르신 맞춤 건강 및 신체 정보]:\n${parts.join("\n")}\n이 건강 프로필(나이, 보유 질환, 알레르기, 현재 복용약, 수술 병력 등)을 반드시 깊이 고려하여 어르신께 꼭 필요한 맞춤형 조언과 경고를 포함해 주세요.\n`
    : "";
};

// API Endpoint 1: Prescription & Document OCR & Senior Easy Summary
app.post("/api/ocr-summary", async (req, res) => {
  try {
    const { imageBase64, mimeType, rawText, seniorProfile } = req.body;

    const ai = getGeminiClient();
    const profileContext = formatSeniorProfilePrompt(seniorProfile);

    let contents: any;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      contents = {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
          {
            text: `당신은 어르신을 다정하게 보살피는 '시니어 케어' 전문 AI 도우미입니다.
제공된 이미지(처방전, 약 포지, 약 설명서, 제품/가전/스마트폰 사용설명서, 병원 안내문, 수술/시술 동의서, 주민센터/공공기관 복지 안내문 등 모든 복잡한 문서)의 글자를 정확히 인식(OCR)하고, 어르신이 한눈에 쉽게 이해하실 수 있도록 쉬운 우리말 다정한 존댓말로 요약해주세요.
${profileContext}
요약 스타일 지침:
1. 시작할 때 "어르신, 핵심 내용만 알기 쉽게 정리해 드릴게요!"처럼 따뜻하고 다정한 인사로 시작하세요.
2. 약이나 건강 관련 문서라면 복용법(하루 몇 번, 식전/식후 몇 분, 1회 몇 알)이나 주의사항(어지럼증, 운전금지, 당뇨/혈압약 상충 등)을 매우 알기 쉽게 분리하세요.
3. 기기 사용설명서나 공공기관 문서라면 어르신이 당장 행동해야 하는 순서대로 1, 2, 3 단계별로 작성하세요.
4. 만약 약 처방전이나 복용 정보가 인식되면 약 이름, 하루 복용 횟수, 추천 시각, 복용 일수를 자동 알람용 데이터(detectedMedications)로 구조화해 주세요.

응답은 반드시 지정된 JSON 형식으로 작성해주세요.`,
          },
        ],
      };
    } else if (rawText) {
      contents = `당신은 어르신을 다정하게 보살피는 '시니어 케어' 전문 AI 도우미입니다.
다음 문서/약설명서/처방전/안내문 텍스트를 어르신이 이해하기 쉬운 말로 다정하게 요약하고 핵심 지침 및 주의사항을 정리해 주세요.
${profileContext}
[원본 텍스트]:
${rawText}

응답은 반드시 지정된 JSON 형식으로 작성해주세요.`;
    } else {
      return res.status(400).json({ error: "이미지 또는 텍스트가 필요합니다." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalText: {
              type: Type.STRING,
              description: "인식되거나 전달된 원본 글자 내용",
            },
            seniorSummary: {
              type: Type.STRING,
              description: "어르신을 위한 다정하고 쉬운 말투의 요약문 (큰 글씨와 음성 읽기용)",
            },
            keyInstructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "주요 복용 방법 핵심 항목 목록",
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "어르신이 주의해야 할 약 부작용 및 행동 금지사항",
            },
            detectedMedications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "약 품명 또는 처방전 이름" },
                  dosage: { type: Type.STRING, description: "1회 복용량 (예: 1알)" },
                  frequencyPerDay: { type: Type.NUMBER, description: "하루 복용 횟수" },
                  timesOfDay: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "추천 복용 시각 목록 (예: '08:30', '12:30', '18:30')",
                  },
                  days: { type: Type.NUMBER, description: "복용 일수 (예: 3)" },
                  note: { type: Type.STRING, description: "특이 복용 방법 (예: 식후 30분)" },
                },
              },
              description: "자동 복용 알림으로 등록 가능한 약 정보 목록",
            },
          },
          required: ["seniorSummary", "keyInstructions", "warnings", "detectedMedications"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /api/ocr-summary:", err);
    return res.status(500).json({
      error: "글자 인식 및 요약 처리 중 오류가 발생했습니다.",
      details: err.message,
    });
  }
});

// API Endpoint 2: Senior Personalized Diet Recommendation
app.post("/api/diet-recommendation", async (req, res) => {
  try {
    const { conditions, preference, seniorProfile } = req.body;
    const ai = getGeminiClient();
    const profileContext = formatSeniorProfilePrompt(seniorProfile);

    const prompt = `당신은 한국 어르신 전문 영양 관리사이자 '시니어 케어' AI 도우미입니다.
${profileContext}
어르신의 건강 상태 [${(conditions || []).join(", ")}]와 선호 사항 [${preference || "소화가 잘되는 따뜻한 식단"}]을 바탕으로 어르신 맞춤 1일 식단(아침, 점심, 저녁, 간식)을 추천해 주세요.

🚨 [최우선 알레르기 안전 지침]:
어르신의 알레르기 정보("${seniorProfile?.allergies || "없음"}")에 잣, 견과류, 복숭아, 갑각류 등 특정 식재료가 포함되어 있으면, 잣죽, 잣 고명, 잣 가루, 견과류 등을 메뉴명이나 반찬, 간식에 단 1개도 포함시키지 마세요. (대신 전복 야채죽, 소고기죽, 들깨죽, 생선구이 등 안전하고 건강한 한식으로 대체하세요).

지침:
1. 어르신의 키, 체중, 나이, 수술 내역, 보유 질환(고혈압: 저염, 당뇨: 저당/혈당조절, 고지혈증: 저지방, 관절염: 항염/칼슘 등)에 꼭 맞는 영양 한식을 구성하세요.
2. 친근하고 다정한 존댓말로 어르신께 왜 이 식단이 건강에 도움이 되는지 명확히 설명해 주세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAdvice: {
              type: Type.STRING,
              description: "어르신의 신체 및 건강 상태에 맞춘 총괄 맞춤 영양 조언문",
            },
            meals: {
              type: Type.OBJECT,
              properties: {
                breakfast: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    menuItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                    calories: { type: Type.STRING },
                    healthBenefit: { type: Type.STRING },
                  },
                },
                lunch: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    menuItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                    calories: { type: Type.STRING },
                    healthBenefit: { type: Type.STRING },
                  },
                },
                dinner: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    menuItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                    calories: { type: Type.STRING },
                    healthBenefit: { type: Type.STRING },
                  },
                },
                snack: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    menuItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                    calories: { type: Type.STRING },
                    healthBenefit: { type: Type.STRING },
                  },
                },
              },
            },
            keyTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "어르신을 위한 3가지 올바른 식습관 수칙",
            },
          },
          required: ["overallAdvice", "meals", "keyTips"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /api/diet-recommendation:", err);
    return res.status(500).json({
      error: "식단 추천 생성 중 오류가 발생했습니다.",
      details: err.message,
    });
  }
});

// API Endpoint 2-2: Weekly Senior Diet Recommendation (7 Days)
app.post("/api/diet-weekly", async (req, res) => {
  try {
    const { seniorProfile } = req.body;
    const ai = getGeminiClient();
    const profileContext = formatSeniorProfilePrompt(seniorProfile);

    const prompt = `당신은 한국 어르신 전문 영양 관리사이자 '시니어 케어' AI 도우미입니다.
${profileContext}
어르신의 건강 프로필(나이, 키, 체중, 보유 질환, 알레르기 정보, 현재 복용약)을 엄격히 반영하여 어르신이 일주일(월요일~일요일) 동안 미리 계획하고 장을 봐서 식사를 준비할 수 있도록 7일간의 맞춤 한식 식단(아침, 점심, 저녁, 건강 간식)을 추천해 주세요.

지침:
1. 알레르기 성분(${seniorProfile?.allergies || "없음"}) 및 복용약 부작용 음식은 엄격히 배제하세요.
2. ★ 필수 지침: 월요일부터 일요일까지 7일간의 아침, 점심, 저녁, 간식 메뉴가 서로 절대 중복되지 않고, 삼치구이, 소고기전골, 닭곰탕, 가자미조림, 뚝배기불고기, 대구지리탕, 찜닭, 전복죽 등 하루하루 메인 반찬과 국물 요리가 매우 다양하고 다채롭도록 차려주세요.
3. 월, 화, 수, 목, 금, 토, 일 7일 각각에 대해 아침, 점심, 저녁, 간식 메뉴와 건강 효과를 정형화된 JSON으로 반환하세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weeklyAdvice: {
              type: Type.STRING,
              description: "일주일 전체 식단 준비를 위한 어르신 맞춤 영양 가이드 및 장보기 팁",
            },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayOfWeek: { type: Type.STRING, description: "요일 (예: 월요일, 화요일, 수요일, 목요일, 금요일, 토요일, 일요일)" },
                  breakfast: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      menuItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                      calories: { type: Type.STRING },
                      healthBenefit: { type: Type.STRING },
                    },
                  },
                  lunch: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      menuItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                      calories: { type: Type.STRING },
                      healthBenefit: { type: Type.STRING },
                    },
                  },
                  dinner: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      menuItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                      calories: { type: Type.STRING },
                      healthBenefit: { type: Type.STRING },
                    },
                  },
                  snack: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      menuItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                      calories: { type: Type.STRING },
                      healthBenefit: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
          required: ["weeklyAdvice", "days"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /api/diet-weekly:", err);
    return res.status(500).json({
      error: "일주일 식단 추천 생성 중 오류가 발생했습니다.",
      details: err.message,
    });
  }
});

// API Endpoint 3: Meal Photo Evaluation
app.post("/api/analyze-meal-photo", async (req, res) => {
  try {
    const { imageBase64, mimeType, conditions, seniorProfile } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "식단 사진이 필요합니다." });
    }

    const ai = getGeminiClient();
    const profileContext = formatSeniorProfilePrompt(seniorProfile);
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
          {
            text: `어르신의 신체 및 건강 정보 [${profileContext}]와 질환 [${(conditions || []).join(", ")}]을 고려하여, 촬영된 밥상/식단 사진을 분석해 주세요.
어떤 음식인지 알아보고, 어르신의 신체 상태에 건강한 점과 주의해서 드셔야 할 점(예: 국물 나트륨, 단 양념, 딱딱한 음식)을 다정하고 세심하게 설명해 주세요.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mealName: { type: Type.STRING, description: "식단명 또는 관찰된 요리들" },
            ratingBadge: { type: Type.STRING, description: "칭찬 뱃지 (예: 아주 건강해요, 양념 적정 필요, 단백질 최고)" },
            seniorFeedback: { type: Type.STRING, description: "어르신께 드리는 다정하고 세심한 평가글" },
            goodPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            cautionPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["mealName", "ratingBadge", "seniorFeedback", "goodPoints", "cautionPoints"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /api/analyze-meal-photo:", err);
    return res.status(500).json({
      error: "식단 사진 분석 중 오류가 발생했습니다.",
      details: err.message,
    });
  }
});

// API Endpoint 4: Voice Memo & Senior Schedule Auto Extract
app.post("/api/parse-voice-memo", async (req, res) => {
  try {
    const { memoText, currentDate, seniorProfile } = req.body;
    const ai = getGeminiClient();
    const profileContext = formatSeniorProfilePrompt(seniorProfile);

    const todayStr = currentDate || new Date().toISOString().split("T")[0];

    const prompt = `당신은 어르신의 음성 메모나 말소리를 듣고 중요 일정 및 기억할 사항을 똑똑하게 달력에 정리해주는 '시니어 케어' 도우미입니다.
오늘 날짜: ${todayStr}
${profileContext}
[어르신의 음성/메모 내용]:
"${memoText}"

이 내용에서 일정/약속/병원/가족 방문/장보기/중요 메모를 분석하여 일정 항목을 추출해 주세요.
만약 상대적 날짜(내일, 모레, 이번주 금요일 등)가 있다면 오늘 날짜(${todayStr}) 기준으로 정확한 날짜(YYYY-MM-DD)로 계산하세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "일정 제목 (예: 서울아산병원 내과 진료)" },
            date: { type: Type.STRING, description: "날짜 YYYY-MM-DD" },
            time: { type: Type.STRING, description: "시간 (예: 14:00 또는 오전 10시)" },
            category: { type: Type.STRING, description: "카테고리: 병원, 약복용, 가족, 경조사, 모임, 기타" },
            location: { type: Type.STRING, description: "장소 (있을 경우)" },
            seniorVoiceSummary: {
              type: Type.STRING,
              description: "어르신께 다시 음성으로 들려드릴 확인 안내문 (예: 어르신, 7월 28일 오후 2시에 서울아산병원 진료 일정을 저장했습니다!)",
            },
            reminderTips: { type: Type.STRING, description: "준비물 또는 어르신께 당부할 준비 팁" },
          },
          required: ["title", "date", "seniorVoiceSummary"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return res.json(result);
  } catch (err: any) {
    console.error("Error in /api/parse-voice-memo:", err);
    return res.status(500).json({
      error: "음성 메모 분석 중 오류가 발생했습니다.",
      details: err.message,
    });
  }
});

// Start Express server with Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[HyoDo Care Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
