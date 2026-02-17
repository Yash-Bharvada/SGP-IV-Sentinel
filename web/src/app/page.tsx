"use client";

import { useState, useRef } from "react";
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import { CommandDock } from "@/components/CommandDock";
import { ResultCard } from "@/components/ResultCard";
import { AnimatePresence } from "framer-motion";

interface InsightPoint {
  point: string;
  description: string;
}

interface Insights {
  summary: string;
  likes: InsightPoint[];
  dislikes: InsightPoint[];
}

interface AnalysisResult {
  transcription: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  confidence: number;
  uncertainty?: number;
  language_used: string;
  insights?: Insights;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [orbColor, setOrbColor] = useState<string | undefined>(undefined);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs for raw audio capture
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);

  // Helper: Write String to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Helper: Encode raw PCM to WAV
  const encodeWAV = (samples: Float32Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count (mono)
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sampleRate * blockAlign)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    const length = samples.length;
    let offset = 44;
    for (let i = 0; i < length; i++) {
      // Clamp between -1 and 1
      const s = Math.max(-1, Math.min(1, samples[i]));
      // Scale to 16-bit integer
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Use 16kHz if possible to match backend preference, but standard is fine
      // Most browsers force 44.1 or 48kHz, resizing handled in backend

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      // Buffer size 4096, 1 input channel, 1 output channel
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      audioChunksRef.current = []; // Reset buffers

      processorRef.current.onaudioprocess = (e) => {
        // Get channel data (mono)
        const channelData = e.inputBuffer.getChannelData(0);
        // Clone data because the buffer is reused
        audioChunksRef.current.push(new Float32Array(channelData));
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination); // Needed for processing to happen

      mediaStreamRef.current = stream;
    } catch (err) {
      console.error("Failed to start recording:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      // Stop the capture
      if (sourceRef.current) sourceRef.current.disconnect();
      if (processorRef.current) processorRef.current.disconnect();

      // Flatten chunks
      const length = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
      const mergedBuffer = new Float32Array(length);
      let offset = 0;
      for (const chunk of audioChunksRef.current) {
        mergedBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      // Encode to WAV
      const wavBlob = encodeWAV(mergedBuffer, audioContextRef.current.sampleRate);
      const file = new File([wavBlob], "recording.wav", { type: "audio/wav" });
      processInput(file);

      // Cleanup
      audioContextRef.current.close();

      // Stop the MediaStream tracks correctly
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        mediaStreamRef.current = null;
      }

      audioContextRef.current = null;
      sourceRef.current = null;
      processorRef.current = null;
    }
  };

  const handleRecordToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setResult(null);
      setOrbColor(undefined);
      startRecording();
    } else {
      setIsRecording(false);
      stopRecording();
    }
  };

  const handleTextSubmit = (text: string) => {
    processInput(text);
  };

  const handleFileUpload = (file: File) => {
    processInput(file);
  };

  // ==================== TEXT-TO-SPEECH ====================

  // Map language code to speech API language
  const getVoiceLanguage = (langCode: string): string => {
    const langMap: Record<string, string> = {
      'eng': 'en-US',
      'hin': 'hi-IN',
      'guj': 'gu-IN'
    };
    return langMap[langCode] || 'en-US';
  };

  // Speak complete insights in detected language
  // Speak complete insights in detected language
  const speakInsights = async (sentiment: string, insights: any, language: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Build complete speech text
    let speechText = "";

    // Add sentiment
    const sentimentText = language === 'hin'
      ? (sentiment === 'Positive' ? 'सकारात्मक' : sentiment === 'Negative' ? 'नकारात्मक' : 'तटस्थ')
      : language === 'guj'
        ? (sentiment === 'Positive' ? 'સકારાત્મક' : sentiment === 'Negative' ? 'નકારાત્મક' : 'તટસ્થ')
        : sentiment;

    speechText += `${sentimentText}. `;

    // Add summary
    if (insights.summary) {
      speechText += `${insights.summary}. `;
    }

    // Add likes
    if (insights.likes && insights.likes.length > 0) {
      const likesLabel = language === 'hin' ? 'पसंद' : language === 'guj' ? 'પસંદ' : 'Likes';
      speechText += `${likesLabel}: `;
      insights.likes.forEach((like: any) => {
        speechText += `${like.point}, ${like.description}. `;
      });
    }

    // Add dislikes
    if (insights.dislikes && insights.dislikes.length > 0) {
      const dislikesLabel = language === 'hin' ? 'नापसंद' : language === 'guj' ? 'નાપસંદ' : 'Dislikes';
      speechText += `${dislikesLabel}: `;
      insights.dislikes.forEach((dislike: any) => {
        speechText += `${dislike.point}, ${dislike.description}. `;
      });
    }

    // Use AI4Bharat Local TTS for Gujarati
    if (language === 'guj') {
      try {
        console.log(`🔊 Requesting AI4Bharat TTS for Gujarati...`);
        setIsSpeaking(true);

        const response = await fetch('http://localhost:8000/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: speechText, language: 'guj' })
        });

        if (!response.ok) throw new Error('TTS request failed');

        const data = await response.json();

        if (data.audio) {
          // Use format from response (mp3 for Edge TTS, wav for others) or default to wav
          const audioFormat = data.format || 'wav';
          const audio = new Audio(`data:audio/${audioFormat};base64,${data.audio}`);

          audio.onplay = () => setIsSpeaking(true);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => {
            console.error("Audio playback error");
            setIsSpeaking(false);
            // Fallback to Web Speech API
            speakWebSpeech(speechText, language);
          };
          await audio.play();
          console.log(`🔊 Playing backend audio (${data.source || 'Unknown source'})`);
          return;
        }
      } catch (error) {
        console.error('❌ AI4Bharat TTS error:', error);
        // Fallback to Web Speech API
      }
    }

    // Fallback: Web Speech API
    speakWebSpeech(speechText, language);
  };

  const speakWebSpeech = (text: string, language: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getVoiceLanguage(language);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      console.log(`🔊 Speaking with Web Speech API (${language}): "${text}"`);
    }
  };

  const simulateResult = (sentiment: 'Positive' | 'Negative' | 'Neutral') => {
    setIsProcessing(true);
    setResult(null);
    setOrbColor(undefined);

    setTimeout(() => {
      setIsProcessing(false);
      let color: string | undefined = undefined;
      // Pure colors requested
      if (sentiment === 'Positive') color = '#10b981'; // Emerald-500
      if (sentiment === 'Neutral') color = '#eab308';  // Yellow-500
      if (sentiment === 'Negative') color = '#ef4444'; // Red-500

      setOrbColor(color);

      // Simulated insights
      const mockInsights: Insights = {
        summary: sentiment === 'Positive'
          ? "User expresses strong satisfaction and enthusiasm."
          : sentiment === 'Negative'
            ? "User shows clear frustration and disappointment."
            : "User maintains a balanced, neutral perspective.",
        likes: sentiment === 'Positive' ? [
          { point: "Overall Experience", description: "Very satisfied with the service" },
          { point: "User Interface", description: "Clean and intuitive design" }
        ] : [],
        dislikes: sentiment === 'Negative' ? [
          { point: "Performance", description: "System feels slow and laggy" },
          { point: "Support", description: "Response time is too long" }
        ] : []
      };

      setResult({
        transcription: `Simulated ${sentiment} result demo (language auto-detected).`,
        sentiment: sentiment,
        confidence: 0.98,
        uncertainty: 0.02,
        language_used: 'eng',
        insights: mockInsights
      });
    }, 1500);
  };



  const processInput = async (input: string | File) => {
    setIsProcessing(true);
    setResult(null);
    setOrbColor(undefined);

    try {
      const formData = new FormData();
      if (input instanceof File) {
        formData.append("file", input);
      } else {
        formData.append("text", input);
      }
      // source_lang removed - backend will auto-detect

      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      console.log("🔍 Backend Response:", data);

      if (!data) {
        throw new Error("Backend returned empty/null data");
      }

      // Fetch AI insights
      let insights: Insights | undefined = undefined;
      let finalSentiment = data.sentiment;

      try {
        const insightsFormData = new FormData();
        insightsFormData.append("transcription", data.transcription);
        insightsFormData.append("sentiment", data.sentiment);
        insightsFormData.append("language", data.detected_language || data.language_used || 'eng');

        const insightsResponse = await fetch("http://localhost:8000/insights", {
          method: "POST",
          body: insightsFormData,
        });

        if (insightsResponse.ok) {
          insights = await insightsResponse.json();

          // Use corrected sentiment if AI detected sarcasm/irony
          if (insights && 'corrected_sentiment' in insights) {
            finalSentiment = (insights as any).corrected_sentiment;
            console.log(`🔄 Sentiment corrected: ${data.sentiment} → ${finalSentiment} (AI detected sarcasm/irony)`);
          }
        }
      } catch (insightsError) {
        console.error("Error fetching insights:", insightsError);
        // Continue without insights
      }

      let color: string | undefined = undefined;
      // Map sentiment to pure colors (using final corrected sentiment)
      if (finalSentiment === 'Positive') color = '#10b981'; // Green
      if (finalSentiment === 'Neutral') color = '#eab308';  // Yellow
      if (finalSentiment === 'Negative') color = '#ef4444'; // Red

      setOrbColor(color);

      setResult({
        transcription: data.transcription,
        sentiment: finalSentiment as any,
        confidence: data.confidence,
        uncertainty: data.uncertainty,
        language_used: data.detected_language || data.language_used || 'eng',
        insights: insights
      });

      // Auto-speak complete insights in detected language
      if (insights) {
        speakInsights(finalSentiment, insights, data.detected_language || data.language_used || 'eng');
      }

    } catch (error) {
      console.error("Error processing input:", error);
      // Fallback or error state could be handled here
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Layer 1: Background Z-0 */}
      <VoicePoweredOrb
        mainColor={orbColor}
        centerText={isRecording ? "LISTENING" : isProcessing ? "ANALYZING" : "Sentiment Analysis"}
        isTitle={!isRecording && !isProcessing}
        maxHoverIntensity={isProcessing ? 0.8 : 0.5}
        voiceSensitivity={2.0}
        // Pass enableVoiceControl based on recording state if you want the orb to react only when recording
        enableVoiceControl={isRecording}
      />

      {/* Layer 2: Result Overlay Z-40 */}
      <AnimatePresence>
        {result && (
          <ResultCard
            transcription={result.transcription}
            sentiment={result.sentiment}
            confidence={result.confidence}
            uncertainty={result.uncertainty}
            language_used={result.language_used}
            insights={result.insights}
            isSpeaking={isSpeaking}
            onClose={() => {
              setResult(null);
              setOrbColor(undefined);
              window.speechSynthesis.cancel(); // Stop speech when closing
            }}
          />
        )}
      </AnimatePresence>

      {/* Layer 3: Controls Z-50 */}
      <CommandDock
        isRecording={isRecording}
        isProcessing={isProcessing}
        onRecordToggle={handleRecordToggle}
        onTextSubmit={handleTextSubmit}
        onFileUpload={handleFileUpload}
      />

      {/* Demo Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button onClick={() => simulateResult('Positive')} className="px-3 py-1 bg-green-900/50 text-green-400 text-xs rounded border border-green-500/30 hover:bg-green-800/50">Positive</button>
        <button onClick={() => simulateResult('Neutral')} className="px-3 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded border border-yellow-500/30 hover:bg-yellow-800/50">Neutral</button>
        <button onClick={() => simulateResult('Negative')} className="px-3 py-1 bg-red-900/50 text-red-400 text-xs rounded border border-red-500/30 hover:bg-red-800/50">Negative</button>
      </div>
    </div>
  );
}
