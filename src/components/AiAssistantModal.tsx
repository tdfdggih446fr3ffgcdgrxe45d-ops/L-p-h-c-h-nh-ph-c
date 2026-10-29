import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RefreshCw,
  HelpCircle,
  Copy,
  Check,
  Heart,
} from 'lucide-react';
import { Student, AttendanceRecord, TaskItem, DailyWeeklyTodo, AppSettings } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  attendance: AttendanceRecord[];
  tasks: TaskItem[];
  todos: DailyWeeklyTodo[];
  settings: AppSettings;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const SAMPLE_QUESTIONS = [
  'Tóm tắt những việc tôi cần làm hôm nay',
  'Liệt kê các em học sinh đang cần quan tâm và lý do',
  'Gợi ý hoạt động 15 phút đầu giờ giúp lớp 6/13 đoàn kết hơn',
  'Soạn lời phát biểu ngắn 3 phút cho cô giáo trong buổi họp phụ huynh',
  'Tình hình chuyên cần sáng nay thế nào?',
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  students,
  attendance,
  tasks,
  todos,
  settings,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Chào Cô Kim Anh! Em là Trợ lý AI sư phạm đồng hành cùng Cô tại Lớp 6/13. Em đã nắm được thông tin sĩ số (${students.length} học sinh), tình hình chuyên cần và các việc cần làm hôm nay. Cô cần em hỗ trợ giải đáp điều gì hay cần soạn thảo văn bản nào ạ?`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAtt = attendance.filter((a) => a.date === todayStr);

  const classContext = {
    className: settings.className,
    teacherName: settings.teacherName,
    schoolName: settings.schoolName,
    currentWeek: settings.currentWeek,
    totalStudents: students.length,
    studentsNeedingAttention: students
      .filter((s) => s.needsAttention || s.attentionTags.length > 0)
      .map((s) => ({ name: s.fullName, group: s.group, tags: s.attentionTags })),
    todayAttendance: {
      present: todayAtt.filter((a) => a.status === 'present').length,
      excused: todayAtt.filter((a) => a.status === 'excused').map((a) => a.reason || 'Có phép'),
      late: todayAtt.filter((a) => a.status === 'late').length,
      unexcused: todayAtt.filter((a) => a.status === 'unexcused').length,
    },
    pendingTasks: tasks.filter((t) => t.status !== 'completed').map((t) => t.title),
    todayTodos: todos.filter((t) => !t.isCompleted).map((t) => t.title),
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          classContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Máy chủ phản hồi lỗi khi trò chuyện.');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Dạ cô, em đã ghi nhận thông tin ạ.',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: 'Dạ Cô Kim Anh ơi, hệ thống chưa kết nối được máy chủ AI lúc này. Cô vui lòng thử lại sau giây lát nhé!',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/ChatGPT_Image_23_52_46_17_thg_9__2026_ba7b0270.png"
              alt="Avatar Lớp 6/13"
              className="w-11 h-11 rounded-full object-cover shadow-md ring-2 ring-white/60 bg-white shrink-0"
            />
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
                <span>AI Trợ lý Chủ nhiệm – Cô Kim Anh</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-semibold">
                  Lớp 6/13
                </span>
              </h3>
              <p className="text-[11px] text-sky-100">
                Sử dụng dữ liệu thực tế của lớp • Tư vấn sư phạm nhân ái
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex space-x-2">
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 shadow-2xs whitespace-nowrap transition disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  isBot ? 'items-start' : 'items-start flex-row-reverse'
                }`}
              >
                {isBot ? (
                  <img
                    src="/assets/aistudio/ChatGPT_Image_23_52_46_17_thg_9__2026_ba7b0270.png"
                    alt="AI Trợ lý"
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-teal-400 shadow-xs bg-white"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[80%] space-y-1 ${isBot ? 'items-start' : 'items-end'}`}>
                  <div
                    className={`p-3.5 rounded-2xl whitespace-pre-wrap ${
                      isBot
                        ? 'bg-slate-50 border border-slate-200 text-slate-800'
                        : 'bg-sky-500 text-white font-medium shadow-xs'
                    }`}
                  >
                    {msg.content}
                  </div>

                  <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
                    <span>{msg.time}</span>
                    {isBot && (
                      <button
                        onClick={() => handleCopyMessage(msg)}
                        className="hover:text-slate-600 transition flex items-center gap-1"
                        title="Sao chép nội dung"
                      >
                        {copiedId === msg.id ? (
                          <span className="text-emerald-600 font-bold">Đã chép</span>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 italic">
                AI đang suy nghĩ và tra cứu thông tin lớp 6/13...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Nhắn tin với Trợ lý AI (VD: Soạn tin nhắn Zalo, gợi ý sinh hoạt lớp...)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs active:scale-95 transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
