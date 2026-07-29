import React, { useState } from "react";
import { FontSizeLevel, MedicationItem } from "../types";
import { speakText, stopSpeaking } from "../lib/speech";
import { MedicationAddModal } from "./MedicationAddModal";
import {
  Pill,
  CheckCircle2,
  Circle,
  Plus,
  Volume2,
  Trash2,
  Clock,
  AlertCircle,
  Sparkles,
  Trophy,
  Check,
} from "lucide-react";

interface MedicationAlarmProps {
  fontSizeLevel: FontSizeLevel;
  isHighContrast: boolean;
  medications: MedicationItem[];
  onToggleTaken: (medId: string, timeSlot: string) => void;
  onAddMedication: (med: Omit<MedicationItem, "id" | "createdAt">) => void;
  onDeleteMedication: (medId: string) => void;
}

// Granular Time Slot Definition & Metadata
interface GranularSlotMeta {
  key: string;
  label: string;
  subLabel: string;
  icon: string;
  majorCategory: "morning" | "lunch" | "dinner"; // "morning" | "lunch" | "dinner"
}

const GRANULAR_SLOT_DEFS: Record<string, GranularSlotMeta> = {
  "08:30": {
    key: "08:30",
    label: "아침 복용",
    subLabel: "아침 식후",
    icon: "🌅",
    majorCategory: "morning",
  },
  "12:30": {
    key: "12:30",
    label: "점심 복용",
    subLabel: "점심 식후",
    icon: "☀️",
    majorCategory: "lunch",
  },
  "18:30": {
    key: "18:30",
    label: "저녁 복용",
    subLabel: "저녁 식후",
    icon: "🌙",
    majorCategory: "dinner",
  },
};

