import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CheckSquare,
  Trophy,
  Send,
  HeartHandshake,
  CalendarRange,
  StickyNote,
  BarChart3,
  Settings,
  Sparkles,
  Heart,
  AlertCircle,
  HelpCircle,
  LogIn,
  KeyRound,
  Images,
} from 'lucide-react';
import { AppSettings, Student, DailyWeeklyTodo, ParentNotice } from '../types';
import { AppUserProfile } from '../services/firebase';

export type TabKey =
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'tasks'
  | 'competition'
  | 'media'
  | 'notices'
  | 'guidance'
  | 'planner'
  | 'notes'
  | 'reports'
  | 'settings';

interface NavbarProps {
  currentTab: TabKey;
  setCurrentTab: (tab: TabKey) => void;
  settings: AppSettings;
  students: Student[];
  todos: DailyWeeklyTodo[];
  notices: ParentNotice[];
  mediaCount?: number;
  onOpenAiAssistant: () => void;
  currentUser: AppUserProfile | null;
  onOpenAuth: () => void;
  onOpenChangePassword?: () => void;
  onQuickSwitchRole: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  students,
  todos,
  notices,
  mediaCount = 0,
  onOpenAiAssistant,
  currentUser,
  onOpenAuth,
  onOpenChangePassword,
  onQuickSwitchRole,
}) => {
  const needsAttentionCount = students.filter((s) => s.needsAttention).length;
  const pendingTodosCount = todos.filter((t) => !t.isCompleted).length;
  const draftNoticesCount = notices.filter((n) => n.status === 'draft').length;

  const navItems = [
    { key: 'dashboard' as TabKey, label: 'Tổng quan', icon: LayoutDashboard },
    { key: 'students' as TabKey, label: 'Học sinh', icon: Users, badge: students.length },
    { key: 'attendance' as TabKey, label: 'Điểm danh', icon: CalendarCheck },
    { key: 'tasks' as TabKey, label: 'Nhiệm vụ', icon: CheckSquare },
    { key: 'competition' as TabKey, label: 'Thi đua tuần', icon: Trophy },
    { key: 'media' as TabKey, label: 'Kho Lưu Trữ Media', icon: Images, badge: mediaCount > 0 ? mediaCount : undefined },
    {
      key: 'notices' as TabKey,
      label: 'Thông báo PH',
      icon: Send,
      highlight: true,
      badge: draftNoticesCount > 0 ? draftNoticesCount : undefined,
    },
    { key: 'guidance' as TabKey, label: 'Hồ sơ giáo dục', icon: HeartHandshake },
    {
      key: 'planner' as TabKey,
      label: 'Kế hoạch việc',
      icon: CalendarRange,
      badge: pendingTodosCount > 0 ? pendingTodosCount : undefined,
    },
    { key: 'notes' as TabKey, label: 'Ghi chú nhanh', icon: StickyNote },
    { key: 'reports' as TabKey, label: 'Báo cáo', icon: BarChart3 },
    { key: 'settings' as TabKey, label: 'Cài đặt', icon: Settings },
  ];

  const currentDateStr = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Teacher Branding */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setCurrentTab('dashboard')}
              className="relative cursor-pointer group shrink-0"
              title="Lớp 6/13 - Trường THCS Đàm Quang Trung"
            >
              <img
                src="/assets/aistudio/ChatGPT_Image_23_52_46_17_thg_9__2026_ba7b0270.png"
                alt="Avatar Lớp 6/13 - Trường THCS Đàm Quang Trung"
                className="w-12 h-12 rounded-full object-cover shadow-md shadow-sky-500/20 ring-2 ring-sky-400 group-hover:scale-105 transition-transform duration-200"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-300" title="Đang hoạt động" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                  LỚP HỌC HẠNH PHÚC
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                    {settings.className}
                  </span>
                </h1>
                {settings.isDemoMode && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 hidden sm:inline-block">
                    Dữ liệu minh họa mẫu
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-medium text-slate-700">GVCN: {settings.teacherName}</span>
                <span>•</span>
                <span>{settings.schoolName}</span>
                <span>•</span>
                <span className="capitalize">{currentDateStr}</span>
              </p>
            </div>
          </div>

          {/* Quick Status Badges & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Live Firestore Sync Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold" title="Dữ liệu đồng bộ trực tuyến thời gian thực qua Cloud Firestore">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đồng bộ Firestore Trực tuyến</span>
            </div>

            {/* Prominent Login Button */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm hover:shadow transition"
              title="Đăng nhập tài khoản Giáo viên (SĐT 0399679445) hoặc Phụ huynh (Mã HS)"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>

            {/* Current Role & User Switcher */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
              title="Đổi tài khoản hoặc phân quyền Giáo viên / Phụ huynh"
            >
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>{currentUser?.displayName || 'Cô Kim Anh (GVCN: 0399679445)'}</span>
            </button>

            {/* Change Password Button */}
            {onOpenChangePassword && (
              <button
                onClick={onOpenChangePassword}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                title="Đổi mật khẩu tài khoản"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Đổi MK</span>
              </button>
            )}

            <button
              onClick={onQuickSwitchRole}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition"
              title="Kiểm thử nhanh giao diện Phụ huynh"
            >
              <span>Xem vai Phụ huynh</span>
            </button>

            {needsAttentionCount > 0 && (
              <button
                onClick={() => setCurrentTab('students')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                title="Có học sinh đang cần quan tâm hỗ trợ"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{needsAttentionCount} cần quan tâm</span>
              </button>
            )}

            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-teal-500 to-sky-600 text-white shadow-sm hover:shadow-md hover:from-teal-600 hover:to-sky-700 active:scale-95 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Trợ lý Cô Kim Anh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setCurrentTab(item.key)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25 ring-1 ring-sky-500'
                    : item.highlight
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                      isActive
                        ? 'bg-white text-sky-600'
                        : item.highlight
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
