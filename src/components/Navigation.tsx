import React from "react";
import { FileText, Pill, UtensilsCrossed, Mic } from "lucide-react";

export type NavTab = "document" | "alarm" | "diet" | "memo";

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isHighContrast: boolean;
  alarmBadgeCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isHighContrast,
  alarmBadgeCount = 0,
}) => {
  const tabs = [
    {
      id: "document" as NavTab,
      label: "글 읽기",
      subLabel: "처방전 요약",
      icon: FileText,
      color: "bg-amber-500",
    },
    {
      id: "alarm" as NavTab,
      label: "약 알림",
      subLabel: "복용 체크",
      icon: Pill,
      color: "bg-blue-500",
      badge: alarmBadgeCount,
    },
    {
      id: "diet" as NavTab,
      label: "맞춤 식단",
      subLabel: "건강 밥상",
      icon: UtensilsCrossed,
      color: "bg-emerald-500",
    },
    {
      id: "memo" as NavTab,
      label: "음성 메모",
      subLabel: "달력·일정",
      icon: Mic,
      color: "bg-purple-500",
    },
  ];

  return (
    <nav
      id="bottom-app-navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 w-full border-t shadow-2xl backdrop-blur-md ${
        isHighContrast
          ? "bg-black border-yellow-400 text-yellow-300"
          : "bg-white/95 border-amber-200 text-gray-700"
      }`}
    >
      <div className="max-w-md mx-auto grid grid-cols-4 px-1 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 min-h-[64px] active:scale-95 ${
                isActive
                  ? isHighContrast
                    ? "bg-yellow-400 text-black font-extrabold shadow-md"
                    : "bg-amber-100 text-amber-900 font-extrabold shadow-sm"
                  : "hover:bg-amber-50/50 opacity-80"
              }`}
            >
              {/* Badge for alarm or alerts */}
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute top-1.5 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                  {tab.badge}
                </span>
              ) : null}

              <div
                className={`p-1.5 rounded-xl mb-0.5 transition-transform ${
                  isActive ? "scale-110" : ""
                }`}
              >
                <Icon
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${
                    isActive
                      ? isHighContrast
                        ? "text-black"
                        : "text-amber-700"
                      : "text-gray-500"
                  }`}
                />
              </div>

              <span className="text-xs sm:text-sm font-bold tracking-tight leading-none">
                {tab.label}
              </span>
              <span className="text-[10px] sm:text-xs opacity-75 font-normal mt-0.5">
                {tab.subLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
