// Web Speech API Helper for Senior Voice Guidance

let currentUtterance: SpeechSynthesisUtterance | null = null;

export interface SpeakOptions {
  text: string;
  rate?: number; // default 0.85 for senior clarity
  pitch?: number; // default 1.0
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export const speakText = (options: SpeakOptions) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis is not supported in this browser.");
    options.onError?.("이 브라우저는 음성 읽기를 지원하지 않습니다.");
    return;
  }

  // Stop previous speaking
  stopSpeaking();

  // Strip markdown symbols for clean voice reading
  const cleanText = options.text
    .replace(/[*#_~`]/g, "")
    .replace(/\n+/g, " ");

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = "ko-KR";
  utterance.rate = options.rate ?? 0.85; // slightly slower for senior friendliness
  utterance.pitch = options.pitch ?? 1.0;

  // Find a clear Korean voice if available
  const voices = window.speechSynthesis.getVoices();
  const koreanVoice = voices.find(
    (v) => v.lang.includes("ko") || v.lang.includes("KO")
  );
  if (koreanVoice) {
    utterance.voice = koreanVoice;
  }

  utterance.onstart = () => {
    options.onStart?.();
  };

  utterance.onend = () => {
    currentUtterance = null;
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    currentUtterance = null;
    options.onError?.(e);
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

export const isSpeaking = (): boolean => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
};

// Speech Recognition (STT) helper
export class SeniorSpeechRecognizer {
  private recognition: any = null;
  public isSupported: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = "ko-KR";
      }
    }
  }

  public start(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError("음성 인식이 지원되지 않는 브라우저입니다.");
      return;
    }

    try {
      this.recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          onResult(final, true);
        } else if (interim) {
          onResult(interim, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        onError(`음성 인식 오류: ${event.error}`);
      };

      this.recognition.onend = () => {
        onEnd();
      };

      this.recognition.start();
    } catch (e: any) {
      onError("음성 인식을 시작할 수 없습니다.");
    }
  }

  public stop() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
  }
}
