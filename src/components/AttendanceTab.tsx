import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Download,
  Calendar,
  MessageSquare,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, GroupName } from '../types';
import * as XLSX from 'xlsx';

interface AttendanceTabProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onUpdateAttendance: (newRecords: AttendanceRecord[]) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  students,
  attendance,
  onUpdateAttendance,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSession, setSelectedSession] = useState<'Sáng' | 'Chiều'>('Sáng');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchName, setSearchName] = useState<string>('');

  // Reason modal state
  const [editingReasonRecord, setEditingReasonRecord] = useState<{
    student: Student;
    record?: AttendanceRecord;
    status: AttendanceStatus;
  } | null>(null);
  const [tempReason, setTempReason] = useState<string>('');

  // Map of studentId -> attendance record for selectedDate & session
  const currentAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance.forEach((r) => {
      if (r.date === selectedDate && r.session === selectedSession) {
        map.set(r.studentId, r);
      }
    });
    return map;
  }, [attendance, selectedDate, selectedSession]);

  // Quick stats
  const totalStudents = students.length;
  let presentCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;
  let lateCount = 0;
  let otherCount = 0;

  students.forEach((s) => {
    const rec = currentAttendanceMap.get(s.id);
    const status = rec ? rec.status : 'present'; // default present if not logged
    if (status === 'present') presentCount++;
    else if (status === 'excused') excusedCount++;
    else if (status === 'unexcused') unexcusedCount++;
    else if (status === 'late') lateCount++;
    else if (status === 'other') otherCount++;
  });

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchName.toLowerCase()) ||
        s.code.toLowerCase().includes(searchName.toLowerCase());
      const matchGroup = selectedGroup === 'all' || s.group === selectedGroup;
      return matchSearch && matchGroup;
    });
  }, [students, searchName, selectedGroup]);

  // Action: Mark all present
  const handleMarkAllPresent = () => {
    const updated = [...attendance];
    students.forEach((s) => {
      const existingIdx = updated.findIndex(
        (r) => r.studentId === s.id && r.date === selectedDate && r.session === selectedSession
      );
      if (existingIdx >= 0) {
        updated[existingIdx] = {
          ...updated[existingIdx],
          status: 'present',
          reason: undefined,
          timeRecorded: new Date().toISOString(),
        };
      } else {
        updated.push({
          id: `att-${Date.now()}-${s.id}`,
          date: selectedDate,
          session: selectedSession,
          studentId: s.id,
          status: 'present',
          timeRecorded: new Date().toISOString(),
        });
      }
    });
    onUpdateAttendance(updated);
  };

  // Change individual student attendance status
  const handleSetStatus = (student: Student, newStatus: AttendanceStatus) => {
    if (newStatus === 'excused' || newStatus === 'late' || newStatus === 'other') {
      // Prompt reason dialog
      const existing = currentAttendanceMap.get(student.id);
      setEditingReasonRecord({
        student,
        record: existing,
        status: newStatus,
      });
      setTempReason(existing?.reason || '');
      return;
    }

    applyStatusChange(student.id, newStatus);
  };

  const applyStatusChange = (studentId: string, status: AttendanceStatus, reason?: string) => {
    const updated = [...attendance];
    const existingIdx = updated.findIndex(
      (r) => r.studentId === studentId && r.date === selectedDate && r.session === selectedSession
    );

    if (existingIdx >= 0) {
      updated[existingIdx] = {
        ...updated[existingIdx],
        status,
        reason: reason || undefined,
        timeRecorded: new Date().toISOString(),
      };
    } else {
      updated.push({
        id: `att-${Date.now()}-${studentId}`,
        date: selectedDate,
        session: selectedSession,
        studentId,
        status,
        reason: reason || undefined,
        timeRecorded: new Date().toISOString(),
      });
    }
    onUpdateAttendance(updated);
  };

  const handleSaveReason = () => {
    if (!editingReasonRecord) return;
    applyStatusChange(
      editingReasonRecord.student.id,
      editingReasonRecord.status,
      tempReason.trim() || undefined
    );
    setEditingReasonRecord(null);
  };

  // Export attendance report to Excel
  const handleExportAttendanceReport = () => {
    const reportData = students.map((s, idx) => {
      const rec = currentAttendanceMap.get(s.id);
      const statusLabel =
        rec?.status === 'excused'
          ? 'Vắng có phép'
          : rec?.status === 'unexcused'
          ? 'Vắng không phép'
          : rec?.status === 'late'
          ? 'Đi muộn'
          : rec?.status === 'other'
          ? 'Lý do khác'
          : 'Có mặt';

      return {
        STT: idx + 1,
        'Mã học sinh': s.code,
        'Họ và tên': s.fullName,
        Tổ: s.group,
        'Ngày điểm danh': selectedDate,
        'Buổi học': selectedSession,
        'Trạng thái': statusLabel,
        'Lý do ghi nhận': rec?.reason || '',
        'Thời gian tiếp nhận': rec?.timeRecorded ? new Date(rec.timeRecorded).toLocaleTimeString('vi-VN') : '',
        'SĐT phụ huynh': s.guardianPhone,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `DiemDanh_${selectedDate}`);
    XLSX.writeFile(workbook, `BaoCao_DiemDanh_Lop613_${selectedDate}_${selectedSession}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Sổ Điểm danh Lớp 6/13</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {presentCount}/{totalStudents} Có mặt
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xác minh lý do chu đáo, không tự ý quy kết vi phạm khi chưa trao đổi với gia đình
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setSelectedSession('Sáng')}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedSession === 'Sáng' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Buổi Sáng
            </button>
            <button
              onClick={() => setSelectedSession('Chiều')}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedSession === 'Chiều' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Buổi Chiều
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none"
            />
          </div>

          <button
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs active:scale-95 transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>Tất cả có mặt</span>
          </button>

          <button
            onClick={handleExportAttendanceReport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-2xl">
          <span className="text-[11px] font-bold text-emerald-800 uppercase">Có mặt</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-700">{presentCount}</span>
            <span className="text-xs text-emerald-600">/ {totalStudents}</span>
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/80 p-3.5 rounded-2xl">
          <span className="text-[11px] font-bold text-amber-800 uppercase">Vắng có phép</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-amber-700">{excusedCount}</span>
            <span className="text-xs text-amber-600">học sinh</span>
          </div>
        </div>

        <div className="bg-orange-50/60 border border-orange-200/80 p-3.5 rounded-2xl">
          <span className="text-[11px] font-bold text-orange-800 uppercase">Đi muộn</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-orange-700">{lateCount}</span>
            <span className="text-xs text-orange-600">học sinh</span>
          </div>
        </div>

        <div className="bg-rose-50/60 border border-rose-200/80 p-3.5 rounded-2xl">
          <span className="text-[11px] font-bold text-rose-800 uppercase">Vắng không phép</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-rose-700">{unexcusedCount}</span>
            <span className="text-xs text-rose-600">cần liên hệ</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-700 uppercase">Lý do khác</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-700">{otherCount}</span>
            <span className="text-xs text-slate-500">trường hợp</span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh để điểm danh nhanh..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar">
          {['all', 'Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                selectedGroup === grp
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {grp === 'all' ? 'Toàn lớp' : grp}
            </button>
          ))}
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">Chưa có học sinh để điểm danh</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Lớp 6/13 hiện chưa có học sinh. Cô vui lòng chuyển sang thẻ <strong>Học sinh</strong> để tải lên tệp Excel của lớp.
              </p>
            </div>
          ) : (
            filteredStudents.map((student, idx) => {
              const record = currentAttendanceMap.get(student.id);
              const status: AttendanceStatus = record?.status || 'present';

            return (
              <div
                key={student.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-6 text-center">
                    {idx + 1}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 font-extrabold text-xs flex items-center justify-center">
                    {student.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{student.fullName}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                        {student.group}
                      </span>
                    </div>
                    {record?.reason && (
                      <p className="text-[11px] text-amber-700 mt-0.5 flex items-center gap-1 font-medium">
                        <MessageSquare className="w-3 h-3" />
                        <span>Lý do: {record.reason}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Switcher Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap pl-9 sm:pl-0">
                  <button
                    onClick={() => handleSetStatus(student, 'present')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      status === 'present'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Có mặt
                  </button>

                  <button
                    onClick={() => handleSetStatus(student, 'excused')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      status === 'excused'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    Vắng có phép
                  </button>

                  <button
                    onClick={() => handleSetStatus(student, 'late')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      status === 'late'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                    }`}
                  >
                    Đi muộn
                  </button>

                  <button
                    onClick={() => handleSetStatus(student, 'unexcused')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      status === 'unexcused'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    Vắng không phép
                  </button>

                  <button
                    onClick={() => handleSetStatus(student, 'other')}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition ${
                      status === 'other'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    title="Lý do khác"
                  >
                    Khác
                  </button>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Reason Dialog Modal */}
      {editingReasonRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-500" />
                <span>Ghi chú lý do điểm danh</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Học sinh: <span className="font-bold text-slate-700">{editingReasonRecord.student.fullName}</span> ({editingReasonRecord.student.group})
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs leading-relaxed">
              💡 Thầy cô ghi nhận thông tin do phụ huynh trao đổi (qua tin nhắn, cuộc gọi hoặc lý do sức khỏe/thời tiết), xác thực trước khi kết luận.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do vắng / đi muộn:
              </label>
              <textarea
                rows={3}
                placeholder="VD: Mẹ nhắn tin xin phép đi khám mắt lúc 7h00 sáng..."
                value={tempReason}
                onChange={(e) => setTempReason(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingReasonRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveReason}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition shadow-xs"
              >
                Lưu xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
