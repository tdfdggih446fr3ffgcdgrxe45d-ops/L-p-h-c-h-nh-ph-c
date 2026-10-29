import React, { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { AppSettings } from '../types';
import { StorageService } from '../services/storage';

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetDemo: () => void;
  onClearForReal: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onResetDemo,
  onClearForReal,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleBackupExport = () => {
    StorageService.exportBackup();
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importBackup(content);
      if (success) {
        setImportStatus('Khôi phục dữ liệu sao lưu thành công! Vui lòng tải lại trang.');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportStatus('Tệp sao lưu không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            <span>Cài Đặt Hệ Thống & Lưu Trữ Dữ Liệu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình thông tin lớp, điểm thi đua, sao lưu và quản lý chế độ hoạt động
          </p>
        </div>
      </div>

      {/* Brand Identity Card */}
      <div className="bg-gradient-to-r from-sky-500 to-teal-600 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row items-center gap-5">
        <img
          src="/assets/aistudio/ChatGPT_Image_23_52_46_17_thg_9__2026_ba7b0270.png"
          alt="Huy hiệu Lớp 6/13"
          className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white/80 bg-white shrink-0"
        />
        <div className="text-center sm:text-left space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20">
            Huy hiệu chính thức Lớp 6/13
          </span>
          <h3 className="text-xl font-black">TRƯỜNG THCS ĐÀM QUANG TRUNG</h3>
          <p className="text-xs text-sky-100 font-semibold">
            Đoàn kết • Tự tin • Tỏa sáng • Vươn xa • Niên khóa 2026 - 2027
          </p>
          <p className="text-xs text-amber-200 italic font-medium">
            "Cùng nhau viết nên những điều tuyệt vời!"
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
        <h3 className="font-extrabold text-slate-800 text-sm pb-2 border-b border-slate-100">
          Thông tin Lớp học & Giáo viên chủ nhiệm
        </h3>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên lớp học *</label>
              <input
                type="text"
                required
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giáo viên chủ nhiệm *</label>
              <input
                type="text"
                required
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên trường THCS</label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Năm học</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tuần học hiện tại</label>
              <input
                type="number"
                min={1}
                max={35}
                value={formData.currentWeek}
                onChange={(e) => setFormData({ ...formData, currentWeek: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Điểm thi đua khởi đầu mỗi tuần</label>
              <input
                type="number"
                min={50}
                max={200}
                value={formData.startingScore}
                onChange={(e) => setFormData({ ...formData, startingScore: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold text-amber-700"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Đã lưu cài đặt thành công!
              </span>
            ) : <span />}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Restore Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sao lưu & Khôi phục Cơ sở dữ liệu</span>
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          Dữ liệu được lưu trữ trực tiếp trên trình duyệt của bạn một cách an toàn và bền vững.
          Để phòng ngừa mất dữ liệu khi đổi thiết bị, cô giáo nên định kỳ tải về tệp sao lưu JSON.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleBackupExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            <Download className="w-4 h-4 text-sky-600" />
            <span>Tải về tệp Sao lưu (.json)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer">
            <Upload className="w-4 h-4 text-teal-600" />
            <span>Khôi phục từ tệp Sao lưu (.json)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleBackupImport}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            {importStatus}
          </p>
        )}
      </div>

      {/* Demo vs Real Class Mode Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Quản lý Dữ liệu Mẫu & Chế độ Thực tế</span>
        </h3>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-2 leading-relaxed">
          <p>
            Hiện tại ứng dụng đang có sẵn <strong>20 học sinh minh họa mẫu</strong> để cô giáo trải nghiệm
            đầy đủ các tính năng (điểm danh, nhiệm vụ, thi đua tuần, trợ lý AI).
          </p>
          <p>
            Khi bắt đầu áp dụng cho <strong>Lớp 6/13 thật ngoài đời</strong>, cô giáo có thể bấm nút
            <strong> "Bắt đầu lớp học thực tế"</strong> bên dưới để xóa các học sinh mẫu và sẵn sàng nhập danh sách thật từ Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => {
              if (window.confirm('Xác nhận đặt lại toàn bộ dữ liệu mẫu ban đầu để kiểm thử?')) {
                onResetDemo();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Khôi phục lại dữ liệu mẫu (Demo)</span>
          </button>

          <button
            onClick={() => {
              if (
                window.confirm(
                  'Bạn có chắc chắn muốn xóa dữ liệu mẫu để bắt đầu lớp học thực tế không? Thao tác này sẽ xóa học sinh mẫu để bạn nhập danh sách mới.'
                )
              ) {
                onClearForReal();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bắt đầu Lớp học thực tế (Xóa mẫu)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
