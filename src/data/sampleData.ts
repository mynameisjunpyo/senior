import { CalendarEvent, MedicationItem, SeniorProfile } from "../types";

export const DEFAULT_SENIOR_PROFILE: SeniorProfile = {
  height: "162",
  weight: "58",
  age: "74",
  diseases: ["고혈압", "당뇨", "관절염"],
  currentMeds: "세비카정(혈압약 매일 아침), 아세트아미노펜(진통제)",
  surgeryHistory: "2021년 오른쪽 무릎 인공관절 수술, 2019년 백내장 수술",
  allergies: "잣, 복숭아, 갑각류(새우/게) 알레르기",
  guardianName: "보호자 (자녀)",
  guardianPhone: "010-1234-5678",
};

export interface SampleDocument {
  id: string;
  title: string;
  category: "약설명서" | "처방전" | "사용설명서" | "병원안내문" | "공공복지";
  rawText: string;
  summaryPreview: string;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: "doc-1",
    title: "1. 고혈압약 및 당뇨약 복용 설명서",
    category: "약설명서",
    summaryPreview: "매일 아침 식후 30분, 자몽주스 같이 드시면 안 됩니다",
    rawText: `[세비카정 5/20mg - 고혈압 치료제]
1일 1회, 매일 아침 식후 30분 복용. 규칙적인 시각에 드셔야 합니다.
주의사항: 자몽주스와 함께 드시면 혈압이 갑자기 과도하게 떨어질 수 있으니 피하세요. 갑자기 일어설 때 어지러울 수 있으니 서서히 일어나십시오.
[글루코파지정 500mg - 당뇨 치료제]
1일 2회 (아침, 저녁 식 직후 복용). 위장장애가 있을 수 있으니 식사 직후 바로 드시는 것이 좋습니다. 식사를 거르실 때는 복용을 피하세요.`,
  },
  {
    id: "doc-2",
    title: "2. 스마트폰 & 로봇청소기 쉬운 사용설명서",
    category: "사용설명서",
    summaryPreview: "전원 버튼 3초 누르기, 청소 시작 버튼 터치방법",
    rawText: `[스마트 청소기 어르신 쉬운 가이드]
1단계: 제품 상단의 빨간색 전원 스위치를 3초 동안 꾹 누르면 '띠리링' 소리와 함께 불이 들어옵니다.
2단계: 손잡이의 '청소 시작' 버튼을 한번 똑깍 누르면 자동으로 집안 청소를 시작합니다.
3단계: 청소를 마친 뒤 '집으로' 버튼을 누르면 스스로 충전기로 돌아가 충전합니다.
주의: 바닥에 긴 전선이나 물기가 있으면 청소기가 걸릴 수 있으니 사전에 치워주세요.`,
  },
  {
    id: "doc-3",
    title: "3. 종합 건강검진 전날 및 당일 주의사항 안내문",
    category: "병원안내문",
    summaryPreview: "검진 전날 저녁 8시 이후 금식, 혈압약은 당일 새벽 6시 복용",
    rawText: `[서울종합검진센터 어르신 검진 안내문]
1. 검진 전날: 저녁 8시 이전까지 소화가 잘 되는 죽으로 가볍게 식사하시고, 밤 9시 이후부터는 물, 음료수, 담배, 껌을 포함해 절대 금식하십시오.
2. 검진 당일: 아침 식사는 물론 물도 드시지 마세요.
3. 혈압약 복용법: 현재 드시는 혈압약은 검진 당일 새벽 6시에 아주 적은 양의 물과 함께 꼭 드시고 오세요. (단, 당뇨약/인슐린 주사는 당일 금식 중이므로 절대 금하지 마시고 투여하지 마세요.)
4. 준비물: 신분증, 돋보기 안경, 평소 복용 중인 약 목록.`,
  },
  {
    id: "doc-4",
    title: "4. 주민센터 어르신 기초연금 & 복지 지원 안내서",
    category: "공공복지",
    summaryPreview: "만 65세 이상 신청, 주민센터 방문시 신분증과 통장사본 제출",
    rawText: `[행복 주민센터 어르신 복지 혜택 안내]
• 대상: 만 65세 이상 어르신 중 소득인정액 기준 하위 70% 어르신.
• 혜택: 매월 최대 334,810원 기초연금 통장 지급.
• 준비물: 신분증(주민등록증 또는 운전면허증), 본인 명의 은행 통장 사본, 도장(없으면 서명 가능).
• 신청 장소: 관할 주소지 주민센터 복지팀 또는 국민연금공단 지사.
• 문의 전화: 보건복지부 콜센터 (국번없이 129번).`,
  },
];

// Alias for backward compatibility if referenced
export const SAMPLE_PRESCRIPTIONS = SAMPLE_DOCUMENTS;

export const INITIAL_MEDICATIONS: MedicationItem[] = [];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [];

export const SAMPLE_MEAL_PHOTOS = [
  {
    id: "meal-1",
    title: "시금치 된장국 & 고등어 구이 & 잡곡진밥",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    desc: "고혈압·당뇨에 우수한 저염 한식 차림",
  },
  {
    id: "meal-2",
    title: "야채 계란죽 & 오이무침",
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80",
    desc: "치아 및 소화가 편안한 단백질 계란죽 차림",
  },
];
