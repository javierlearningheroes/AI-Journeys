
import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Mic, MicOff, PhoneOff, Compass,
  MessageCircle, Loader2, Languages
} from "lucide-react";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { EnglishLevel, LearningMode, SessionConfig, ChatMessage } from "../types";
import { CustomButton } from "./CustomButton";

interface IdiomasPageProps {
  onBack: () => void;
}

// Audio Utils
const AUDIO_INPUT_SAMPLE_RATE = 16000;
const AUDIO_OUTPUT_SAMPLE_RATE = 24000;

function encode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function createBlob(data: Float32Array) {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

async function decodeAudioData(base64: string, ctx: AudioContext): Promise<AudioBuffer> {
  const data = decode(base64);
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, AUDIO_OUTPUT_SAMPLE_RATE);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

const Visualizer: React.FC<{ analyser: AnalyserNode | null; isActive: boolean }> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;
    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 3;
      ctx.strokeStyle = isActive ? '#000000' : '#e5e7eb';
      ctx.beginPath();
      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyser, isActive]);
  return <canvas ref={canvasRef} width={600} height={100} className="w-full h-24 bg-gray-50 rounded-2xl border border-gray-100" />;
};

export const IdiomasPage: React.FC<IdiomasPageProps> = ({ onBack }) => {
  const [step, setStep] = useState<'level' | 'mode' | 'session'>('level');
  const [config, setConfig] = useState<SessionConfig>({ level: EnglishLevel.BEGINNER, mode: LearningMode.FREE_STYLE });
  const [status, setStatus] = useState<'connecting' | 'connected' | 'idle' | 'error'>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingUserText, setStreamingUserText] = useState("");
  const [streamingModelText, setStreamingModelText] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  const inputAudioCtx = useRef<AudioContext | null>(null);
  const outputAudioCtx = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const userAccumulator = useRef("");
  const modelAccumulator = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingUserText, streamingModelText]);

  const startSession = async () => {
    try {
      setStatus('connecting');
      setStep('session');
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioCtx.current = new AudioCtx({ sampleRate: AUDIO_INPUT_SAMPLE_RATE });
      outputAudioCtx.current = new AudioCtx({ sampleRate: AUDIO_OUTPUT_SAMPLE_RATE });
      analyserRef.current = inputAudioCtx.current.createAnalyser();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const { getGeminiApiKey } = await import("../services/geminiService");
      const apiKey = getGeminiApiKey();

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are "Alex", a friendly bilingual English tutor. Student level: ${config.level}. Conduct sessions primarily in English. Switch to Spanish naturally ONLY if the student is stuck. ${config.mode === LearningMode.GUIDED ? `Context: Industry ${config.industry}, Scenario ${config.niche}.` : 'Casual conversation.'}`;
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: prompt,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus('connected');
            const source = inputAudioCtx.current!.createMediaStreamSource(stream);
            source.connect(analyserRef.current!);
            const processor = inputAudioCtx.current!.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              if (isMuted) return;
              sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(e.inputBuffer.getChannelData(0)) }));
            };
            source.connect(processor);
            processor.connect(inputAudioCtx.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              userAccumulator.current += msg.serverContent.inputTranscription.text;
              setStreamingUserText(userAccumulator.current);
            }
            if (msg.serverContent?.outputTranscription) {
              modelAccumulator.current += msg.serverContent.outputTranscription.text;
              setStreamingModelText(modelAccumulator.current);
            }
            if (msg.serverContent?.turnComplete) {
              const finalUser = userAccumulator.current.trim();
              const finalModel = modelAccumulator.current.trim();
              setMessages(prev => {
                const updated = [...prev];
                if (finalUser) updated.push({ id: `u-${Date.now()}`, role: 'user', text: finalUser, timestamp: Date.now() });
                if (finalModel) updated.push({ id: `m-${Date.now()}`, role: 'model', text: finalModel, timestamp: Date.now() });
                return updated;
              });
              userAccumulator.current = ""; modelAccumulator.current = "";
              setStreamingUserText(""); setStreamingModelText("");
            }
            const base64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtx.current!.currentTime);
              const buffer = await decodeAudioData(base64, outputAudioCtx.current!);
              const source = outputAudioCtx.current!.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioCtx.current!.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              modelAccumulator.current = ""; setStreamingModelText("");
            }
          },
          onerror: () => setStatus('error'),
          onclose: () => setStatus('idle')
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { setStatus('error'); }
  };

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
    inputAudioCtx.current?.close();
    outputAudioCtx.current?.close();
    setMessages([]); setStreamingUserText(""); setStreamingModelText("");
    userAccumulator.current = ""; modelAccumulator.current = "";
    setStatus('idle'); setStep('level');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-gradient-to-l from-black/10 via-white/50 to-white z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={step === 'session' ? cleanup : onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">IdiomasIA</h1>
          {step === 'session' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 animate-pulse ml-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] font-bold uppercase">En vivo</span>
            </div>
          )}
        </div>
        <img
          src="https://www.learningheroes.com/_ipx/q_80/images/Logo.svg"
          className="h-8 md:h-10 w-auto invert brightness-0"
          alt="Learning Heroes"
        />
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12">
        {step === 'level' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">Elige tu nivel</h2>
              <p className="text-gray-500">Adaptaremos el vocabulario y la velocidad del tutor a tu capacidad actual.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { id: EnglishLevel.BEGINNER, title: 'Principiante', icon: '🌱', desc: 'Hablo muy poco. Quiero aprender frases básicas.' },
                { id: EnglishLevel.INTERMEDIATE, title: 'Intermedio', icon: '🚀', desc: 'Puedo mantener charlas. Quiero fluidez.' },
                { id: EnglishLevel.ADVANCED, title: 'Avanzado', icon: '🌟', desc: 'Tengo fluidez. Quiero perfeccionar modismos.' }
              ].map(l => (
                <button key={l.id} onClick={() => { setConfig({ ...config, level: l.id }); setStep('mode'); }} className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 hover:border-black transition-all group text-left space-y-4">
                  <span className="text-4xl block group-hover:scale-110 transition-transform">{l.icon}</span>
                  <div>
                    <h3 className="font-bold text-xl">{l.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{l.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'mode' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">Modo de Aprendizaje</h2>
              <p className="text-gray-500">¿Quieres una charla libre o practicar un escenario específico?</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <button onClick={() => setConfig({ ...config, mode: LearningMode.FREE_STYLE })} className={`p-10 rounded-[40px] border transition-all text-left space-y-6 ${config.mode === LearningMode.FREE_STYLE ? 'border-black bg-white shadow-xl' : 'border-gray-100 bg-gray-50'}`}>
                <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white"><MessageCircle size={32} /></div>
                <div>
                  <h3 className="text-2xl font-bold">Free Style</h3>
                  <p className="text-gray-400">Conversación abierta y dinámica. El profesor guiará la charla de forma natural.</p>
                </div>
              </button>
              <div className={`p-10 rounded-[40px] border transition-all text-left space-y-6 ${config.mode === LearningMode.GUIDED ? 'border-black bg-white shadow-xl' : 'border-gray-100 bg-gray-50'}`}>
                <button onClick={() => setConfig({ ...config, mode: LearningMode.GUIDED })} className="w-full text-left space-y-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white"><Compass size={32} /></div>
                  <div>
                    <h3 className="text-2xl font-bold">Guided Practice</h3>
                    <p className="text-gray-400">Enfocado en objetivos. Practica vocabulario técnico o situaciones concretas.</p>
                  </div>
                </button>
                {config.mode === LearningMode.GUIDED && (
                  <div className="space-y-4 pt-4 animate-in slide-in-from-top-4 duration-300">
                    <input type="text" placeholder="Industria (Ej: IT, Medicina...)" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none text-sm" onChange={e => setConfig({ ...config, industry: e.target.value })} />
                    <input type="text" placeholder="Escenario (Ej: Entrevista, Venta...)" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none text-sm" onChange={e => setConfig({ ...config, niche: e.target.value })} />
                  </div>
                )}
              </div>
            </div>
            <CustomButton onClick={startSession} className="w-full py-5 text-xl">Comenzar Tutoría</CustomButton>
          </div>
        )}

        {step === 'session' && (
          <div className="h-full flex flex-col gap-8 animate-in fade-in duration-500">
            <div className="bg-black text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
              <div className="relative z-10 space-y-6 w-full">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20 backdrop-blur-md">
                  {status === 'connecting' ? <Loader2 size={40} className="animate-spin text-white" /> : <Languages size={40} />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold tracking-tight">Profesor Alex</h3>
                  <p className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Nivel: {config.level}</p>
                </div>
                <Visualizer analyser={analyserRef.current} isActive={status === 'connected' && !isMuted} />
                <div className="flex justify-center gap-4">
                  <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                  <button onClick={cleanup} className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-xl">
                    <PhoneOff size={24} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-[40px] p-8 border border-gray-100 flex-1 min-h-[300px] max-h-[500px] flex flex-col overflow-hidden">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                <Languages size={14} /> Transcripción en tiempo real (Beta)
              </h4>
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar scroll-smooth">
                {messages.length === 0 && !streamingUserText && !streamingModelText && <p className="text-center text-gray-300 py-12 italic">Comienza a hablar para ver la transcripción...</p>}
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-3xl text-sm shadow-sm ${m.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {streamingUserText && (
                  <div className="flex justify-end animate-in fade-in slide-in-from-right-2">
                    <div className="max-w-[80%] p-4 rounded-3xl text-sm bg-gray-900/80 text-white rounded-tr-none italic border border-gray-700 shadow-inner">
                      {streamingUserText}
                    </div>
                  </div>
                )}
                {streamingModelText && (
                  <div className="flex justify-start animate-in fade-in slide-in-from-left-2">
                    <div className="max-w-[80%] p-4 rounded-3xl text-sm bg-white/80 text-gray-800 border border-gray-200 rounded-tl-none italic shadow-inner">
                      {streamingModelText}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
