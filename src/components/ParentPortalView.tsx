import React, { useState } from 'react';
import {
  User,
  Heart,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Bell,
  MessageCircle,
  Award,
  Phone,
  Shield,
  Clock,
  Send,
  LogOut,
  RefreshCw,
  Home,
  BookOpen,
  Images,
  KeyRound,
  LogIn,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  TaskItem,
  CompetitionLog,
  ParentNotice,
  ParentContactLog,
  EducationGuidancePlan,
  AppSettings,
  ClassMediaItem,
} from '../types';
import { AppUserProfile } from '../services/firebase';
import { ClassMediaTab } from './ClassMediaTab';

interface ParentPortalViewProps {
  currentUser: AppUserProfile;
  student: Student | null;
  attendance: AttendanceRecord[];
  tasks: TaskItem[];
  competitionLogs: CompetitionLog[];
  notices: ParentNotice[];
  contacts: ParentContactLog[];
  educationPlans: EducationGuidancePlan[];
  settings: AppSettings;
  media?: ClassMediaItem[];
  onAddMedia?: (item: ClassMediaItem) => Promise<void>;
  onDeleteMedia?: (id: string) => Promise<void>;
  onUpdateMedia?: (item: ClassMediaItem) => Promise<void>;
  onLogout: () => void;
  onSwitchToTeacher: () => void;
  onSendFeedbackToTeacher: (topic: string, message: string) => Promise<void>;
  onOpenChangePassword?: (code?: string, name?: string) => void;
  onOpenAuth?: () => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  currentUser,
  student,
  attendance,
  tasks,
  competitionLogs,
  notices,
  contacts,
  educationPlans,
  settings,
  media = [],
  onAddMedia = async () => {},
  onDeleteMedia = async () => {},
  onUpdateMedia = async () => {},
  onLogout,
  onSwitchToTeacher,
  onSendFeedbackToTeacher,
  onOpenChangePassword,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'tasks' | 'competition' | 'notices' | 'media' | 'feedback'
  >('overview');
  const [feedbackTopic, setFeedbackTopic] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Filter child specific data
  const childAttendance = student ? attendance.filter((a) => a.studentId === student.id) : [];
  const childTasks = student
    ? tasks.filter(
        (t) =>
          t.assignedToType === 'all' ||
          (t.assignedToType === 'group' && t.targetGroup === student.group) ||
          t.targetStudentId === student.id
      )
    : [];
  const childLogs = student ? competitionLogs.filter((c) => c.studentId === student.id) : [];
  const childContacts = student ? contacts.filter((c) => c.studentId === student.id) : [];
  const childPlans = student ? educationPlans.filter((p) => p.studentId === student.id) : [];

  // Attendance stats
  const presentCount = childAttendance.filter((a) => a.status === 'present').length;
  const excusedCount = childAttendance.filter((a) => a.status === 'excused').length;
  const unexcusedCount = childAttendance.filter((a) => a.status === 'unexcused').length;
  const lateCount = childAttendance.filter((a) => a.status === 'late').length;