export const MedicationAlarm: React.FC<MedicationAlarmProps> = ({
  fontSizeLevel,
  isHighContrast,
  medications,
  onToggleTaken,
  onAddMedication,
  onDeleteMedication,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTabCategory, setActiveTabCategory] = useState<string>("all"); // "all" | "morning" | "lunch" | "dinner"

  const getTextSizeClass = () => {
    if (fontSizeLevel === "normal") return "text-base";
    if (fontSizeLevel === "large") return "text-xl font-bold";
    return "text-2xl font-extrabold";
  };

  // Helper to normalize medication times based on frequencyPerDay
  const getEffectiveTimesOfDay = (med: MedicationItem): string[] => {
    if (med.frequencyPerDay === 3) {
      return ["08:30", "12:30", "18:30"];
    }
    if (med.frequencyPerDay === 2) {
      return ["08:30", "18:30"];
    }
    if (med.frequencyPerDay === 1) {
      return ["18:30"]; // 하루 1회 복용: 저녁 식후 (18:30)
    }
    if (med.timesOfDay && med.timesOfDay.length > 0) {
      const normalized = med.timesOfDay.map((t) => {
        if (t.includes("아침")) return "08:30";
        if (t.includes("점심")) return "12:30";
        if (t.includes("저녁") || t.includes("취침")) return "18:30";
        return t;
      });
      return Array.from(new Set(normalized));
    }
    return ["18:30"];
  };

  // Helper to resolve slot metadata
  const getSlotMeta = (timeKey: string): GranularSlotMeta => {
    if (GRANULAR_SLOT_DEFS[timeKey]) return GRANULAR_SLOT_DEFS[timeKey];

    if (
      timeKey.includes("아침") ||
      timeKey.startsWith("07") ||
      timeKey.startsWith("08") ||
      timeKey.startsWith("09") ||
      timeKey <= "10:30"
    ) {
      return {
        key: timeKey,
        label: "아침 복용",
        subLabel: "아침",
        icon: "🌅",
        majorCategory: "morning",
      };
    } else if (
      timeKey.includes("점심") ||
      timeKey.startsWith("11") ||
      timeKey.startsWith("12") ||
      timeKey.startsWith("13") ||
      timeKey.startsWith("14") ||
      timeKey.startsWith("15") ||
      (timeKey > "10:30" && timeKey <= "15:30")
    ) {
      return {
        key: timeKey,
        label: "점심 복용",
        subLabel: "점심",
        icon: "☀️",
        majorCategory: "lunch",
      };
    } else {
      return {
        key: timeKey,
        label: "저녁 복용",
        subLabel: "저녁",
        icon: "🌙",
        majorCategory: "dinner",
      };
    }
  };

  // 1. Group all scheduled medication items by Granular Time Slot Session
  // Map: timeKey -> Array<{ med: MedicationItem, time: string, isTaken: boolean }>
  const slotGroupsMap: Map<
    string,
    { med: MedicationItem; time: string; isTaken: boolean }[]
  > = new Map();

  medications.forEach((med) => {
    const times = getEffectiveTimesOfDay(med);
    times.forEach((time) => {
      const items = slotGroupsMap.get(time) || [];
      items.push({
        med,
        time,
        isTaken: !!med.takenToday[time],
      });
      slotGroupsMap.set(time, items);
    });
  });

  // Sort time keys chronologically
  const sortedTimeKeys = Array.from(slotGroupsMap.keys()).sort();

  // 2. Granular Progress Calculation ("작은 기준": ? / N회 완료)
  // Each unique active time slot session = 1 Granular Session (1회)
  const totalGranularSessions = sortedTimeKeys.length;
  let completedGranularSessions = 0;

  sortedTimeKeys.forEach((timeKey) => {
    const items = slotGroupsMap.get(timeKey) || [];
    // Session is completed if EVERY medication in this slot group is taken
    const allTakenInSlot = items.length > 0 && items.every((i) => i.isTaken);
    if (allTakenInSlot) {
      completedGranularSessions++;
    }
  });

  const completionPercentage =
    totalGranularSessions > 0
      ? Math.round((completedGranularSessions / totalGranularSessions) * 100)
      : 100;

  // Handle Toggle & Speak Praise
  const handleCheckItem = (
    medId: string,
    time: string,
    currentStatus: boolean
  ) => {
    onToggleTaken(medId, time);

    if (!currentStatus) {
      // Speak encouraging praise
      stopSpeaking();
      speakText({
        text: "어르신! 약을 잘 챙겨 드셨습니다. 건강을 위해 아주 잘 하셨어요!",
      });
    }
  };

  // Batch check all medications in a specific time slot
  const handleCheckAllInSlot = (timeKey: string, markTaken: boolean) => {
    const itemsInSlot = slotGroupsMap.get(timeKey) || [];
    itemsInSlot.forEach(({ med, isTaken }) => {
      if (isTaken !== markTaken) {
        onToggleTaken(med.id, timeKey);
      }
    });
    stopSpeaking();
    if (markTaken) {
      const meta = getSlotMeta(timeKey);
      speakText({
        text: `어르신, ${meta.label} 약을 모두 함께 복용 완료하셨습니다. 아주 훌륭해요!`,
      });
    }
  };

  // Test Alarm Audio
  const handleTestAlarmAudio = (medName: string, slotLabel: string) => {
    stopSpeaking();
    speakText({
      text: `어르신! ${slotLabel} ${medName} 드실 시간입니다. 잊지 마시고 지금 꼭 챙겨 드세요!`,
      rate: 0.8,
    });
  };

  // Filter time keys based on Active Major Tab Category ("전체보기" | "아침" | "점심" | "저녁")
  const filteredTimeKeys = sortedTimeKeys.filter((timeKey) => {
    if (activeTabCategory === "all") return true;
    const meta = getSlotMeta(timeKey);
    return meta.majorCategory === activeTabCategory;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Title Header */}
      <div
        className={`p-5 rounded-3xl shadow-sm border ${
          isHighContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-blue-50 border-blue-200 text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">
                2. 약 복용 알림 & 체크
              </h2>
              <p className="text-sm font-semibold opacity-80 mt-0.5">
                복용 중인 약을 관리하고 체크하세요
              </p>
            </div>
          </div>

          <button
            id="btn-open-add-med-modal"
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base rounded-2xl shadow-md flex items-center gap-1 active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5" />
            약 추가
          </button>
        </div>
      </div>

      {/* Summary Timetable Section */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isHighContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-white border-blue-200 text-gray-900"
        }`}
      >
        <div className="flex items-center gap-2 border-b pb-2 border-gray-100">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          <h3 className="font-black text-lg text-gray-900">
            복용 타임테이블
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { slotKey: "08:30", label: "🌅 아침", time: "08:30", major: "morning" },
            { slotKey: "12:30", label: "☀️ 점심", time: "12:30", major: "lunch" },
            { slotKey: "18:30", label: "🌙 저녁", time: "18:30", major: "dinner" },
          ].map((slot) => {
            const medsInSlot = medications.filter((m) =>
              getEffectiveTimesOfDay(m).includes(slot.slotKey)
            );
            const isConfigured = medsInSlot.length > 0;
            const takenCount = medsInSlot.filter((m) => m.takenToday[slot.slotKey]).length;
            const allDone = isConfigured && takenCount === medsInSlot.length;

            return (
              <button
                key={slot.slotKey}
                onClick={() => setActiveTabCategory(slot.major)}
                className={`p-2.5 rounded-2xl border flex flex-col justify-between text-left transition-all active:scale-95 ${
                  !isConfigured
                    ? "bg-gray-50 border-gray-200 text-gray-400"
                    : allDone
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs"
                    : "bg-blue-50/80 border-blue-300 text-blue-950 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm">{slot.label}</span>
                    <span className="text-[11px] font-bold text-gray-500">{slot.time}</span>
                  </div>

                  <div className="mt-1 space-y-0.5">
                    {isConfigured ? (
                      medsInSlot.map((m) => (
                        <span
                          key={m.id}
                          className="block text-xs font-extrabold truncate text-gray-800"
                        >
                          • {m.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-gray-400 italic">
                        없음
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-black/5 text-right">
                  {!isConfigured ? (
                    <span className="text-[11px] font-bold text-gray-400">—</span>
                  ) : allDone ? (
                    <span className="px-2 py-0.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-md">
                      완료
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-500 text-white font-extrabold text-[10px] rounded-md">
                      {takenCount}/{medsInSlot.length}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress Banner */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-2.5 ${
          completionPercentage === 100 && totalGranularSessions > 0
            ? "bg-emerald-50 border-emerald-400 text-emerald-950"
            : isHighContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-white border-blue-200 text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-amber-500 shrink-0" />
            <span className="font-extrabold text-base sm:text-lg">
              오늘 복용 현황
            </span>
          </div>
          <span className="text-lg sm:text-xl font-black text-blue-600 shrink-0">
            {completedGranularSessions} / {totalGranularSessions} 완료 ({completionPercentage}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {completionPercentage === 100 && totalGranularSessions > 0 && (
          <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 font-extrabold text-sm flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
            <span>오늘 예정된 모든 약을 복용하셨습니다! 🎉</span>
          </div>
        )}
      </div>

      {/* View Category Tabs */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { id: "all", label: "전체", icon: "📋" },
          { id: "morning", label: "아침", icon: "🌅" },
          { id: "lunch", label: "점심", icon: "☀️" },
          { id: "dinner", label: "저녁", icon: "🌙" },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`btn-tab-category-${tab.id}`}
            onClick={() => setActiveTabCategory(tab.id)}
            className={`py-2.5 px-2 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-1 border transition-transform active:scale-95 ${
              activeTabCategory === tab.id
                ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Granular Slot Session Group Cards */}
      {medications.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300 space-y-3">
          <Pill className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="text-lg font-bold text-gray-600">
            등록된 약이 없습니다. 처방전을 촬영하거나 [약 추가]를 눌러주세요.
          </p>
        </div>
      ) : filteredTimeKeys.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 rounded-3xl border border-gray-300 text-gray-600 font-bold text-base">
          선택한 시간대에 복용할 약이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTimeKeys.map((timeKey) => {
            const meta = getSlotMeta(timeKey);
            const itemsInSlot = slotGroupsMap.get(timeKey) || [];
            const completedCount = itemsInSlot.filter((i) => i.isTaken).length;
            const isSessionComplete =
              itemsInSlot.length > 0 && completedCount === itemsInSlot.length;

            return (
              <div
                key={timeKey}
                className={`p-4 sm:p-5 rounded-3xl border-2 shadow-sm space-y-3 ${
                  isSessionComplete
                    ? "bg-emerald-50/80 border-emerald-400 text-emerald-950"
                    : isHighContrast
                    ? "bg-black border-yellow-400 text-yellow-300"
                    : "bg-white border-blue-300 text-gray-900"
                }`}
              >
                {/* Header & Batch Check Button */}
                <div className="space-y-2 border-b pb-3 border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl sm:text-3xl">{meta.icon}</span>
                      <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <span>{meta.label}</span>
                        <span className="text-xs font-bold text-gray-500">
                          ({completedCount}/{itemsInSlot.length})
                        </span>
                      </h3>
                    </div>

                    <div>
                      {isSessionComplete ? (
                        <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          <span>완료</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-950 border border-amber-300 font-extrabold text-xs rounded-xl">
                          복용 전
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Batch Check Button */}
                  <button
                    id={`btn-check-all-${timeKey}`}
                    onClick={() => handleCheckAllInSlot(timeKey, !isSessionComplete)}
                    className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-98 border ${
                      isSessionComplete
                        ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-400"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs"
                    }`}
                  >
                    {isSessionComplete ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 fill-emerald-200 shrink-0" />
                        <span>✅ {meta.label} 약 모두 복용 완료 (취소)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white fill-emerald-500 shrink-0" />
                        <span>⚡ {meta.label} 약 한 번에 복용 완료</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Medication Items */}
                <div className="space-y-2">
                  {itemsInSlot.map(({ med, time, isTaken }) => (
                    <div
                      key={`${med.id}-${time}`}
                      className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isTaken
                          ? "bg-emerald-50/70 border-emerald-400 text-emerald-950"
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      }`}
                    >
                      {/* Checkbox + Info */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <button
                          onClick={() => handleCheckItem(med.id, time, isTaken)}
                          className={`p-1.5 rounded-xl border-2 flex items-center justify-center transition-all active:scale-95 shrink-0 ${
                            isTaken
                              ? "bg-emerald-600 text-white border-emerald-700"
                              : "bg-white text-gray-400 border-gray-300 hover:border-emerald-500"
                          }`}
                          title={isTaken ? "복용 완료됨" : "복용 체크"}
                        >
                          {isTaken ? (
                            <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9 text-white fill-emerald-500" />
                          ) : (
                            <Circle className="w-8 h-8 sm:w-9 sm:h-9" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-lg sm:text-xl text-gray-900 tracking-tight truncate">
                              {med.name}
                            </h4>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold text-xs rounded-md">
                              {med.dosage}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-gray-600 flex items-center gap-2 mt-0.5">
                            <span>{med.note}</span>
                            <span>· {med.days}일분</span>
                          </div>

                          {med.cautions && med.cautions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {med.cautions.map((c, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[11px] font-bold flex items-center gap-1"
                                >
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() =>
                            handleTestAlarmAudio(med.name, meta.label)
                          }
                          className="p-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center gap-1 hover:bg-blue-100 active:scale-95"
                          title="미리듣기"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span className="hidden sm:inline">듣기</span>
                        </button>

                        <button
                          onClick={() => onDeleteMedication(med.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50"
                          title="약 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Medication Modal */}
      <MedicationAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddMedication}
        isHighContrast={isHighContrast}
      />
    </div>
  );
};
