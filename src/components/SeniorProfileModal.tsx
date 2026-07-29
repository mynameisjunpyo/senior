import React, { useState, useEffect } from "react";
import { SeniorProfile } from "../types";
import {
  User,
  Heart,
  Pill,
  Activity,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  FileText,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface SeniorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SeniorProfile;
  onSaveProfile: (updated: SeniorProfile) => void;
  onResetProfile?: () => void;
  isHighContrast: boolean;
}

const COMMON_DISEASES = [
  "고혈압",
  "당뇨",
  "고지혈증",
  "관절염",
  "소화약화",
  "골다공증",
  "백내장/시력저하",
  "뇌혈관질환",
];

export const SeniorProfileModal: React.FC<SeniorProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onResetProfile,
  isHighContrast,
}) => {
  const [height, setHeight] = useState(profile.height ?? "");
  const [weight, setWeight] = useState(profile.weight ?? "");
  const [age, setAge] = useState(profile.age ?? "");
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>(
    profile.diseases ?? []
  );
  const [customDiseaseInput, setCustomDiseaseInput] = useState("");
  const [currentMeds, setCurrentMeds] = useState(profile.currentMeds ?? "");
  const [surgeryHistory, setSurgeryHistory] = useState(profile.surgeryHistory ?? "");
  const [allergies, setAllergies] = useState(profile.allergies ?? "");
  const [guardianName, setGuardianName] = useState(profile.guardianName ?? "");
  const [guardianPhone, setGuardianPhone] = useState(profile.guardianPhone ?? "");

  useEffect(() => {
    if (profile) {
      setHeight(profile.height ?? "");
      setWeight(profile.weight ?? "");
      setAge(profile.age ?? "");
      setSelectedDiseases(profile.diseases ?? []);
      setCurrentMeds(profile.currentMeds ?? "");
      setSurgeryHistory(profile.surgeryHistory ?? "");
      setAllergies(profile.allergies ?? "");
      setGuardianName(profile.guardianName ?? "");
      setGuardianPhone(profile.guardianPhone ?? "");
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const toggleDisease = (disease: string) => {
    if (selectedDiseases.includes(disease)) {
      setSelectedDiseases(selectedDiseases.filter((d) => d !== disease));
    } else {
      setSelectedDiseases([...selectedDiseases, disease]);
    }
  };

  const addCustomDisease = () => {
    const trimmed = customDiseaseInput.trim();
    if (trimmed && !selectedDiseases.includes(trimmed)) {
      setSelectedDiseases([...selectedDiseases, trimmed]);
      setCustomDiseaseInput("");
    }
  };

  const handleSave = () => {
    const updatedProfile: SeniorProfile = {
      height: height.trim(),
      weight: weight.trim(),
      age: age.trim(),
      diseases: selectedDiseases,
      currentMeds: currentMeds.trim(),
      surgeryHistory: surgeryHistory.trim(),
      allergies: allergies.trim(),
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
    };
    onSaveProfile(updatedProfile);
    onClose();
  };

  const handleReset = () => {
    if (
      window.confirm(
        "어르신의 건강 프로필 정보 및 복용 중인 약 알림(2번 기능) 데이터가 모두 초기화됩니다. 계속하시겠습니까?"
      )
    ) {
      setHeight("");
      setWeight("");
      setAge("");
      setSelectedDiseases([]);
      setCurrentMeds("");
      setSurgeryHistory("");
      setAllergies("");
      setGuardianName("");
      setGuardianPhone("");
      if (onResetProfile) {
        onResetProfile();
      }
    }
  };

  return (
    <div
      id="modal-senior-profile"
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xs"
    >
      <div
        className={`w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 border-2 my-auto max-h-[92vh] overflow-y-auto ${
          isHighContrast
            ? "bg-black text-yellow-300 border-yellow-400"
            : "bg-white text-gray-900 border-blue-300"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-blue-900">
                어르신 건강 프로필 설정
              </h2>
              <p className="text-xs font-bold text-gray-600">
                맞춤 요약, 복용 알림, 건강 식단 분석에 자동 적용됩니다
              </p>
            </div>
          </div>
          <button
            id="btn-close-senior-profile-modal"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 font-bold text-xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Sections */}
        <div className="space-y-4">
          {/* 1. Basic Physical Metrics (Height, Weight, Age) */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
            <h3 className="font-extrabold text-base text-blue-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              신체 기본 정보 (키, 몸무게, 나이)
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  키 (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="예: 162"
                  className="w-full p-2.5 bg-white border-2 border-blue-300 rounded-xl font-black text-lg text-center text-gray-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  몸무게 (kg)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="예: 58"
                  className="w-full p-2.5 bg-white border-2 border-blue-300 rounded-xl font-black text-lg text-center text-gray-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  나이 (세)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="예: 74"
                  className="w-full p-2.5 bg-white border-2 border-blue-300 rounded-xl font-black text-lg text-center text-gray-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 2. Current Health Conditions / Diseases */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
            <h3 className="font-extrabold text-base text-amber-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-600" />
              현재 보유 질환 선택
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DISEASES.map((disease) => {
                const isSelected = selectedDiseases.includes(disease);
                return (
                  <button
                    key={disease}
                    type="button"
                    onClick={() => toggleDisease(disease)}
                    className={`py-2 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-1 transition-transform active:scale-95 border-2 ${
                      isSelected
                        ? "bg-amber-500 border-amber-600 text-white shadow-xs"
                        : "bg-white border-amber-300 text-gray-700 hover:bg-amber-100/50"
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                    <span>{disease}</span>
                  </button>
                );
              })}
            </div>

            {/* Add Custom Disease */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customDiseaseInput}
                onChange={(e) => setCustomDiseaseInput(e.target.value)}
                placeholder="직접 질환명 입력 (예: 골관절염, 역류성식도염)"
                className="flex-1 p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-gray-800"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomDisease();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomDisease}
                className="px-3 py-2 bg-amber-600 text-white font-extrabold text-xs rounded-xl hover:bg-amber-700"
              >
                추가
              </button>
            </div>
          </div>

          {/* 3. Allergy Information */}
          <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2">
            <label className="font-extrabold text-base text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              음식 & 약물 알레르기 정보
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="예: 잣, 복숭아, 갑각류(새우/게), 견과류, 메밀, 계란, 특정 항생제 등"
              className="w-full p-2.5 bg-white border-2 border-rose-300 rounded-xl font-bold text-sm text-gray-900 focus:outline-none focus:border-rose-600 leading-relaxed"
            />
            {/* Quick Allergy Chips */}
            <div className="space-y-1 pt-1">
              <span className="text-xs font-black text-rose-950 block">
                원터치 알레르기 추가 (클릭):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "잣 알레르기",
                  "견과류",
                  "복숭아",
                  "갑각류(새우/게)",
                  "우유/유당",
                  "계란",
                  "메밀",
                ].map((item) => {
                  const isIncluded = allergies.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        if (isIncluded) {
                          setAllergies(
                            allergies
                              .replace(item, "")
                              .replace(/,\s*,/g, ",")
                              .replace(/^,\s*/, "")
                              .replace(/,\s*$/, "")
                              .trim()
                          );
                        } else {
                          const prefix = allergies.trim() ? `${allergies.trim()}, ` : "";
                          setAllergies(`${prefix}${item}`);
                        }
                      }}
                      className={`py-1 px-2.5 rounded-lg text-xs font-black border transition-all active:scale-95 ${
                        isIncluded
                          ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                          : "bg-white text-rose-900 border-rose-300 hover:bg-rose-100/60"
                      }`}
                    >
                      {isIncluded ? `✓ ${item}` : `+ ${item}`}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] font-bold text-rose-700 pt-0.5">
              * 설정하신 알레르기 식재료(잣, 견과류 등)는 식단 추천 및 검사에서 완전 배제됩니다.
            </p>
          </div>

          {/* 4. Currently Taken Medications */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
            <label className="font-extrabold text-base text-emerald-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-600" />
              복용 중인 주요 약 (현재 먹고 있는 약)
            </label>
            <textarea
              rows={2}
              value={currentMeds}
              onChange={(e) => setCurrentMeds(e.target.value)}
              placeholder="예: 세비카정(혈압약 매일 아침), 글루코파지(당뇨약), 관절 소염진통제"
              className="w-full p-2.5 bg-white border-2 border-emerald-300 rounded-xl font-bold text-sm text-gray-900 focus:outline-none focus:border-emerald-600 leading-relaxed"
            />
          </div>

          {/* 5. Surgery & Past Medical History */}
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
            <label className="font-extrabold text-base text-purple-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              수술 내역 및 병력 (과거력)
            </label>
            <textarea
              rows={2}
              value={surgeryHistory}
              onChange={(e) => setSurgeryHistory(e.target.value)}
              placeholder="예: 2021년 오른쪽 무릎 인공관절 수술, 2019년 백내장 양안 수술"
              className="w-full p-2.5 bg-white border-2 border-purple-300 rounded-xl font-bold text-sm text-gray-900 focus:outline-none focus:border-purple-600 leading-relaxed"
            />
          </div>

          {/* 6. Guardian Emergency Contact */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
            <label className="font-extrabold text-base text-amber-950 flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-600 fill-amber-500" />
              보호자(도우미) 비상 연락처
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-amber-900 block mb-1">
                  보호자 이름/관계:
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="예: 보호자 (자녀)"
                  className="w-full p-2 bg-white border-2 border-amber-300 rounded-xl font-bold text-sm text-gray-900 focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-amber-900 block mb-1">
                  보호자 전화번호:
                </label>
                <input
                  type="tel"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full p-2 bg-white border-2 border-amber-300 rounded-xl font-bold text-sm text-gray-900 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>
            <p className="text-[11px] font-bold text-amber-800">
              * 도우미 호출 버튼을 누르면 이 번호로 즉시 전화가 연결됩니다.
            </p>
          </div>
        </div>

        {/* Safety Note & Action Buttons */}
        <div className="p-3 bg-gray-100 rounded-2xl text-xs font-bold text-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <span>입력된 정보는 어르신 기기에만 안전하게 저장됩니다.</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex space-x-3">
            <button
              id="btn-cancel-profile-modal"
              type="button"
              onClick={onClose}
              className="w-1/3 py-3.5 bg-gray-200 text-gray-800 font-extrabold text-base rounded-2xl hover:bg-gray-300"
            >
              취소
            </button>
            <button
              id="btn-save-senior-profile"
              type="button"
              onClick={handleSave}
              className="w-2/3 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 border border-blue-400 active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              건강 정보 저장하기
            </button>
          </div>

          {/* Reset Profile Button */}
          {onResetProfile && (
            <button
              id="btn-reset-senior-profile"
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-98"
            >
              <RotateCcw className="w-4 h-4 text-red-600" />
              <span>어르신 건강 프로필 정보 초기화</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
