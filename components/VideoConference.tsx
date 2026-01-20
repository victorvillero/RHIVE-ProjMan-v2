import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, Maximize2, BrainCircuit, Sparkles, Settings as SettingsIcon, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { User, ChatMessage } from '../types';

interface VideoConferenceProps {
  onClose: () => void;
  currentUserAvatar: string;
  participants?: User[];
  activeTab?: 'transcript' | 'chat';
  chatMessages?: ChatMessage[];
}

// --- Audio Helpers ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const getCurrentMountainTime = () => {
    return new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/Denver',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const VideoConference: React.FC<VideoConferenceProps> = ({ onClose, currentUserAvatar, participants = [] }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // AI / Transcript State
  const [transcripts, setTranscripts] = useState<{ speaker: 'User' | 'AI', text: string }[]>([]);
  const [isAiConnected, setIsAiConnected] = useState(false);
  
  // Chat State
  const [activeTab, setActiveTab] = useState<'transcript' | 'chat'>('transcript');
  const [chatMessages, setChatMessages] = useState<{ id: string, sender: string, text: string, time: string, isMe: boolean }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  
  // Settings State
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('');
  const [selectedVideoInput, setSelectedVideoInput] = useState('');
  const [backgroundEffect, setBackgroundEffect] = useState<'none' | 'blur' | 'image'>('none');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisContextRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<number | null>(null);
  
  // AI Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const activeSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Function to start or restart the media stream
  const startStream = async (audioId?: string, videoId?: string) => {
      // 1. Cleanup existing stream and intervals
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioIntervalRef.current) {
          clearInterval(audioIntervalRef.current);
      }
      if (analysisContextRef.current) {
          analysisContextRef.current.close();
      }

      // 2. Define Constraints
      const constraints: MediaStreamConstraints = {
          audio: audioId ? { deviceId: { exact: audioId } } : true,
          video: videoId ? { deviceId: { exact: videoId } } : true,
      };

      try {
          // 3. Get User Media
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;

          // 4. Update Video Element
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }

          // 5. Setup Audio Analysis (Visualizer)
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          analysisContextRef.current = audioContext;
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          audioIntervalRef.current = window.setInterval(() => {
              analyser.getByteFrequencyData(dataArray);
              // Calculate average volume
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              // Normalize roughly to 0-100
              setAudioLevel(Math.min(100, average * 2)); 
          }, 100);

          // 6. Enumerate Devices (Update lists)
          const devices = await navigator.mediaDevices.enumerateDevices();
          setAudioInputDevices(devices.filter(d => d.kind === 'audioinput'));
          setAudioOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
          setVideoDevices(devices.filter(d => d.kind === 'videoinput'));

          // Set initial selections if empty
          if (!selectedAudioInput) {
             const audioTrack = stream.getAudioTracks()[0];
             if (audioTrack) setSelectedAudioInput(audioTrack.getSettings().deviceId || '');
          }
          if (!selectedVideoInput) {
             const videoTrack = stream.getVideoTracks()[0];
             if (videoTrack) setSelectedVideoInput(videoTrack.getSettings().deviceId || '');
          }

      } catch (err) {
          console.error("Error accessing media devices:", err);
      }
  };

  // Initial Mount
  useEffect(() => {
    startStream();
    return () => {
      cleanupMedia();
      cleanupAi();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'chat' || chatMessages.length > 0) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const cleanupMedia = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (analysisContextRef.current) analysisContextRef.current.close();
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
  };

  const cleanupAi = () => {
      if (activeSessionRef.current) {
          // Attempt to close session if method exists (depends on SDK version)
          try { activeSessionRef.current.close?.(); } catch(e) {}
          activeSessionRef.current = null;
      }
      if (inputAudioContextRef.current) {
          inputAudioContextRef.current.close();
          inputAudioContextRef.current = null;
      }
      if (outputAudioContextRef.current) {
          outputAudioContextRef.current.close();
          outputAudioContextRef.current = null;
      }
      outputSourcesRef.current.forEach(source => source.stop());
      outputSourcesRef.current.clear();
      setIsAiConnected(false);
  };

  // Handle Device Switching
  const handleDeviceChange = (type: 'audio' | 'video', deviceId: string) => {
      if (type === 'audio') {
          setSelectedAudioInput(deviceId);
          startStream(deviceId, selectedVideoInput);
      } else {
          setSelectedVideoInput(deviceId);
          startStream(selectedAudioInput, deviceId);
      }
  };

  const handleSendMessage = () => {
      if (!chatInput.trim()) return;
      
      const newMessage = {
          id: Date.now().toString(),
          sender: 'You',
          text: chatInput,
          time: getCurrentMountainTime(),
          isMe: true
      };
      
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');
      
      // Mock echo from participant
      if (participants.length > 0) {
          setTimeout(() => {
              const reply = {
                  id: (Date.now() + 1).toString(),
                  sender: participants[0].name,
                  text: "Got it, thanks!",
                  time: getCurrentMountainTime(),
                  isMe: false
              };
              setChatMessages(prev => [...prev, reply]);
          }, 1500);
      }
  };

  // AI Scribe Connection (Gemini Live)
  const toggleAiScribe = async () => {
    // If connected, disconnect
    if (isAiConnected) {
        cleanupAi();
        return;
    }

    if (!process.env.API_KEY) {
        alert("API Key not found in environment.");
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Input Context (Mic) - 16kHz
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        await inputAudioContext.resume();
        inputAudioContextRef.current = inputAudioContext;
        
        // Output Context (Speaker) - 24kHz for Gemini Output
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        await outputAudioContext.resume();
        outputAudioContextRef.current = outputAudioContext;
        
        const stream = streamRef.current;
        if (!stream) {
            alert("No microphone stream detected.");
            return;
        }

        const audioStream = new MediaStream(stream.getAudioTracks());
        
        let currentInputTranscription = '';
        let currentOutputTranscription = '';
        
        nextStartTimeRef.current = 0;

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            callbacks: {
                onopen: () => {
                    setIsAiConnected(true);
                    setIsSidebarOpen(true);
                    setActiveTab('transcript');
                    
                    const source = inputAudioContext.createMediaStreamSource(audioStream);
                    const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        
                        sessionPromise.then((session) => {
                            // Check if still connected
                            if (inputAudioContextRef.current) {
                                activeSessionRef.current = session;
                                session.sendRealtimeInput({ media: pcmBlob });
                            }
                        });
                    };

                    source.connect(scriptProcessor);
                    const muteGain = inputAudioContext.createGain();
                    muteGain.gain.value = 0;
                    scriptProcessor.connect(muteGain);
                    muteGain.connect(inputAudioContext.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Transcription
                    if (message.serverContent?.outputTranscription) {
                        const text = message.serverContent.outputTranscription.text;
                        currentOutputTranscription += text;
                    } else if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        currentInputTranscription += text;
                    }

                    if (message.serverContent?.turnComplete) {
                        if (currentInputTranscription.trim()) {
                            setTranscripts(prev => [...prev, { speaker: 'User', text: currentInputTranscription }]);
                            currentInputTranscription = '';
                        }
                        if (currentOutputTranscription.trim()) {
                             setTranscripts(prev => [...prev, { speaker: 'AI', text: currentOutputTranscription }]);
                             currentOutputTranscription = '';
                        }
                    }

                    // Handle Audio Output
                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        const ctx = outputAudioContextRef.current;
                        const audioBuffer = await decodeAudioData(
                            decode(base64Audio),
                            ctx,
                            24000,
                            1
                        );
                        
                        // Schedule playback
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        
                        // Ensure gapless playback
                        const now = ctx.currentTime;
                        const startTime = Math.max(nextStartTimeRef.current, now);
                        
                        source.start(startTime);
                        
                        nextStartTimeRef.current = startTime + audioBuffer.duration;
                        
                        outputSourcesRef.current.add(source);
                        source.onended = () => outputSourcesRef.current.delete(source);
                    }
                },
                onclose: () => {
                    console.log("Gemini session closed");
                    cleanupAi();
                },
                onerror: (err) => {
                    console.error("Gemini Error:", err);
                    alert("AI Service Unavailable or Connection Failed.");
                    cleanupAi();
                }
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                },
                systemInstruction: "You are a helpful project management assistant attending a meeting. Your job is to listen. Occasionally, if asked, summarize what has been said concisely.",
            }
        });
    } catch (error) {
        console.error("Failed to connect to AI:", error);
        cleanupAi();
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in duration-300">
      
      {/* Settings Modal */}
      {showSettings && (
          <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center animate-in fade-in">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-white">Call Settings</h3>
                      <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                  </div>
                  
                  <div className="space-y-6">
                      <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Microphone</label>
                          <select 
                            value={selectedAudioInput}
                            onChange={e => handleDeviceChange('audio', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500"
                          >
                              {audioInputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0,5)}...`}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Speakers</label>
                          <select 
                            value={selectedAudioOutput}
                            onChange={e => setSelectedAudioOutput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500"
                          >
                              {audioOutputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0,5)}...`}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Camera</label>
                          <select 
                            value={selectedVideoInput}
                            onChange={e => handleDeviceChange('video', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500"
                          >
                              {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,5)}...`}</option>)}
                          </select>
                      </div>

                      <div className="pt-4 border-t border-slate-800">
                          <label className="block text-sm font-medium text-slate-400 mb-3">Background Effects</label>
                          <div className="grid grid-cols-3 gap-3">
                              <button 
                                onClick={() => setBackgroundEffect('none')}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 ${backgroundEffect === 'none' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                              >
                                  <div className="w-8 h-8 rounded border border-current opacity-50 bg-slate-900"></div>
                                  <span className="text-xs">None</span>
                              </button>
                              <button 
                                onClick={() => setBackgroundEffect('blur')}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 ${backgroundEffect === 'blur' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                              >
                                  <div className="w-8 h-8 rounded border border-current opacity-50 bg-slate-900 blur-[2px]"></div>
                                  <span className="text-xs">Blur</span>
                              </button>
                              <button 
                                onClick={() => setBackgroundEffect('image')}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 ${backgroundEffect === 'image' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                              >
                                  <ImageIcon size={20} />
                                  <span className="text-xs">Image</span>
                              </button>
                          </div>
                      </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                      <button onClick={() => setShowSettings(false)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors">Done</button>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 shadow-2xl z-10">
        <div className="flex flex-col">
            <div className="text-white font-bold text-lg flex items-center gap-3">
                <span>Call with {participants.length > 0 ? participants.map(p => p.name).join(', ').slice(0, 30) + (participants.length > 2 ? '...' : '') : 'Team'}</span>
                <span className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/50 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    REC
                </span>
            </div>
            <span className="text-slate-500 text-xs">{getCurrentMountainTime()}</span>
        </div>
        
        <div className="flex items-center space-x-4">
            <button 
                onClick={toggleAiScribe}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${isAiConnected ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
            >
                {isAiConnected ? <Sparkles size={16} className="text-yellow-300" /> : <BrainCircuit size={16} />}
                <span>{isAiConnected ? 'Stop AI Scribe' : 'Enable AI Scribe'}</span>
            </button>
            <div className="h-8 w-[1px] bg-slate-800 mx-2"></div>
            <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg"><SettingsIcon size={20} /></button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg"><Maximize2 size={20} /></button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className={`flex-1 p-6 grid gap-6 bg-slate-950 transition-all duration-300 ${participants.length <= 1 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
           {/* Self */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden relative shadow-xl border border-slate-800 group h-full">
                {backgroundEffect === 'blur' && <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-md z-0 pointer-events-none"></div>}
                {backgroundEffect === 'image' && <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200')] bg-cover bg-center z-0 pointer-events-none"></div>}
                
                <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover relative z-10 ${isVideoOff ? 'hidden' : ''} ${backgroundEffect !== 'none' ? 'opacity-90' : ''}`} />
                {isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
                         <img src={currentUserAvatar} alt="Me" className="w-32 h-32 rounded-full opacity-50 border-4 border-slate-800" />
                    </div>
                )}
                
                {/* Audio Level Visualizer (Self) */}
                <div className="absolute bottom-16 left-4 z-30 flex items-end gap-1 h-8">
                     {[1, 2, 3, 4, 5].map(i => (
                         <div 
                             key={i} 
                             className={`w-1.5 bg-green-400 rounded-full transition-all duration-75`}
                             style={{ 
                                 height: !isMuted && audioLevel > i * 10 ? `${Math.max(20, audioLevel * (0.5 + Math.random() * 0.5))}%` : '20%',
                                 opacity: !isMuted && audioLevel > 5 ? 1 : 0.3
                             }}
                         ></div>
                     ))}
                </div>

                <div className="absolute bottom-4 left-4 z-30">
                    <div className="bg-black/60 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
                        You {isMuted && <MicOff size={12} className="text-rose-400"/>}
                    </div>
                </div>
            </div>

            {/* Other Participants */}
            {participants.length > 0 ? participants.map(user => (
                <div key={user.id} className="bg-slate-900 rounded-2xl overflow-hidden relative shadow-xl border border-slate-800 h-full">
                    <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                    <div className="absolute bottom-4 left-4">
                        <div className="bg-black/60 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-lg">{user.name}</div>
                    </div>
                </div>
            )) : (
                <div className="bg-slate-900 rounded-2xl overflow-hidden relative shadow-xl border border-slate-800 flex items-center justify-center border-dashed border-slate-700">
                    <p className="text-slate-500 text-sm">Waiting for others to join...</p>
                </div>
            )}
        </div>

        {/* Sidebar (Chat / Transcripts) */}
        <div className={`${isSidebarOpen ? 'w-96' : 'w-0'} bg-slate-900 border-l border-slate-800 flex flex-col transition-all duration-300 relative`}>
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-slate-800 border border-slate-700 rounded-l-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 z-20"
                style={{ borderRight: 'none' }}
            >
                <ChevronRight size={16} className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} />
            </button>

            <div className="flex p-2 bg-slate-900 border-b border-slate-800 gap-1 overflow-hidden">
                <button 
                    onClick={() => setActiveTab('transcript')}
                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${activeTab === 'transcript' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    Transcript (AI)
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${activeTab === 'chat' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                    Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === 'transcript' ? (
                    transcripts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                            <div className={`p-4 rounded-full bg-slate-800 ${isAiConnected ? 'animate-pulse' : ''}`}>
                                <BrainCircuit size={32} className={isAiConnected ? "text-indigo-500" : "text-slate-600"} />
                            </div>
                            <p className="text-sm italic text-center max-w-[200px]">
                                {isAiConnected ? "AI is listening and transcribing the conversation..." : "Activate the AI Scribe to generate real-time meeting notes."}
                            </p>
                        </div>
                    ) : (
                        transcripts.map((t, idx) => (
                            <div key={idx} className="flex flex-col space-y-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${t.speaker === 'AI' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                        {t.speaker}
                                    </span>
                                    <span className="text-[10px] text-slate-600">Now</span>
                                </div>
                                <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded-xl border border-slate-800 leading-relaxed">{t.text}</p>
                            </div>
                        ))
                    )
                ) : (
                    <>
                        <div className="flex-1 space-y-4 pb-2">
                            {chatMessages.length === 0 ? (
                                <div className="text-center text-slate-500 text-sm py-8 italic">No messages yet</div>
                            ) : (
                                chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className={`text-xs font-bold ${msg.isMe ? 'text-teal-400' : 'text-slate-300'}`}>{msg.sender}</span>
                                            <span className="text-[10px] text-slate-600">{msg.time}</span>
                                        </div>
                                        <div className={`p-3 rounded-xl text-sm max-w-[85%] ${msg.isMe ? 'bg-teal-600/20 border border-teal-500/30 text-teal-100' : 'bg-slate-800 border border-slate-700 text-slate-200'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        
                        <div className="sticky bottom-0 bg-slate-900 pt-2 pb-1">
                             <div className="relative">
                                 <input 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-10 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                                    placeholder="Type a message..."
                                 />
                                 <button 
                                    onClick={handleSendMessage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-md transition-colors"
                                 >
                                    <ChevronRight size={18} />
                                 </button>
                             </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="h-24 bg-slate-900 flex items-center justify-center space-x-6 border-t border-slate-800 pb-4 z-10">
        <button onClick={toggleMute} className={`p-4 rounded-2xl transition-all duration-200 transform hover:scale-105 ${isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button onClick={toggleVideo} className={`p-4 rounded-2xl transition-all duration-200 transform hover:scale-105 ${isVideoOff ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
        <button onClick={onClose} className="px-8 py-4 rounded-2xl bg-rose-600 text-white hover:bg-rose-500 flex items-center space-x-3 shadow-xl shadow-rose-600/20 hover:shadow-rose-600/30 transition-all duration-200 transform hover:scale-105">
            <PhoneOff size={24} />
            <span className="font-bold">Leave Meeting</span>
        </button>
        <button className="p-4 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200">
            <Users size={24} />
        </button>
        <button onClick={() => { setIsSidebarOpen(true); setActiveTab('chat'); }} className={`p-4 rounded-2xl transition-all duration-200 ${isSidebarOpen && activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
             <MessageSquare size={24} />
        </button>
      </div>
    </div>
  );
};