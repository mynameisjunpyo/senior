import React, { useState } from "react";
import { MedicationItem } from "../types";
import { Pill, Plus, X, Clock, AlertTriangle } from "lucide-react";

interface MedicationAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (med: Omit<MedicationItem, "id" | "createdAt">) => void;
  isHighContrast: boolean;
}

export const MedicationAddModal: React.FC<MedicationAddModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isHighContrast,
}) => {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("1알");
  const [frequency, setFrequency] = useState<1 | 2 | 3>(3);
  const [days, setDays] = useState(7);
  const [note, setNote] = useState("식후 30분 복용");
  const [caution, setCaution] = useState("규칙적 복용 및 주의");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let times: string[] = ["08:30", "12:30", "18:30"];
    if (frequency === 1) {
      times = ["18:30"]; // 하루 1회: 저녁만
    } else if (frequency === 2) {
      times = ["08:30", "18:30"]; // 하루 2회: 아침, 저녁
    } else {
      times = ["08:30", "12:30", "18:30"]; // 하루 3회: 아침, 점심, 저녁
    }

    const takenObj: Record<string, boolean> = {};
    times.forEach((t) => (takenObj[t] = false));

    onAdd({
      name: name.trim(),
      dosage: dosage.trim() || "1알",
      frequencyPerDay: frequency,
      timesOfDay: times,
      days,
      note: note.trim() || "식후 30분 복용",
      cautions: caution.trim() ? [caution.trim()] : ["규칙적 복용"],
      takenToday: takenObj,
    });

    // Reset Form
    setName("");
    onClose();
  };

  return (
    <div
      id="modal-add-medication"
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 my-8 ${
          isHighContrast
            ? "bg-black border-2 border-yellow-400 text-yellow-300"
            : "bg-white text-gray-900"
        }`}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-2xl font-black flex items-center gap-2 text-blue-600">
            <Pill className="w-7 h-7" />
            새 약 알림 등록
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:text-black font-bold"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Medication Name */}
          <div className="space-y-1">
            <label className="font-extrabold text-base block text-gray-800">
              약 이름 (처방약명):
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 혈압약 세비카정, 당뇨약"
              className="w-full p-3.5 rounded-2xl border-2 border-gray-300 font-bold text-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Dosage & Days */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-sm block text-gray-800">
                1회 복용량:
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-300 font-bold text-base"
              />
            </div>
            <div>
              <label className="font-extrabold text-sm block text-gray-800">
                복용 일수 (일):
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full p-3 rounded-xl border-2 border-gray-300 font-bold text-base"
              />
            </div>
          </div>

          {/* Daily Frequency Selection */}
          <div className="space-y-2 pt-1">
            <label className="font-extrabold text-base block text-gray-800 flex items-center gap-1">
              <Clock className="w-5 h-5 text-blue-600" />
              하루 복용 횟수 분류 선택:
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setFrequency(1)}
                className={`py-3.5 px-4 rounded-2xl font-extrabold text-base border-2 flex items-center justify-between transition-all ${
                  frequency === 1
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <span>🌙 하루 1회 (저녁만 복용)</span>
                <span className="font-black text-sm px-2 py-0.5 bg-white/20 rounded-lg">
                  {frequency === 1 ? "✓ 선택됨" : "선택"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFrequency(2)}
                className={`py-3.5 px-4 rounded-2xl font-extrabold text-base border-2 flex items-center justify-between transition-all ${
                  frequency === 2
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <span>🌅🌙 하루 2회 (아침, 저녁 복용)</span>
                <span className="font-black text-sm px-2 py-0.5 bg-white/20 rounded-lg">
                  {frequency === 2 ? "✓ 선택됨" : "선택"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFrequency(3)}
                className={`py-3.5 px-4 rounded-2xl font-extrabold text-base border-2 flex items-center justify-between transition-all ${
                  frequency === 3
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <span>🌅☀️🌙 하루 3회 (아침, 점심, 저녁 복용)</span>
                <span className="font-black text-sm px-2 py-0.5 bg-white/20 rounded-lg">
                  {frequency === 3 ? "✓ 선택됨" : "선택"}
                </span>
              </button>
            </div>
          </div>

          {/* Timing Note & Caution */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="font-extrabold text-sm block text-gray-800">
                복용 용법:
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 식후 30분 복용"
                className="w-full p-3 rounded-xl border-2 border-gray-300 font-bold text-base"
              />
            </div>

            <div>
              <label className="font-extrabold text-sm block text-gray-800 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                주의사항 (부작용 알림):
              </label>
              <input
                type="text"
                value={caution}
                onChange={(e) => setCaution(e.target.value)}
                placeholder="예: 졸음 유발, 자몽주스 금지"
                className="w-full p-3 rounded-xl border-2 border-gray-300 font-bold text-base"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xl rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus className="w-7 h-7" />
              약 복용 알림 등록 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
