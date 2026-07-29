import React, { useState, useEffect } from "react";
import { CalendarEvent, FontSizeLevel, SeniorProfile } from "../types";
import { SeniorSpeechRecognizer, speakText, stopSpeaking } from "../lib/speech";
import {
  Mic,
  MicOff,
  Calendar as CalendarIcon,
  Volume2,
  Trash2,
  Sparkles,
  MapPin,
  Clock,
  AlertCircle,
  Bell,
  BellRing,
  Info,
  CalendarCheck,
} from "lucide-react";

interface VoiceMemoCalendarProps {
  fontSizeLevel: FontSizeLevel;
  isHighContrast: boolean;
  seniorProfile: SeniorProfile;
  events: CalendarEvent[];
  onAddEvent: (evt: Omit<CalendarEvent, "id">) => void;
  onDeleteEvent: (evtId: string) => void;
}

export const VoiceMemoCalendar: React.FC<VoiceMemoCalendarProps> = ({
  fontSizeLevel,
  isHighContrast,
  seniorProfile,
  events,
  onAddEvent,
  onDeleteEvent,
}) => {
  const [memoText, setMemoText] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [parsingLoading, setParsingLoading] = useState<boolean>(false);

  // Default Selected Date: 2026-07-28 (Today)
  const todayStr = "2026-07-28";
  const tomorrowStr = "2026-07-29";
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [activeVoiceEventId, setActiveVoiceEventId] = useState<string | null>(null);

  const recognizerRef = React.useRef<SeniorSpeechRecognizer | null>(null);

  useEffect(() => {
    recognizerRef.current = new SeniorSpeechRecognizer();
  }, []);

  // Handle Speech Recognition Toggle
  const toggleRecording = () => {
    if (isRecording) {
      recognizerRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!recognizerRef.current?.isSupported) {
        alert(
          "이 브라우저/환경에서는 마이크 직접 음성 인식이 제한됩니다. 아래 직접 입력이나 예시 문구를 이용해주세요!"
        );
        return;
      }

      setIsRecording(true);
      recognizerRef.current.start(
        (transcript, isFinal) => {
          setMemoText(transcript);
          if (isFinal) {
            setIsRecording(false);
          }
        },
        (err) => {
          console.error(err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );
    }
  };

  // Quick Sample Voice Memo Selection
  const handleSelectSampleMemo = (sampleText: string) => {
    setMemoText(sampleText);
    handleParseVoiceMemo(sampleText);
  };

  // Parse Voice Memo with Gemini Server API
  const handleParseVoiceMemo = async (textToParse?: string) => {
    const targetText = textToParse || memoText;
    if (!targetText.trim()) return;

    setParsingLoading(true);
    stopSpeaking();

    try {
      const res = await fetch("/api/parse-voice-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memoText: targetText,
          currentDate: todayStr,
          seniorProfile,
        }),
      });

      if (!res.ok) throw new Error("일정 해석에 실패했습니다.");

      const parsed: any = await res.json();

      const newEvt: Omit<CalendarEvent, "id"> = {
        title: parsed.title || "어르신 중요한 일정",
        date: parsed.date || selectedDateStr,
        time: parsed.time || "10:00",
        category: (parsed.category as any) || "병원",
        location: parsed.location || "지정장소",
        seniorVoiceSummary:
          parsed.seniorVoiceSummary ||
          `어르신, ${parsed.title} 일정이 달력에 등록되었습니다. 전날과 당일에 알려드립니다.`,
        reminderTips: parsed.reminderTips || "일정을 잊지 않도록 미리 챙기세요!",
        completed: false,
      };

      onAddEvent(newEvt);
      setSelectedDateStr(newEvt.date);

      // Play voice confirmation audio
      speakText({
        text: `${newEvt.seniorVoiceSummary} (전날 및 당일 음성 알림이 자동으로 설정되었습니다)`,
        rate: 0.85,
      });

      setMemoText("");
    } catch (err: any) {
      console.error(err);
      alert("음성 메모를 일정으로 해석하지 못했습니다.");
    } finally {
      setParsingLoading(false);
    }
  };

  // Speak Event Schedule Out Loud
  const handlePlayEventVoice = (evt: CalendarEvent) => {
    if (activeVoiceEventId === evt.id) {
      stopSpeaking();
      setActiveVoiceEventId(null);
    } else {
      stopSpeaking();
      setActiveVoiceEventId(evt.id);
      speakText({
        text: `${evt.seniorVoiceSummary} 시간은 ${evt.time}입니다. 준비물 및 참고사항: ${
          evt.reminderTips || "없음"
        }. 전날과 당일 아침에 음성으로 잊지 않게 미리 알려드립니다.`,
        onStart: () => setActiveVoiceEventId(evt.id),
        onEnd: () => setActiveVoiceEventId(null),
        onError: () => setActiveVoiceEventId(null),
      });
    }
  };

  // Compute Today (D-Day) and Tomorrow (D-1) Events for Senior Reminders
  const todayEvents = events.filter((e) => e.date === todayStr);
  const tomorrowEvents = events.filter((e) => e.date === tomorrowStr);
  const upcomingNoticeEvents = [...todayEvents, ...tomorrowEvents];

  // Play All Today & Tomorrow Reminders Voice
  const handlePlayAllUpcomingReminders = () => {
    stopSpeaking();
    if (upcomingNoticeEvents.length === 0) {
      speakText({ text: "어르신! 오늘과 내일 예정된 일정이 없습니다. 편안한 하루 보내세요!" });
      return;
    }

    let speech = `어르신, 일정 안내입니다. `;
    if (todayEvents.length > 0) {
      speech += `오늘 예정된 일정이 ${todayEvents.length}건 있습니다. `;
      todayEvents.forEach((e) => {
        speech += `${e.title}, 시간은 ${e.time}입니다. `;
      });
    }
    if (tomorrowEvents.length > 0) {
      speech += `내일 예정된 일정이 ${tomorrowEvents.length}건 있습니다. `;
      tomorrowEvents.forEach((e) => {
        speech += `${e.title}, 시간은 ${e.time}입니다. `;
      });
    }

    speakText({ text: speech, rate: 0.85 });
  };

  // Get Calendar Events for Selected Date
  const selectedDateEvents = events.filter((e) => e.date === selectedDateStr);

  return (
    <div className="space-y-6 pb-24">
      {/* Title Header */}
      <div
        className={`p-5 rounded-3xl shadow-sm border ${
          isHighContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-purple-50 border-purple-200 text-gray-900"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-sm">
            <Mic className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              4. 음성 메모 & 일정 달력
            </h2>
            <p className="text-sm font-semibold opacity-80 mt-0.5">
              말씀만 하시면 달력에 등록되고, 전날과 당일에 미리 알려드립니다
            </p>
          </div>
        </div>
      </div>

      {/* D-1 & D-Day Senior Reminder Banner */}
      <div className="p-5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-3xl shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-7 h-7 text-yellow-300 animate-bounce" />
            <h3 className="font-black text-xl">어르신 전날 & 당일 일정 알리미</h3>
          </div>
          <button
            id="btn-play-all-reminders"
            onClick={handlePlayAllUpcomingReminders}
            className="px-3.5 py-2 bg-yellow-400 text-purple-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Volume2 className="w-4 h-4" />
            <span>오늘/내일 일정 음성 듣기</span>
          </button>
        </div>

        {upcomingNoticeEvents.length === 0 ? (
          <p className="font-bold text-sm text-purple-100 bg-white/10 p-3 rounded-2xl border border-white/20">
            💡 등록된 일정이 없습니다. 아래에서 말씀하시거나 입력하여 달력에 새 일정을 추가하세요!
          </p>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((e) => (
              <div key={e.id} className="p-3 bg-yellow-300/20 rounded-2xl border border-yellow-300/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-black rounded-lg">
                    🔔 오늘 당일 알림
                  </span>
                  <span className="font-black text-base">{e.title} ({e.time})</span>
                </div>
              </div>
            ))}
            {tomorrowEvents.map((e) => (
              <div key={e.id} className="p-3 bg-white/20 rounded-2xl border border-white/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-400 text-purple-950 text-xs font-black rounded-lg">
                    🔔 내일 전날 알림
                  </span>
                  <span className="font-black text-base">{e.title} ({e.time})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Recorder & Memo Input Box */}
      <div
        className={`p-6 rounded-3xl border-2 shadow-lg space-y-4 ${
          isHighContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-white border-purple-300 text-gray-900"
        }`}
      >
        <h3 className="font-black text-xl text-purple-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          음성으로 새 일정 등록하기
        </h3>

        {/* Big Mic Button & Text Area */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <button
              id="btn-toggle-voice-record"
              onClick={toggleRecording}
              className={`p-5 rounded-full shadow-xl transition-all duration-300 active:scale-95 shrink-0 ${
                isRecording
                  ? "bg-red-600 text-white animate-pulse ring-8 ring-red-200"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
              title="음성 녹음 시작 / 멈춤"
            >
              {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>

            <div className="flex-1">
              <input
                type="text"
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="예: '내일 오후 2시에 서울아산병원 가야 돼'"
                className="w-full p-4 rounded-2xl border-2 border-purple-200 font-extrabold text-lg focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            id="btn-parse-voice-memo"
            onClick={() => handleParseVoiceMemo()}
            disabled={parsingLoading || !memoText.trim()}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xl rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-6 h-6" />
            <span>
              {parsingLoading ? "일정을 분석하여 달력에 저장 중..." : "달력 일정으로 저장하기"}
            </span>
          </button>
        </div>
      </div>

      {/* Senior Calendar & Events Section */}
      <div
        className={`p-5 rounded-3xl border shadow-md space-y-4 ${
          isHighContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-white border-purple-200 text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-7 h-7 text-purple-600" />
            <h3 className="font-black text-2xl">어르신 큰글씨 달력</h3>
          </div>
          <span className="px-3 py-1 bg-purple-100 text-purple-900 rounded-full font-black text-xs">
            2026년 7월 / 8월
          </span>
        </div>

        {/* Date Selector Chips */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {[
            { date: "2026-07-27", day: "월", num: "27일" },
            { date: "2026-07-28", day: "화", num: "28일 (오늘)" },
            { date: "2026-07-29", day: "수", num: "29일" },
            { date: "2026-07-30", day: "목", num: "30일" },
            { date: "2026-07-31", day: "금", num: "31일" },
            { date: "2026-08-01", day: "토", num: "1일" },
          ].map((d) => {
            const isSelected = selectedDateStr === d.date;
            const hasEvent = events.some((e) => e.date === d.date);

            return (
              <button
                key={d.date}
                onClick={() => setSelectedDateStr(d.date)}
                className={`p-3 rounded-2xl flex flex-col items-center min-w-[80px] border-2 transition-transform active:scale-95 ${
                  isSelected
                    ? "bg-purple-600 text-white border-purple-800 shadow-lg scale-105"
                    : "bg-gray-50 border-gray-200 text-gray-800 hover:bg-purple-50"
                }`}
              >
                <span className="text-xs font-extrabold opacity-80">{d.day}</span>
                <span className="text-lg font-black">{d.num}</span>
                {hasEvent && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1 shadow-xs animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Event Cards */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-extrabold text-lg text-purple-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-purple-600" />
              {selectedDateStr} 일정 ({selectedDateEvents.length}건)
            </span>
          </div>

          {selectedDateEvents.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300 space-y-2">
              <CalendarIcon className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="font-black text-lg text-gray-600">
                선택하신 날짜({selectedDateStr})에 등록된 일정이 없습니다.
              </p>
              <p className="text-xs font-bold text-gray-500">
                상단의 마이크 버튼을 눌러 음성으로 등록해보세요!
              </p>
            </div>
          ) : (
            selectedDateEvents.map((evt) => {
              const isToday = evt.date === todayStr;
              const isTomorrow = evt.date === tomorrowStr;

              return (
                <div
                  key={evt.id}
                  className={`p-5 rounded-3xl border-2 shadow-md space-y-3 ${
                    isHighContrast
                      ? "bg-black border-yellow-400 text-yellow-300"
                      : "bg-purple-50/70 border-purple-300 text-gray-900"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-xs font-black">
                          {evt.category}
                        </span>

                        {isToday && (
                          <span className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-black animate-pulse flex items-center gap-1">
                            <Bell className="w-3.5 h-3.5" /> 당일 알림
                          </span>
                        )}

                        {isTomorrow && (
                          <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-black flex items-center gap-1">
                            <Bell className="w-3.5 h-3.5" /> 전날 알림
                          </span>
                        )}

                        <span className="px-2 py-1 bg-purple-100 text-purple-900 rounded-lg text-xs font-bold">
                          🔔 전날 & 당일 자동 알림 예약
                        </span>
                      </div>

                      <h4 className="text-2xl font-black text-purple-950 tracking-tight pt-1">
                        {evt.title}
                      </h4>

                      <div className="flex items-center space-x-3 text-sm font-bold text-gray-700">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-purple-600" />
                          {evt.time}
                        </span>
                        {evt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-red-500" />
                            {evt.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteEvent(evt.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-xl active:scale-95"
                      title="일정 삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Voice Summary Audio Player Card */}
                  <div className="p-3.5 bg-white rounded-2xl border border-purple-200 space-y-2">
                    <p className="font-extrabold text-base text-purple-950">
                      🗣️ {evt.seniorVoiceSummary}
                    </p>
                    {evt.reminderTips && (
                      <p className="text-xs font-bold text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        준비물 팁: {evt.reminderTips}
                      </p>
                    )}

                    <button
                      id={`btn-play-event-voice-${evt.id}`}
                      onClick={() => handlePlayEventVoice(evt)}
                      className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 ${
                        activeVoiceEventId === evt.id
                          ? "bg-red-600 text-white"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      }`}
                    >
                      <Volume2 className="w-5 h-5" />
                      <span>
                        {activeVoiceEventId === evt.id
                          ? "음성 읽기 중지"
                          : "목소리로 일정 다시 들려주기"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
