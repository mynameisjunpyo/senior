import React, { useState, useEffect } from "react";
import { FontSizeLevel, SeniorProfile } from "../types";
import {
  Volume2,
  VolumeX,
  Type,
  Sun,
  Moon,
  PhoneCall,
  Heart,
  Info,
  User,
  Activity,
  UserCheck,
  Phone,
  Save,
  ShieldAlert,
} from "lucide-react";

interface HeaderProps {
  fontSizeLevel: FontSizeLevel;
  setFontSizeLevel: (level: FontSizeLevel) => void;
  isHighContrast: boolean;
  setIsHighContrast: (val: boolean) => void;
  isVoiceGuidanceOn: boolean;
  setIsVoiceGuidanceOn: (val: boolean) => void;
  seniorProfile: SeniorProfile;
  onOpenProfileModal: () => void;
  onSaveProfile?: (updated: SeniorProfile) => void;
}

export const Header: React.FC<HeaderProps> = ({
  fontSizeLevel,
  setFontSizeLevel,
  isHighContrast,
  setIsHighContrast,
  isVoiceGuidanceOn,
  setIsVoiceGuidanceOn,
  seniorProfile,
  onOpenProfileModal,
  onSaveProfile,
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [guardianName, setGuardianName] = useState(
    seniorProfile.guardianName || "보호자 (자녀)"
  );
  const [guardianPhone, setGuardianPhone] = useState(
    seniorProfile.guardianPhone || "010-1234-5678"
  );
  const [isEditingGuardian, setIsEditingGuardian] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setGuardianName(seniorProfile.guardianName || "보호자 (자녀)");
    setGuardianPhone(seniorProfile.guardianPhone || "010-1234-5678");
  }, [seniorProfile]);

  const handleSaveGuardian = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!guardianPhone.trim()) {
      alert("보호자 전화번호를 입력해주세요.");
      return;
    }

    const updated = {
      ...seniorProfile,
      guardianName: guardianName.trim() || "보호자",
      guardianPhone: guardianPhone.trim(),
    };

    if (onSaveProfile) {
      onSaveProfile(updated);
    }
    setIsEditingGuardian(false);
    setSaveMessage("✓ 보호자 번호가 성공적으로 저장되었습니다!");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const cycleFontSize = () => {
    if (fontSizeLevel === "normal") setFontSizeLevel("large");
    else if (fontSizeLevel === "large") setFontSizeLevel("xlarge");
    else setFontSizeLevel("normal");
  };

  const getFontSizeText = () => {
    if (fontSizeLevel === "normal") return "글씨: 보통";
    if (fontSizeLevel === "large") return "글씨: 크게";
    return "글씨: 왕눈이";
  };

  return (
    <header
      id="app-header"
      className={`sticky top-0 z-40 w-full px-3 sm:px-4 py-2.5 shadow-md border-b ${
        isHighContrast
          ? "bg-black text-yellow-300 border-yellow-400"
          : "bg-blue-600 text-white border-blue-700"
      }`}
    >
      <div className="max-w-md mx-auto space-y-2">
        {/* Top Control Line */}
        <div className="flex items-center justify-between">
          {/* App Title & Logo */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                isHighContrast ? "bg-yellow-400 text-black" : "bg-white text-blue-700"
              }`}
            >
              시
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none flex items-center gap-1">
                시니어 케어
                <Heart className="w-4 h-4 text-red-300 fill-red-400 inline" />
              </h1>
              <p className="text-[11px] opacity-90 font-medium mt-0.5">
                어르신 올인원 케어 도우미
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            {/* Senior Profile Trigger Button */}
            <button
              id="btn-header-profile-trigger"
              onClick={onOpenProfileModal}
              className={`px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-sm border ${
                isHighContrast
                  ? "bg-yellow-400 text-black border-black"
                  : "bg-amber-500 hover:bg-amber-600 text-white border-amber-300"
              }`}
              title="어르신 건강 프로필 보기 및 수정"
            >
              <User className="w-4 h-4" />
              <span>건강 프로필</span>
            </button>

            {/* Font Size Toggle Button */}
            <button
              id="btn-font-size-toggle"
              onClick={cycleFontSize}
              className={`p-1.5 rounded-xl font-bold text-xs flex items-center justify-center transition-transform active:scale-95 shadow-sm border ${
                isHighContrast
                  ? "bg-yellow-400 text-black border-black"
                  : "bg-blue-700 hover:bg-blue-800 text-white border-blue-400"
              }`}
              title="글씨 크기 변경"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* High Contrast Mode Toggle */}
            <button
              id="btn-contrast-toggle"
              onClick={() => setIsHighContrast(!isHighContrast)}
              className={`p-1.5 rounded-xl text-xs flex items-center justify-center transition-transform active:scale-95 shadow-sm ${
                isHighContrast
                  ? "bg-white text-black"
                  : "bg-blue-700 text-white hover:bg-blue-800 border border-blue-400"
              }`}
              title="고대비 모드"
            >
              {isHighContrast ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Voice Guidance Toggle */}
            <button
              id="btn-voice-toggle"
              onClick={() => setIsVoiceGuidanceOn(!isVoiceGuidanceOn)}
              className={`p-1.5 rounded-xl text-xs flex items-center justify-center transition-transform active:scale-95 shadow-sm ${
                isVoiceGuidanceOn
                  ? isHighContrast
                    ? "bg-yellow-300 text-black font-bold"
                    : "bg-emerald-600 text-white border border-emerald-400"
                  : "bg-gray-400 text-gray-100"
              }`}
              title={isVoiceGuidanceOn ? "음성 안내 켜짐" : "음성 안내 꺼짐"}
            >
              {isVoiceGuidanceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Emergency / Help Button */}
            <button
              id="btn-help-modal-trigger"
              onClick={() => setShowHelpModal(true)}
              className="p-1.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-transform active:scale-95 shadow-sm border border-red-400"
              title="도움말 및 긴급 연락"
            >
              <PhoneCall className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Health Profile Mini Summary Sub-Bar */}
        <button
          id="btn-header-profile-subbar"
          onClick={onOpenProfileModal}
          className={`w-full py-1 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all active:scale-98 ${
            isHighContrast
              ? "bg-yellow-400/20 border-yellow-400 text-yellow-300"
              : "bg-blue-700/80 border-blue-500 hover:bg-blue-700 text-blue-50"
          }`}
        >
          <div className="flex items-center space-x-1.5 truncate">
            <Activity className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">
              {seniorProfile.age}세 · {seniorProfile.height}cm/{seniorProfile.weight}kg · 보유질환:{" "}
              {seniorProfile.diseases && seniorProfile.diseases.length > 0
                ? seniorProfile.diseases.join(", ")
                : "미선택"}
            </span>
          </div>
          <span className="text-[10px] font-black underline shrink-0 ml-2">
            수정 ⚙️
          </span>
        </button>
      </div>

      {/* Emergency Help Modal */}
      {showHelpModal && (
        <div
          id="modal-emergency-help"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 ${
              isHighContrast ? "bg-black text-yellow-300 border-2 border-yellow-400" : "bg-white text-gray-900"
            }`}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
                <Info className="w-6 h-6" />
                도움말 & 도우미
              </h2>
              <button
                id="btn-close-help-modal"
                onClick={() => setShowHelpModal(false)}
                className="text-2xl font-bold px-2 py-1 rounded-full text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <p className="text-sm font-bold text-gray-700 leading-relaxed">
              도우미 호출 버튼을 통해 등록된 보호자에게 즉시 전화 연결을 하실 수 있습니다.
            </p>

            {/* Save Message Notification */}
            {saveMessage && (
              <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-xs rounded-xl text-center">
                {saveMessage}
              </div>
            )}

            {/* Section 1: Registered Guardian Call & Registration */}
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  보호자(도우미) 전화 연결:
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingGuardian(!isEditingGuardian)}
                  className="text-xs font-black text-emerald-700 underline hover:text-emerald-900"
                >
                  {isEditingGuardian ? "접기" : "번호 수정/등록 ⚙️"}
                </button>
              </div>

              {/* Big Guardian Call Button */}
              {seniorProfile.guardianPhone || guardianPhone ? (
                <a
                  href={`tel:${seniorProfile.guardianPhone || guardianPhone}`}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-md active:scale-95 text-center border border-emerald-400"
                >
                  <Phone className="w-5 h-5 text-emerald-100 animate-pulse" />
                  <span>
                    {seniorProfile.guardianName || guardianName || "보호자"} 호출 ({seniorProfile.guardianPhone || guardianPhone})
                  </span>
                </a>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 text-center">
                  등록된 보호자 번호가 없습니다. 아래에서 입력해주세요.
                </div>
              )}

              {/* Guardian Phone Registration Form */}
              {(isEditingGuardian || !seniorProfile.guardianPhone) && (
                <form
                  onSubmit={handleSaveGuardian}
                  className="space-y-2 pt-2 border-t border-emerald-200"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-extrabold text-emerald-900 block mb-1">
                        보호자 관계/이름:
                      </label>
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder="예: 딸, 아들, 도우미"
                        className="w-full p-2 bg-white border border-emerald-300 rounded-xl text-xs font-extrabold text-gray-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-emerald-900 block mb-1">
                        보호자 전화번호:
                      </label>
                      <input
                        type="tel"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full p-2 bg-white border border-emerald-300 rounded-xl text-xs font-extrabold text-gray-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 hover:bg-emerald-800 active:scale-98 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>보호자 번호 등록 및 저장</span>
                  </button>
                </form>
              )}
            </div>

            {/* Section 2: Emergency 119 (Large & Prominent) */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-extrabold text-gray-500 block">
                🚨 긴급 응급 상황 신고:
              </span>
              <a
                href="tel:119"
                className="w-full py-4 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xl sm:text-2xl flex items-center justify-center gap-3 shadow-lg active:scale-95 text-center border-2 border-red-400"
              >
                <PhoneCall className="w-7 h-7 text-white animate-bounce" />
                <span>🚨 긴급 119 바로 연결</span>
              </a>
            </div>

            <button
              id="btn-dismiss-help-modal"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3 bg-gray-200 text-gray-800 font-bold rounded-2xl text-base mt-2"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

