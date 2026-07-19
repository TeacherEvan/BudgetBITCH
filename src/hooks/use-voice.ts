// hooks/use-voice.ts
'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface VoiceSettings {
  enabled: boolean;
  rate: number;
  pitch: number;
  lang: 'th-TH' | 'en-US';
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: false,
  rate: 1.0,
  pitch: 1.0,
  lang: 'en-US',
};

type SpeechRecognitionType = any; // Web Speech API types are not in DOM lib

export function useVoice(initialLang: 'th-TH' | 'en-US' = 'en-US') {
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS, lang: initialLang };
    const stored = localStorage.getItem('voiceSettings');
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored), lang: initialLang };
      } catch {
        return { ...DEFAULT_SETTINGS, lang: initialLang };
      }
    }
    return { ...DEFAULT_SETTINGS, lang: initialLang };
  });

  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Compute support on the client only, after mount, so SSR and first client
  // render agree (avoids a hydration mismatch on the Settings page).
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsSupported(
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = settings.lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setState(prev => ({ ...prev, transcript: finalTranscript }));
      }
    };

    recognition.onerror = (event: any) => {
      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        error: event.error === 'no-speech' ? 'No speech detected' : event.error 
      }));
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [settings.lang, isSupported]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('voiceSettings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!settings.enabled || typeof window === 'undefined') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = settings.lang;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = 1;

    utterance.onstart = () => setState(prev => ({ ...prev, isSpeaking: true }));
    utterance.onend = () => setState(prev => ({ ...prev, isSpeaking: false }));
    utterance.onerror = (event: any) => {
      console.error('Speech synthesis error:', event.error);
      setState(prev => ({ ...prev, isSpeaking: false, error: event.error }));
    };

    synthesisRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [settings.enabled, settings.lang, settings.rate, settings.pitch]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    setState(prev => ({ ...prev, transcript: '', error: null }));
    try {
      recognitionRef.current.start();
    } catch {
      // Already started
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '' }));
  }, []);

  // Toggle voice enabled
  const toggleVoice = useCallback(() => {
    updateSettings({ enabled: !settings.enabled });
  }, [settings.enabled, updateSettings]);

  return {
    // State
    isSupported,
    isListening: state.isListening,
    isSpeaking: state.isSpeaking,
    transcript: state.transcript,
    error: state.error,
    settings,
    
    // Actions
    speak,
    startListening,
    stopListening,
    clearTranscript,
    toggleVoice,
    updateSettings,
  };
}