  const totalPoints = childLogs.reduce((acc, curr) => acc + curr.points, 0);

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTopic.trim() || !feedbackMessage.trim()) {
      alert('Vui lòng nhập chủ đề và nội dung nhắn gửi tới cô giáo.');
      return;
    }

    setIsSending(true);
    try {
      await onSendFeedbackToTeacher(feedbackTopic.trim(), feedbackMessage.trim());
      setFeedbackTopic('');
      setFeedbackMessage('');
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 4000);
    } catch (err) {
      alert('Không thể gửi phản hồi. Vui lòng thử lại sau.');
    } finally {
      setIsSending(false);
    }
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Chưa liên kết hồ sơ học sinh</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Tài khoản phụ huynh ({currentUser.email}) hiện chưa được liên kết với mã học sinh nào trong Lớp 6/13. Vui lòng liên hệ cô Đỗ Kim Anh để được cấp mã học sinh của con.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={onSwitchToTeacher}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition"
            >
              Chuyển sang chế độ Giáo viên (Cô Kim Anh)
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-teal-600 via-sky-600 to-sky-700 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/ChatGPT_Image_23_52_46_17_thg_9__2026_ba7b0270.png"
              alt="Logo Lớp 6/13"
              className="w-12 h-12 rounded-full ring-2 ring-white/60 bg-white object-cover shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-white/20">
                  Sổ liên lạc điện tử
                </span>
                <span className="text-xs text-sky-100 font-semibold">• Lớp 6/13</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight">
                Học sinh: {student.fullName} ({student.code})
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white">GVCN: Đỗ Kim Anh</p>
              <p className="text-[11px] text-sky-100">SĐT: 0399679445</p>
            </div>

            {onOpenChangePassword && (
              <button
                onClick={() => onOpenChangePassword(student.code, student.fullName)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm"
                title="Đổi mật khẩu tài khoản phụ huynh"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Đổi MK</span>
              </button>
            )}

            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition border border-white/20"
                title="Đăng nhập tài khoản khác hoặc chuyển đổi"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            )}

            <button
              onClick={onSwitchToTeacher}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition border border-white/20"
              title="Chuyển sang chế độ Giáo viên"
            >
              Chế độ Giáo viên
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-white/15 hover:bg-rose-500/80 text-white transition"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar border-t border-white/10 pt-1">
          {[
            { key: 'overview', label: 'Hồ sơ con yêu', icon: User },
            { key: 'attendance', label: `Chuyên cần (${childAttendance.length})`, icon: Calendar },
            { key: 'tasks', label: `Nhiệm vụ (${childTasks.length})`, icon: CheckCircle2 },
            { key: 'competition', label: `Thi đua & Rèn luyện (${totalPoints >= 0 ? '+' : ''}${totalPoints}đ)`, icon: Award },
            { key: 'media', label: `Kho Ảnh & Video (${media.length})`, icon: Images },
            { key: 'notices', label: `Thông báo lớp (${notices.length})`, icon: Bell },
            { key: 'feedback', label: 'Nhắn gửi cô Kim Anh', icon: MessageCircle },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-white text-white bg-white/10 rounded-t-xl'
                    : 'border-transparent text-sky-100 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Real-time sync indicator & Account credentials hint */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-700">Đồng bộ trực tuyến thời gian thực với Cô Đỗ Kim Anh</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {currentUser.email} • Phụ huynh em {student.fullName}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Tài khoản PH:</strong> Tên đăng nhập là Mã HS: <code className="bg-amber-100 font-mono font-bold px-1.5 py-0.5 rounded text-amber-900">{student.code}</code> (Mật khẩu mặc định: <code className="bg-amber-100 font-mono font-bold px-1.5 py-0.5 rounded text-amber-900">12345678</code>)
              </span>
            </div>
            {onOpenChangePassword && (
              <button
                type="button"
                onClick={() => onOpenChangePassword(student.code, student.fullName)}
                className="self-start sm:self-auto px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-2xs whitespace-nowrap"
              >
                Đổi mật khẩu ngay
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Student Hero Card */}
            <div className="bg-gradient-to-r from-sky-500 to-teal-500 rounded-3xl p-6 text-white shadow-md shadow-sky-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/25 shadow-inner">
                  {student.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black">{student.fullName}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/25 font-bold">
                      {student.group}
                    </span>
                  </div>
                  <p className="text-xs text-sky-100 mt-1">
                    Mã học sinh: <strong className="text-white">{student.code}</strong> • Giới tính: {student.gender} • Ngày sinh: {new Date(student.dob).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-xs text-sky-100 mt-0.5">
                    Phụ huynh: {student.guardianName} ({student.guardianRelationship}) - {student.guardianPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-xs text-center border border-white/20 min-w-[90px]">
                  <p className="text-[10px] text-sky-100 font-bold uppercase">Có mặt</p>
                  <p className="text-xl font-black">{presentCount}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-xs text-center border border-white/20 min-w-[90px]">
                  <p className="text-[10px] text-sky-100 font-bold uppercase">Điểm thi đua</p>
                  <p className="text-xl font-black">{totalPoints >= 0 ? `+${totalPoints}` : totalPoints}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Strengths & Goals */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                <h3 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Điểm mạnh & Mục tiêu rèn luyện của con</span>
                </h3>
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <span className="font-bold text-emerald-900 block mb-1">Điểm mạnh & năng khiếu:</span>
                    <p className="leading-relaxed">{student.strengths || 'Đang cập nhật'}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-100">
                    <span className="font-bold text-sky-900 block mb-1">Mục tiêu rèn luyện cá nhân:</span>
                    <p className="leading-relaxed">{student.personalGoals || 'Đang cập nhật'}</p>
                  </div>
                </div>
              </div>

              {/* Support & Teacher measures */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                <h3 className="text-xs font-extrabold text-sky-700 uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-4 h-4 text-sky-600" />
                  <span>Lời dặn & Biện pháp đồng hành của Cô Kim Anh</span>
                </h3>
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-700 space-y-1.5">
                  <p className="font-bold text-amber-900">💡 Biện pháp hỗ trợ của cô:</p>
                  <p className="leading-relaxed">
                    {student.supportMeasures || 'Cô luôn quan tâm, khích lệ và đồng hành cùng em trong từng tiết học.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                  <p className="font-bold text-slate-800">📋 Ghi chú nề nếp đạo đức:</p>
                  <p className="leading-relaxed">
                    {student.notesDiscipline || 'Em chấp hành tốt nội quy lớp 6/13.'}
                  </p>
                </div>
              </div>

              {/* Attention Tags */}
              {student.attentionTags && student.attentionTags.length > 0 && (
                <div className="md:col-span-2 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                  <h3 className="text-xs font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Nội dung gia đình cùng cô Kim Anh phối hợp rèn luyện cho con</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {student.attentionTags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs text-center">
                <p className="text-xs font-bold text-emerald-700">Có mặt</p>
                <p className="text-2xl font-black text-emerald-800 mt-1">{presentCount}</p>
              </div>
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs text-center">
                <p className="text-xs font-bold text-amber-700">Vắng có phép</p>
                <p className="text-2xl font-black text-amber-800 mt-1">{excusedCount}</p>
              </div>
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs text-center">
                <p className="text-xs font-bold text-orange-700">Đi muộn</p>
                <p className="text-2xl font-black text-orange-800 mt-1">{lateCount}</p>
              </div>
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs text-center">
                <p className="text-xs font-bold text-rose-700">Vắng không phép</p>
                <p className="text-2xl font-black text-rose-800 mt-1">{unexcusedCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Nhật ký điểm danh chi tiết từng buổi của {student.fullName}
              </h3>
              {childAttendance.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có bản ghi điểm danh nào.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {childAttendance.map((rec) => (
                    <div key={rec.id} className="p-3.5 flex items-center justify-between text-xs bg-white">
                      <div>
                        <span className="font-bold text-slate-800">{rec.date} ({rec.session})</span>
                        {rec.reason && <p className="text-slate-500 text-[11px] mt-0.5">Lý do: {rec.reason}</p>}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                          rec.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'excused'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : rec.status === 'late'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {rec.status === 'present'
                          ? 'Có mặt'
                          : rec.status === 'excused'
                          ? 'Vắng có phép'
                          : rec.status === 'late'
                          ? 'Đi muộn'
                          : 'Vắng không phép'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TASKS */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Nhiệm vụ & Bài tập rèn luyện của {student.fullName}
            </h3>
            {childTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Hiện không có nhiệm vụ nào cần hoàn thành.</p>
            ) : (
              <div className="space-y-3">
                {childTasks.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">{t.title}</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          t.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'}
                      </span>
                    </div>
                    <p className="text-slate-600">{t.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Hạn hoàn thành: <strong className="text-slate-700">{t.dueDate}</strong></span>
                      {t.criteria && <span className="text-teal-700 font-semibold">Tiêu chí: {t.criteria}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMPETITION LOGS */}
        {activeTab === 'competition' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Điểm thi đua & Rèn luyện của {student.fullName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Tổng điểm tích lũy: <strong className="text-emerald-700 font-bold">{totalPoints >= 0 ? `+${totalPoints}` : totalPoints} điểm</strong></p>
              </div>
            </div>

            {childLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Chưa có lượt cộng/trừ điểm thi đua nào được ghi nhận.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {childLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex items-center justify-between text-xs bg-white">
                    <div>
                      <span className="font-bold text-slate-800">{log.ruleName}</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">Lý do: {log.reason} • Tuần {log.weekNumber}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full font-black text-xs ${
                        log.points >= 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {log.points >= 0 ? `+${log.points}` : log.points} điểm
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: NOTICES */}
        {activeTab === 'notices' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Thông báo chính thức từ Cô Đỗ Kim Anh gửi Quý Phụ huynh Lớp 6/13
            </h3>
            {notices.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Hiện chưa có thông báo mới.</p>
            ) : (
              <div className="space-y-4">
                {notices.map((n) => (
                  <div key={n.id} className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-800 text-sm">{n.title}</h4>
                      <span className="text-[11px] text-slate-400">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{n.finalContent}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: FEEDBACK TO TEACHER */}
        {activeTab === 'feedback' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Nhắn gửi & Trao đổi thông tin với Cô Đỗ Kim Anh (GVCN)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Quý phụ huynh có thể gửi phản hồi, tình hình sức khỏe hoặc các đề xuất hỗ trợ cho em {student.fullName}. Cô Kim Anh sẽ nhận được trực tiếp trên ứng dụng.
              </p>
            </div>

            {sendSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã gửi tin nhắn trao đổi tới Cô Kim Anh thành công!</span>
              </div>
            )}

            <form onSubmit={handleSendFeedback} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chủ đề trao đổi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={feedbackTopic}
                  onChange={(e) => setFeedbackTopic(e.target.value)}
                  placeholder="VD: Nhờ cô nhắc nhở con uống thuốc, xin phép cho con nghỉ học, trao đổi về tình hình học tập..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung trao đổi chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Kính gửi cô Kim Anh..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Đang gửi...' : 'Gửi tin nhắn tới cô Kim Anh'}</span>
                </button>
              </div>
            </form>

            {/* Previous communication history */}
            {childContacts.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lịch sử trao đổi đã lưu giữa cô Kim Anh và gia đình ({childContacts.length})
                </h4>
                <div className="space-y-2.5">
                  {childContacts.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{c.topic} ({c.channel})</span>
                        <span className="text-[11px] text-slate-400">{c.date}</span>
                      </div>
                      <p className="text-slate-600">{c.summary}</p>
                      {c.outcome && <p className="text-emerald-700 font-semibold text-[11px]">Kết quả: {c.outcome}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: MEDIA GALLERY FOR PARENTS */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <ClassMediaTab
              media={media}
              onAddMedia={onAddMedia}
              onDeleteMedia={onDeleteMedia}
              onUpdateMedia={onUpdateMedia}
              currentUser={currentUser}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>
          Ứng dụng <strong>Lớp Học Hạnh Phúc – Lớp 6/13</strong> • Giáo viên chủ nhiệm: <strong>Đỗ Kim Anh</strong>
        </p>
      </footer>
    </div>
  );
};
