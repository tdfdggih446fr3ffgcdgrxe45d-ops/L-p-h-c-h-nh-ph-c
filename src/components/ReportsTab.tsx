import React from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Users,
  CalendarCheck,
  CheckCircle2,
  Trophy,
  Heart,
  Phone,
  Sparkles,
  PieChart,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  TaskItem,
  CompetitionLog,
  ParentContactLog,
  DailyWeeklyTodo,
  AppSettings,
  GroupName,
} from '../types';
import * as XLSX from 'xlsx';

interface ReportsTabProps {
  students: Student[];
  attendance: AttendanceRecord[];
  tasks: TaskItem[];
  competitionLogs: CompetitionLog[];
  contacts: ParentContactLog[];
  todos: DailyWeeklyTodo[];
  settings: AppSettings;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  students,
  attendance,
  tasks,
  competitionLogs,
  contacts,
  todos,
  settings,
}) => {
  const maleCount = students.filter((s) => s.gender === 'Nam').length;
  const femaleCount = students.filter((s) => s.gender === 'Nữ').length;

  // Group distribution
  const groupCounts: Record<GroupName, number> = {
    'Tổ 1': students.filter((s) => s.group === 'Tổ 1').length,
    'Tổ 2': students.filter((s) => s.group === 'Tổ 2').length,
    'Tổ 3': students.filter((s) => s.group === 'Tổ 3').length,
    'Tổ 4': students.filter((s) => s.group === 'Tổ 4').length,
  };

  // Attendance stats
  const totalAttRecords = attendance.length;
  const presentRecords = attendance.filter((a) => a.status === 'present').length;
  const excusedRecords = attendance.filter((a) => a.status === 'excused').length;
  const lateRecords = attendance.filter((a) => a.status === 'late').length;
  const unexcusedRecords = attendance.filter((a) => a.status === 'unexcused').length;
  const attendanceRate = totalAttRecords > 0 ? Math.round((presentRecords / totalAttRecords) * 100) : 100;

  // Task stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Todos stats
  const totalTodos = todos.length;
  const completedTodos = todos.filter((t) => t.isCompleted).length;

  // Attention needs summary
  const tagSummary: Record<string, number> = {};
  students.forEach((s) => {
    (s.attentionTags || []).forEach((t) => {
      tagSummary[t] = (tagSummary[t] || 0) + 1;
    });
  });

  const handleExportFullReport = () => {
    const summaryData = [
      { 'Chỉ số': 'Lớp', 'Giá trị': settings.className },
      { 'Chỉ số': 'Giáo viên chủ nhiệm', 'Giá trị': settings.teacherName },
      { 'Chỉ số': 'Trường', 'Giá trị': settings.schoolName },
      { 'Chỉ số': 'Năm học', 'Giá trị': settings.academicYear },
      { 'Chỉ số': 'Tuần hiện tại', 'Giá trị': settings.currentWeek },
      { 'Chỉ số': 'Tổng sĩ số', 'Giá trị': students.length },
      { 'Chỉ số': 'Học sinh Nam', 'Giá trị': maleCount },
      { 'Chỉ số': 'Học sinh Nữ', 'Giá trị': femaleCount },
      { 'Chỉ số': 'Tỷ lệ chuyên cần', 'Giá trị': `${attendanceRate}%` },
      { 'Chỉ số': 'Lượt vắng có phép', 'Giá trị': excusedRecords },
      { 'Chỉ số': 'Lượt đi muộn', 'Giá trị': lateRecords },
      { 'Chỉ số': 'Lượt vắng không phép', 'Giá trị': unexcusedRecords },
      { 'Chỉ số': 'Nhiệm vụ đã hoàn thành', 'Giá trị': `${completedTasks}/${totalTasks} (${taskRate}%)` },
      { 'Chỉ số': 'Việc chủ nhiệm đã xong', 'Giá trị': `${completedTodos}/${totalTodos}` },
      { 'Chỉ số': 'Lượt trao đổi với phụ huynh', 'Giá trị': contacts.length },
    ];

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BaoCao_TongHop');
    XLSX.writeFile(workbook, `BaoCao_ChuNhiem_${settings.className}_Tuan${settings.currentWeek}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Báo Cáo & Thống Kê Công Tác Chủ Nhiệm</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
              Tuần {settings.currentWeek}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu minh bạch, chuẩn xác, sẵn sàng cho sinh hoạt lớp và báo cáo Ban giám hiệu
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In / Lưu PDF</span>
          </button>

          <button
            onClick={handleExportFullReport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs active:scale-95 transition"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo Excel</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Sĩ số lớp</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">{students.length}</span>
            <span className="text-xs text-slate-500">học sinh</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {maleCount} Nam • {femaleCount} Nữ
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Tỷ lệ chuyên cần</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{attendanceRate}%</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {excusedRecords} phép • {lateRecords} muộn • {unexcusedRecords} không phép
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Nhiệm vụ hoàn thành</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-600">{taskRate}%</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {completedTasks} / {totalTasks} nhiệm vụ
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Liên lạc phụ huynh</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-600">{contacts.length}</span>
            <span className="text-xs text-slate-500">lượt trao đổi</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Đồng hành chặt chẽ với gia đình
          </p>
        </div>
      </div>

      {/* Detailed Analysis Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tổ Distribution */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-500" />
            <span>Phân bổ học sinh theo Tổ</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(groupCounts).map(([group, count]) => (
              <div key={group} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-700">{group}</span>
                <span className="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                  {count} em
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs support tags breakdown */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Tổng hợp nội dung học sinh đang được hỗ trợ</span>
          </h3>

          <div className="space-y-2">
            {Object.entries(tagSummary).map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-700">{tag}</span>
                <span className="font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                  {count} học sinh
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
