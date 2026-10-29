import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HeartHandshake,
  Send,
  CalendarCheck,
  Trophy,
  ArrowRight,
  Sparkles,
  Flame,
  Award,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  TaskItem,
  DailyWeeklyTodo,
  ParentNotice,
  CompetitionLog,
  AppSettings,
  GroupName,
} from '../types';
import { TabKey } from './Navbar';

interface DashboardTabProps {
  students: Student[];
  attendance: AttendanceRecord[];
  tasks: TaskItem[];
  todos: DailyWeeklyTodo[];
  notices: ParentNotice[];
  competitionLogs: CompetitionLog[];
  settings: AppSettings;
  onNavigate: (tab: TabKey) => void;
  onToggleTodo: (todoId: string) => void;
  onSelectStudent: (student: Student) => void;
  onOpenAiParentDraft: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  students,
  attendance,
  tasks,
  todos,
  notices,
  competitionLogs,
  settings,
  onNavigate,
  onToggleTodo,
  onSelectStudent,
  onOpenAiParentDraft,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Attendance stats today
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
  const excusedCount = todayAttendance.filter((a) => a.status === 'excused').length;
  const unexcusedCount = todayAttendance.filter((a) => a.status === 'unexcused').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'late').length;

  // Tasks stats
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  // Notices stats
  const draftNotices = notices.filter((n) => n.status === 'draft');

  // Todos stats
  const todayTodos = todos.filter((t) => t.dueDate <= todayStr || t.scope === 'daily');
  const pendingTodayTodos = todayTodos.filter((t) => !t.isCompleted);

  // Students needing care
  const attentionStudents = students.filter((s) => s.needsAttention || s.attentionTags.length > 0);

  // Competition summary for current week
  const currentWeekLogs = competitionLogs.filter((log) => log.weekNumber === settings.currentWeek);

  // Group scores
  const groupScores: Record<GroupName, number> = {
    'Tổ 1': settings.startingScore,
    'Tổ 2': settings.startingScore,
    'Tổ 3': settings.startingScore,
    'Tổ 4': settings.startingScore,
  };

  currentWeekLogs.forEach((log) => {
    if (groupScores[log.group] !== undefined) {
      groupScores[log.group] += log.points;
    }
  });

  const sortedGroups = (Object.keys(groupScores) as GroupName[])
    .map((grp) => ({ group: grp, score: groupScores[grp] }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-sky-600 to-teal-600 p-6 sm:p-8 text-white shadow-lg shadow-sky-500/15">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <img
                src="/assets/aistudio/ChatGPT_Image_23_52_46_17_thg_9__2026_ba7b0270.png"
                alt="Huy hiệu Lớp 6/13 - THCS Đàm Quang Trung"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-xl ring-4 ring-white/80 bg-white"
              />
            </div>
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Đoàn kết • Tự tin • Tỏa sáng • Vươn xa</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Chào Cô Kim Anh, chúc cô một ngày giảng dạy tràn đầy năng lượng!
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-sky-100 leading-relaxed">
                Lớp 6/13 ({settings.schoolName}) hôm nay có <span className="font-bold text-white">{presentCount}</span> học sinh có mặt,{' '}
                <span className="font-bold text-white">{pendingTodayTodos.length}</span> việc cần giải quyết trong ngày.
                Cùng nhau viết nên những điều tuyệt vời!
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onOpenAiParentDraft}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-sky-700 font-bold text-sm shadow-md hover:bg-sky-50 active:scale-95 transition"
            >
              <Send className="w-4 h-4 text-sky-600" />
              <span>Soạn tin nhắn phụ huynh</span>
            </button>
            <button
              onClick={() => onNavigate('attendance')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-700/60 hover:bg-sky-700 text-white font-semibold text-sm border border-white/20 active:scale-95 transition"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Điểm danh ngay</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Class Size & Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-sky-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chuyên cần hôm nay</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{presentCount}/{students.length}</span>
            <span className="text-xs font-medium text-emerald-600">Có mặt</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
            {excusedCount > 0 && <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">{excusedCount} phép</span>}
            {lateCount > 0 && <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-medium">{lateCount} muộn</span>}
            {unexcusedCount > 0 && <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium">{unexcusedCount} không phép</span>}
          </div>
        </div>

        {/* Stat 2: Active Tasks */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-teal-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhiệm vụ rèn luyện</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{activeTasks.length}</span>
            <span className="text-xs font-medium text-slate-500">Đang thực hiện</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Đã hoàn thành <span className="font-semibold text-teal-600">{completedTasks.length}</span> nhiệm vụ tuần này
          </p>
        </div>

        {/* Stat 3: Today's homeroom Todos */}
        <div
          onClick={() => onNavigate('planner')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Việc chủ nhiệm hôm nay</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{pendingTodayTodos.length}</span>
            <span className="text-xs font-medium text-amber-600">Cần làm</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Tổng {todayTodos.length} việc • {todayTodos.length - pendingTodayTodos.length} đã xong
          </p>
        </div>

        {/* Stat 4: Students needing support */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-rose-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Học sinh cần quan tâm</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">{attentionStudents.length}</span>
            <span className="text-xs font-medium text-slate-500">Em cần đồng hành</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Tập trung rèn nề nếp, chữ viết & kỹ năng bạn bè
          </p>
        </div>
      </div>

      {/* Main 3 Section Grid (A, B, C) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION A: Việc cần làm ngay */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                A
              </div>
              <h3 className="font-bold text-slate-800 text-base">Việc cần làm ngay</h3>
            </div>
            <button
              onClick={() => onNavigate('planner')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5 flex-1">
            {todayTodos.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Không có việc nào đến hạn hôm nay.</p>
            ) : (
              todayTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                    todo.isCompleted
                      ? 'bg-slate-50 border-slate-100 opacity-60'
                      : 'bg-white border-slate-200 hover:border-sky-300 shadow-2xs'
                  }`}
                >
                  <button
                    onClick={() => onToggleTodo(todo.id)}
                    className="mt-0.5 text-slate-400 hover:text-sky-600 transition"
                  >
                    {todo.isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-sky-500" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-semibold text-slate-800 leading-snug ${
                        todo.isCompleted ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {todo.title}
                    </p>
                    {todo.note && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{todo.note}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                        {todo.category}
                      </span>
                      {todo.priority === 'high' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-50 text-rose-700">
                          Ưu tiên cao
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION B: Học sinh cần quan tâm */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
                B
              </div>
              <h3 className="font-bold text-slate-800 text-base">Học sinh cần quan tâm</h3>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>Xem danh sách</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {attentionStudents.slice(0, 4).map((student) => (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className="p-3.5 rounded-2xl border border-slate-100 hover:border-rose-200 bg-rose-50/30 hover:bg-rose-50/60 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                      {student.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-rose-700 transition">
                        {student.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {student.code} • {student.group}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 transition" />
                </div>

                {student.attentionTags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {student.attentionTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-rose-700 border border-rose-100 shadow-2xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {student.supportMeasures && (
                  <p className="mt-2 text-[11px] text-slate-600 italic bg-white/70 p-1.5 rounded-lg border border-slate-100">
                    💡 Hỗ trợ: {student.supportMeasures}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION C: Hoạt động lớp học & Thi đua tuần */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                C
              </div>
              <h3 className="font-bold text-slate-800 text-base">Hoạt động & Thi đua tuần</h3>
            </div>
            <button
              onClick={() => onNavigate('competition')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>Xem bảng điểm</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Group Standings Bar */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Bảng điểm các tổ (Tuần {settings.currentWeek})</span>
            </p>
            <div className="grid grid-cols-4 gap-2">
              {sortedGroups.map((g, idx) => (
                <div
                  key={g.group}
                  className={`p-2.5 rounded-xl text-center border ${
                    idx === 0
                      ? 'bg-amber-50/70 border-amber-200 ring-1 ring-amber-200'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-600 block">{g.group}</span>
                  <span className={`text-sm font-extrabold ${idx === 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                    {g.score} đ
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent logs */}
          <div className="mt-4 space-y-2 flex-1">
            <p className="text-xs font-semibold text-slate-600">Ghi nhận tiến bộ gần nhất:</p>
            {currentWeekLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{log.studentName}</span>
                  <span
                    className={`font-bold text-xs px-1.5 py-0.5 rounded ${
                      log.points >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                    }`}
                  >
                    {log.points > 0 ? `+${log.points}` : log.points} đ
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{log.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
