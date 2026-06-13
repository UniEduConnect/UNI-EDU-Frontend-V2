import { useNavigate, useParams } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, PhoneOff, Users, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMySchedule } from "@/hooks/useSchedule";
import { useClasses } from "@/hooks/useClasses";
import { useClassMessages, useSendMessage } from "@/hooks/useChat";

// NOTE: the audio/video tiles below are a UI simulation — there is no real
// WebRTC/meeting backend yet (see backend-gaps GAP-11). The participant
// identity + in-meeting chat ARE wired to real data.
const OnlineMeeting = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // There is no GET /Sessions/{id}; resolve the session -> class by joining /me/sessions with /Classes.
  const { sessions } = useMySchedule();
  const { classes } = useClasses();
  const session = sessions.find((s) => s.id === sessionId);
  const classId = session?.classId;
  const cls = classes.find((c) => c.id === classId);
  const studentName = cls?.studentName ?? "Học sinh";
  const className = cls?.name ?? cls?.subject ?? "Buổi học";

  // In-meeting chat reuses the class message thread (real, persisted).
  const { messages: rawMessages } = useClassMessages(classId);
  const sendMsg = useSendMessage(classId ?? "");

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [duration, setDuration] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () =>
      rawMessages.map((m) => ({
        id: m.id,
        sender: m.senderId === user?.id ? "Bạn" : m.senderName,
        message: m.message,
        time: new Date(m.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      })),
    [rawMessages, user?.id],
  );

  useEffect(() => {
    const interval = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSend = () => {
    const text = chatInput.trim();
    if (!text || !classId) return;
    sendMsg.mutate(text);
    setChatInput("");
  };

  const handleEndCall = () => {
    navigate(-1);
  };

  return (
    <div className="h-screen bg-[#202124] flex flex-col">
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-6 bg-[#202124]">
        <div className="flex items-center gap-3">
          <span className="text-white/80 text-sm font-medium">Uni Education Meeting</span>
          <span className="text-white/40 text-xs">|</span>
          <span className="text-white/60 text-xs">{className}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm font-mono">{formatDuration(duration)}</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-success/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs">Trực tiếp</span>
          </div>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 flex">
        <div className={cn("flex-1 flex items-center justify-center p-4 transition-all", chatOpen && "mr-[320px]")}>
          <div className="relative w-full max-w-4xl aspect-video bg-[#3c4043] rounded-2xl overflow-hidden">
            {screenShare ? (
              <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e]">
                <div className="text-center">
                  <MonitorUp className="w-16 h-16 text-primary/50 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Đang chia sẻ màn hình</p>
                </div>
              </div>
            ) : camOn ? (
              <div className="w-full h-full bg-gradient-to-br from-[#2d2d3a] to-[#1a1a2e] flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-4xl text-primary font-bold">GS</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-[#5f6368] flex items-center justify-center">
                  <span className="text-3xl text-white font-bold">A</span>
                </div>
              </div>
            )}

            {/* Student small view */}
            <div className="absolute bottom-4 right-4 w-40 h-28 bg-[#3c4043] rounded-xl overflow-hidden border-2 border-[#5f6368]">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                  <span className="text-sm text-primary font-bold">{studentName.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="absolute bottom-1 left-2 text-[10px] text-white/70">{studentName}</div>
            </div>

            {/* Participants count */}
            <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-black/40 rounded-lg">
              <Users className="w-3 h-3 text-white/70" />
              <span className="text-white/70 text-xs">2</span>
            </div>
          </div>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="fixed right-0 top-14 bottom-[80px] w-[320px] bg-[#2d2d3a] border-l border-[#3c4043] flex flex-col">
            <div className="p-3 border-b border-[#3c4043] flex items-center justify-between">
              <span className="text-white/80 text-sm font-medium">Chat trong lớp</span>
              <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-[#3c4043] rounded"><X className="w-4 h-4 text-white/60" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map(m => (
                <div key={m.id}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-white/80">{m.sender}</span>
                    <span className="text-[10px] text-white/40">{m.time}</span>
                  </div>
                  <p className="text-sm text-white/70">{m.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-[#3c4043] flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} className="flex-1 px-3 py-2 bg-[#3c4043] rounded-lg text-sm text-white placeholder-white/40 outline-none" placeholder="Nhập tin nhắn..." />
              <button onClick={handleSend} className="p-2 bg-primary rounded-lg text-primary-foreground"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-20 flex items-center justify-center gap-3 bg-[#202124]">
        <button onClick={() => setMicOn(!micOn)} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", micOn ? "bg-[#3c4043] hover:bg-[#4a4a57] text-white" : "bg-destructive text-white")}>
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button onClick={() => setCamOn(!camOn)} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", camOn ? "bg-[#3c4043] hover:bg-[#4a4a57] text-white" : "bg-destructive text-white")}>
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button onClick={() => setScreenShare(!screenShare)} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", screenShare ? "bg-primary text-primary-foreground" : "bg-[#3c4043] hover:bg-[#4a4a57] text-white")}>
          <MonitorUp className="w-5 h-5" />
        </button>
        <button onClick={() => setChatOpen(!chatOpen)} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", chatOpen ? "bg-primary text-primary-foreground" : "bg-[#3c4043] hover:bg-[#4a4a57] text-white")}>
          <MessageSquare className="w-5 h-5" />
        </button>
        <div className="w-px h-8 bg-[#3c4043] mx-2" />
        <button onClick={handleEndCall} className="px-6 py-3 bg-destructive text-white rounded-full font-medium flex items-center gap-2 hover:bg-destructive/90 transition-colors">
          <PhoneOff className="w-5 h-5" /> Kết thúc
        </button>
      </div>
    </div>
  );
};

export default OnlineMeeting;
