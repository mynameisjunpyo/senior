import React, { useState, useRef } from "react";
import {
  FontSizeLevel,
  MedicationItem,
  OCRResult,
  SeniorProfile,
} from "../types";
import { speakText, stopSpeaking } from "../lib/speech";
import {
  Camera,
  Image as ImageIcon,
  Volume2,
  Square,
  Sparkles,
  Pill,
  AlertTriangle,
  FileCheck,
  RotateCcw,
  Plus,
  Sliders,
  FileText,
  BookOpen,
} from "lucide-react";

interface DocumentReaderProps {
  fontSizeLevel: FontSizeLevel;
  isHighContrast: boolean;
  seniorProfile: SeniorProfile;
  onAddMedication: (meds: Omit<MedicationItem, "id" | "createdAt">[]) => void;
  onNavigateToAlarm: () => void;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  fontSizeLevel,
  isHighContrast,
  seniorProfile,
  onAddMedication,
  onNavigateToAlarm,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [rawText, setRawText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // TTS State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.85); // slower for seniors

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Text size style resolver
  const getTextClass = () => {
    if (fontSizeLevel === "normal") return "text-lg leading-relaxed";
    if (fontSizeLevel === "large") return "text-2xl leading-loose font-bold";
    return "text-3xl leading-loose font-extrabold";
  };

  // Start Camera Stream
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setIsCameraActive(false);
      setErrorMsg("카메라를 켤 수 없습니다. 갤러리에서 사진을 선택해보세요.");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture Snapshot from Camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setSelectedImage(dataUrl);
      setMimeType("image/jpeg");
      stopCamera();
      processImageOCR(dataUrl, "image/jpeg");
    }
  };

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setMimeType(file.type || "image/jpeg");
        processImageOCR(result, file.type || "image/jpeg");
      };
      reader.readAsDataURL(file);
    }
  };

  // Send Image to Server Gemini API
  const processImageOCR = async (base64Img: string, mime: string) => {
    setLoading(true);
    setErrorMsg(null);
    setOcrResult(null);
    stopSpeaking();
    setIsPlayingAudio(false);

    try {
      const res = await fetch("/api/ocr-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Img,
          mimeType: mime,
          seniorProfile,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "글자 인식 처리에 실패했습니다.");
      }

      const data: OCRResult = await res.json();
      setOcrResult(data);

      // Auto play audio summary if needed
      speakSummaryText(data.seniorSummary);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "글자를 인식하는데 문제가 생겼습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Send Raw Text to Server Gemini API
  const processTextOCR = async (text: string) => {
    setLoading(true);
    setErrorMsg(null);
    setOcrResult(null);
    stopSpeaking();
    setIsPlayingAudio(false);

    try {
      const res = await fetch("/api/ocr-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text, seniorProfile }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "요약 처리에 실패했습니다.");
      }

      const data: OCRResult = await res.json();
      setOcrResult(data);

      // Auto play audio summary
      speakSummaryText(data.seniorSummary);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "요약글을 생성하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // TTS Speech Helper
  const speakSummaryText = (text: string) => {
    speakText({
      text,
      rate: speechRate,
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else if (ocrResult?.seniorSummary) {
      speakSummaryText(ocrResult.seniorSummary);
    }
  };

  // Register Detected Medications to Alarm List
  const handleRegisterAlarms = () => {
    if (!ocrResult || !ocrResult.detectedMedications.length) return;

    const newMeds = ocrResult.detectedMedications.map((med) => {
      const freq = med.frequencyPerDay || 1;
      let times: string[] = ["18:30"];
      if (freq === 3) {
        times = ["08:30", "12:30", "18:30"];
      } else if (freq === 2) {
        times = ["08:30", "18:30"];
      } else if (freq === 1) {
        times = ["18:30"];
      } else if (med.timesOfDay && med.timesOfDay.length > 0) {
        times = med.timesOfDay.map((t) => {
          if (t.includes("아침")) return "08:30";
          if (t.includes("점심")) return "12:30";
          if (t.includes("저녁")) return "18:30";
          return t;
        });
      }

      const takenObj: Record<string, boolean> = {};
      times.forEach((t) => {
        takenObj[t] = false;
      });

      return {
        name: med.name,
        dosage: med.dosage || "1알",
        frequencyPerDay: freq,
        timesOfDay: times,
        days: med.days || 3,
        note: med.note || (freq === 3 ? "아침, 점심, 저녁 식후 30분" : freq === 2 ? "아침, 저녁 식후 30분" : "식후 30분 복용"),
        cautions: ocrResult.warnings || ["규칙적으로 복용"],
        takenToday: takenObj,
      };
    });

    onAddMedication(newMeds);
    alert(`어르신! 처방약 (${newMeds.length}건)이 [2. 약 복용 알림]에 정상적으로 추가되었습니다.`);
    onNavigateToAlarm();
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Title Header */}
      <div
        className={`p-5 rounded-3xl shadow-sm border ${
          isHighContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-amber-50 border-amber-200 text-gray-900"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              1. 어려운 문서 & 설명서 쉬운 요약
            </h2>
            <p className="text-sm font-semibold opacity-80 mt-0.5">
              약 설명서, 사용설명서, 병원/공공기관 안내문을 촬영하면 쉬운 말과 큰 글씨로 요약해 드려요
            </p>
          </div>
        </div>
      </div>

      {/* Camera & Photo Upload Action Buttons */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Camera Shot Button */}
          <button
            id="btn-open-camera"
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`py-4 px-3 rounded-2xl font-extrabold text-base sm:text-lg flex flex-col items-center justify-center gap-2 border-2 shadow-md transition-transform active:scale-95 ${
              isCameraActive
                ? "bg-red-600 border-red-700 text-white"
                : isHighContrast
                ? "bg-yellow-400 border-yellow-300 text-black"
                : "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white"
            }`}
          >
            <Camera className="w-8 h-8" />
            <span>{isCameraActive ? "카메라 닫기" : "카메라 촬영"}</span>
          </button>

          {/* Gallery Upload Button */}
          <button
            id="btn-open-gallery"
            onClick={() => fileInputRef.current?.click()}
            className={`py-4 px-3 rounded-2xl font-extrabold text-base sm:text-lg flex flex-col items-center justify-center gap-2 border-2 shadow-md transition-transform active:scale-95 ${
              isHighContrast
                ? "bg-black border-yellow-400 text-yellow-300"
                : "bg-white hover:bg-amber-50 border-amber-300 text-amber-900"
            }`}
          >
            <ImageIcon className="w-8 h-8 text-amber-600" />
            <span>갤러리에서 선택</span>
          </button>
        </div>

        {/* File Input (Hidden) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Reset / Select Again Button (Shown ONLY after camera/photo selection) */}
        {(selectedImage !== null || ocrResult !== null || isCameraActive || rawText !== "") && (
          <button
            id="btn-reset-ocr"
            onClick={() => {
              stopCamera();
              setSelectedImage(null);
              setOcrResult(null);
              setRawText("");
              stopSpeaking();
              setIsPlayingAudio(false);
            }}
            className={`w-full py-3 px-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 border-2 shadow-sm transition-transform active:scale-95 ${
              isHighContrast
                ? "bg-yellow-400 text-black border-yellow-500"
                : "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950"
            }`}
          >
            <RotateCcw className="w-5 h-5 text-amber-800" />
            <span>사진/문서 다시 선택하기</span>
          </button>
        )}
      </div>

      {/* Live Camera Viewfinder Modal/Area */}
      {isCameraActive && (
        <div className="relative rounded-3xl overflow-hidden border-4 border-amber-500 shadow-2xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              id="btn-take-snapshot"
              onClick={capturePhoto}
              className="py-3 px-8 bg-amber-500 text-white font-extrabold text-xl rounded-full shadow-2xl border-2 border-white flex items-center gap-2 active:scale-95"
            >
              <Camera className="w-7 h-7" />
              찰칵! 텍스트 읽기
            </button>
          </div>
        </div>
      )}

      {/* Preview Image if uploaded */}
      {selectedImage && (
        <div className="rounded-3xl border-2 border-amber-400 overflow-hidden shadow-md max-h-56 bg-black flex items-center justify-center">
          <img
            src={selectedImage}
            alt="선택된 처방전 이미지"
            className="max-h-56 object-contain"
          />
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="p-8 rounded-3xl bg-amber-500/10 border-2 border-amber-500 text-center space-y-4 animate-pulse">
          <Sparkles className="w-12 h-12 text-amber-600 mx-auto animate-spin" />
          <div>
            <h3 className="text-2xl font-black text-amber-800">
              어르신을 위해 글자를 읽고 있어요...
            </h3>
            <p className="text-base font-bold text-amber-700 mt-1">
              쉬운 요약문과 큰 글씨로 만드는 중입니다. 잠시만 기다려 주세요!
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-100 border-2 border-red-500 text-red-900 font-bold flex items-center gap-3">
          <AlertTriangle className="w-7 h-7 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* OCR & Senior Easy Summary Result Section */}
      {ocrResult && (
        <div className="space-y-5 animate-fade-in">
          {/* Main Easy Summary Card */}
          <div
            className={`p-6 rounded-3xl border-3 shadow-xl space-y-4 ${
              isHighContrast
                ? "bg-black border-yellow-400 text-yellow-300"
                : "bg-amber-50 border-amber-400 text-gray-900"
            }`}
          >
            {/* Header Controls for Audio */}
            <div className="flex flex-wrap items-center justify-between border-b border-amber-300 pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-sm font-extrabold flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  어르신 맞춤 요약
                </span>
                {isPlayingAudio && (
                  <span className="text-xs font-bold text-red-600 animate-bounce flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    읽어드리는 중...
                  </span>
                )}
              </div>

              {/* Speech Controls */}
              <div className="flex items-center space-x-2">
                {/* Speech Rate Control */}
                <div className="flex items-center space-x-1 text-xs font-bold bg-white/80 px-2 py-1 rounded-xl border border-amber-300 text-amber-900">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>속도:</span>
                  <button
                    onClick={() => setSpeechRate(0.75)}
                    className={`px-1.5 py-0.5 rounded ${
                      speechRate === 0.75 ? "bg-amber-600 text-white" : "text-gray-700"
                    }`}
                  >
                    천천히
                  </button>
                  <button
                    onClick={() => setSpeechRate(0.85)}
                    className={`px-1.5 py-0.5 rounded ${
                      speechRate === 0.85 ? "bg-amber-600 text-white" : "text-gray-700"
                    }`}
                  >
                    보통
                  </button>
                </div>

                {/* Big Audio Play / Stop Button */}
                <button
                  id="btn-toggle-summary-audio"
                  onClick={handleToggleAudio}
                  className={`px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2 shadow-md transition-transform active:scale-95 ${
                    isPlayingAudio
                      ? "bg-red-600 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {isPlayingAudio ? (
                    <>
                      <Square className="w-5 h-5 fill-current" />
                      음성 멈춤
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5" />
                      목소리로 들려드리기
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Senior Friendly Main Summary Text */}
            <div className={`whitespace-pre-wrap font-sans ${getTextClass()}`}>
              {ocrResult.seniorSummary}
            </div>

            {/* Key Instructions Bullet Checklist */}
            {ocrResult.keyInstructions && ocrResult.keyInstructions.length > 0 && (
              <div className="pt-3 border-t border-amber-200/80 space-y-2">
                <h4 className="font-extrabold text-lg text-amber-800 flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  핵심 복용 수칙:
                </h4>
                <ul className="space-y-1.5">
                  {ocrResult.keyInstructions.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 font-bold text-base text-gray-800 bg-white/70 p-2.5 rounded-xl border border-amber-200"
                    >
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings & Caution Box */}
            {ocrResult.warnings && ocrResult.warnings.length > 0 && (
              <div className="p-4 bg-red-100/90 border-2 border-red-400 rounded-2xl space-y-2 text-red-950">
                <h4 className="font-extrabold text-lg flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-6 h-6" />
                  어르신 꼭 주의하세요!
                </h4>
                <ul className="list-disc list-inside space-y-1 font-bold text-base">
                  {ocrResult.warnings.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Register Alarm Action Button */}
            {ocrResult.detectedMedications &&
              ocrResult.detectedMedications.length > 0 && (
                <div className="pt-2">
                  <button
                    id="btn-register-detected-alarms"
                    onClick={handleRegisterAlarms}
                    className="w-full py-4 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xl rounded-2xl shadow-xl flex items-center justify-center gap-3 border-2 border-blue-400 active:scale-95"
                  >
                    <Pill className="w-7 h-7" />
                    <span>이 약 복용 알림으로 등록하기 ({ocrResult.detectedMedications.length}건)</span>
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              )}
          </div>

          {/* Original Document Text Collapsible */}
          <details className="p-4 rounded-2xl border bg-gray-50 border-gray-200 text-gray-700 text-sm">
            <summary className="font-extrabold cursor-pointer text-gray-800 py-1">
              🔍 카메라/문서에서 추출된 원래 글자 전체 보기
            </summary>
            <div className="mt-3 p-3 bg-white rounded-xl border text-xs font-mono whitespace-pre-wrap leading-relaxed text-gray-800 max-h-48 overflow-y-auto">
              {ocrResult.originalText || rawText || "인식된 글자가 여기에 표시됩니다."}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
