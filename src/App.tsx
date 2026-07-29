import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Navigation, NavTab } from "./components/Navigation";
import { DocumentReader } from "./components/DocumentReader";
import { MedicationAlarm } from "./components/MedicationAlarm";
import { DietRecommendation } from "./components/DietRecommendation";
import { VoiceMemoCalendar } from "./components/VoiceMemoCalendar";
import { SeniorProfileModal } from "./components/SeniorProfileModal";
import {
  CalendarEvent,
  FontSizeLevel,
  MedicationItem,
  SeniorProfile,
} from "./types";
import {
  INITIAL_CALENDAR_EVENTS,
  INITIAL_MEDICATIONS,
  DEFAULT_SENIOR_PROFILE,
} from "./data/sampleData";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      const saved = localStorage.getItem("senior_care_active_tab");
      if (saved) return saved as NavTab;
    } catch (e) {
      console.error(e);
    }
    return "document";
  });

  const [fontSizeLevel, setFontSizeLevel] = useState<FontSizeLevel>("large"); // Default large for senior comfort
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [isVoiceGuidanceOn, setIsVoiceGuidanceOn] = useState<boolean>(true);

  // Senior Health Profile State
  const [seniorProfile, setSeniorProfile] = useState<SeniorProfile>(() => {
    try {
      const saved = localStorage.getItem("senior_care_profile");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SENIOR_PROFILE;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Central States with LocalStorage Persistence
  const [medications, setMedications] = useState<MedicationItem[]>(() => {
    try {
      const saved = localStorage.getItem("senior_care_medications");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MEDICATIONS;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem("senior_care_events");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CALENDAR_EVENTS;
  });

  // Auto open health profile modal on first visit
  useEffect(() => {
    try {
      const visited = localStorage.getItem("senior_care_profile_visited");
      if (!visited) {
        setIsProfileModalOpen(true);
        localStorage.setItem("senior_care_profile_visited", "true");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save changes to localStorage so data persists across tab/window switches and reloads
  useEffect(() => {
    try {
      localStorage.setItem("senior_care_active_tab", activeTab);
    } catch (e) {
      console.error(e);
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem("senior_care_medications", JSON.stringify(medications));
    } catch (e) {
      console.error(e);
    }
  }, [medications]);

  useEffect(() => {
    try {
      localStorage.setItem("senior_care_events", JSON.stringify(calendarEvents));
    } catch (e) {
      console.error(e);
    }
  }, [calendarEvents]);

  // Helper to parse medications strictly from senior profile
  const parseMedsFromProfile = (currentMedsText: string): MedicationItem[] => {
    if (!currentMedsText || !currentMedsText.trim()) return [];
    const medNames = currentMedsText
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    return medNames.map((name, idx) => {
      let times = ["08:30"];
      let freq = 1;
      if (
        name.includes("3회") ||
        name.includes("3번") ||
        name.includes("세번") ||
        name.includes("삼회") ||
        (name.includes("아침") && name.includes("점심") && name.includes("저녁")) ||
        (name.includes("아침") && name.includes("점심"))
      ) {
        times = ["08:30", "12:30", "18:30"]; // 3회: 아침, 점심, 저녁
        freq = 3;
      } else if (
        name.includes("2회") ||
        name.includes("2번") ||
        name.includes("두번") ||
        name.includes("이회") ||
        (name.includes("아침") && name.includes("저녁"))
      ) {
        times = ["08:30", "18:30"]; // 2회: 아침, 저녁
        freq = 2;
      } else if (name.includes("점심")) {
        times = ["12:30"];
        freq = 1;
      } else if (name.includes("저녁") || name.includes("취침")) {
        times = ["18:30"];
        freq = 1;
      } else if (name.includes("아침")) {
        times = ["08:30"];
        freq = 1;
      } else {
        times = ["18:30"]; // 1회 기본: 저녁 식후 (18:30)
        freq = 1;
      }

      const takenObj: Record<string, boolean> = {};
      times.forEach((t) => {
        takenObj[t] = false;
      });

      return {
        id: `med-profile-${Date.now()}-${idx}`,
        name,
        dosage: "1알",
        frequencyPerDay: freq,
        timesOfDay: times,
        days: 30,
        note: freq === 3 ? "아침, 점심, 저녁 식후 30분" : freq === 2 ? "아침, 저녁 식후 30분" : "식후 30분 복용",
        cautions: ["규칙적으로 복용하세요"],
        takenToday: takenObj,
        createdAt: new Date().toISOString().split("T")[0],
      };
    });
  };

  const handleSaveSeniorProfile = (updated: SeniorProfile) => {
    setSeniorProfile(updated);
    try {
      localStorage.setItem("senior_care_profile", JSON.stringify(updated));
      localStorage.setItem("senior_care_profile_visited", "true");
    } catch (e) {
      console.error(e);
    }

    // Sync medications with profile's currentMeds
    if (updated.currentMeds && updated.currentMeds.trim()) {
      const profileMeds = parseMedsFromProfile(updated.currentMeds);
      setMedications(profileMeds);
    } else {
      // If currentMeds was cleared or emptied in profile, clear medications in Feature #2
      setMedications([]);
    }
  };

  const handleResetSeniorProfile = () => {
    const emptyProfile: SeniorProfile = {
      height: "",
      weight: "",
      age: "",
      diseases: [],
      currentMeds: "",
      surgeryHistory: "",
      allergies: "",
      guardianName: "",
      guardianPhone: "",
    };
    try {
      localStorage.setItem("senior_care_profile", JSON.stringify(emptyProfile));
      localStorage.setItem("senior_care_profile_visited", "true");
      localStorage.setItem("senior_care_medications", JSON.stringify([]));
      localStorage.setItem("senior_care_events", JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
    setSeniorProfile(emptyProfile);
    setMedications([]); // Reset medications in Feature #2
    setCalendarEvents([]);
    setIsProfileModalOpen(true);
  };

  // Add Medication Items from OCR or Modal
  const handleAddMedications = (
    newMeds: Omit<MedicationItem, "id" | "createdAt">[]
  ) => {
    const formatted = newMeds.map((m, idx) => ({
      ...m,
      id: `med-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString().split("T")[0],
    }));

    setMedications((prev) => [...formatted, ...prev]);
  };

  const handleAddSingleMedication = (
    med: Omit<MedicationItem, "id" | "createdAt">
  ) => {
    handleAddMedications([med]);
  };

  const handleDeleteMedication = (medId: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== medId));
  };

  const handleToggleTaken = (medId: string, timeSlot: string) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          return {
            ...m,
            takenToday: {
              ...m.takenToday,
              [timeSlot]: !m.takenToday[timeSlot],
            },
          };
        }
        return m;
      })
    );
  };

  // Add & Delete Calendar Events
  const handleAddCalendarEvent = (evt: Omit<CalendarEvent, "id">) => {
    const newEvt: CalendarEvent = {
      ...evt,
      id: `evt-${Date.now()}`,
    };
    setCalendarEvents((prev) => [newEvt, ...prev]);
  };

  const handleDeleteCalendarEvent = (evtId: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== evtId));
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-200 ${
        isHighContrast
          ? "bg-black text-yellow-300"
          : "bg-amber-50/40 text-gray-900"
      }`}
    >
      {/* Top Senior Header Bar */}
      <Header
        fontSizeLevel={fontSizeLevel}
        setFontSizeLevel={setFontSizeLevel}
        isHighContrast={isHighContrast}
        setIsHighContrast={setIsHighContrast}
        isVoiceGuidanceOn={isVoiceGuidanceOn}
        setIsVoiceGuidanceOn={setIsVoiceGuidanceOn}
        seniorProfile={seniorProfile}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onSaveProfile={handleSaveSeniorProfile}
      />

      {/* Senior Health Profile Modal */}
      <SeniorProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={seniorProfile}
        onSaveProfile={handleSaveSeniorProfile}
        onResetProfile={handleResetSeniorProfile}
        isHighContrast={isHighContrast}
      />

      {/* Main Content View Frame */}
      <main className="max-w-md mx-auto px-4 py-5">
        {activeTab === "document" && (
          <DocumentReader
            fontSizeLevel={fontSizeLevel}
            isHighContrast={isHighContrast}
            seniorProfile={seniorProfile}
            onAddMedication={handleAddMedications}
            onNavigateToAlarm={() => setActiveTab("alarm")}
          />
        )}

        {activeTab === "alarm" && (
          <MedicationAlarm
            fontSizeLevel={fontSizeLevel}
            isHighContrast={isHighContrast}
            medications={medications}
            onToggleTaken={handleToggleTaken}
            onAddMedication={handleAddSingleMedication}
            onDeleteMedication={handleDeleteMedication}
          />
        )}

        {activeTab === "diet" && (
          <DietRecommendation
            fontSizeLevel={fontSizeLevel}
            isHighContrast={isHighContrast}
            seniorProfile={seniorProfile}
          />
        )}

        {activeTab === "memo" && (
          <VoiceMemoCalendar
            fontSizeLevel={fontSizeLevel}
            isHighContrast={isHighContrast}
            seniorProfile={seniorProfile}
            events={calendarEvents}
            onAddEvent={handleAddCalendarEvent}
            onDeleteEvent={handleDeleteCalendarEvent}
          />
        )}
      </main>

      {/* Bottom Senior Mobile Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isHighContrast={isHighContrast}
        alarmBadgeCount={medications.length}
      />
    </div>
  );
}
