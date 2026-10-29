import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Phone,
  Sparkles,
  Check,
  X,
  Filter,
  ClipboardPaste,
  History,
  RefreshCw,
  CheckCircle2,
  Trash,
} from 'lucide-react';
import { Student, GroupName, Gender } from '../types';
import { StorageService, isMockStudent } from '../services/storage';
import confetti from 'canvas-confetti';

interface StudentsTabProps {
  students: Student[];
  onUpdateStudents: (newStudents: Student[]) => void;
  onSelectStudent: (student: Student) => void;
}

const COMMON_ATTENTION_TAGS = [
  'Cần rèn chữ viết',
  'Cần rèn thói quen chuẩn bị bài',
  'Cần cải thiện việc tập trung',
  'Cần rèn tính tự giác',
  'Cần phát triển kỹ năng giao tiếp',
  'Cần xây dựng mối quan hệ tích cực với bạn bè',
  'Cần được động viên, ghi nhận thường xuyên',
  'Có tiến bộ cần biểu dương',
];

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  onUpdateStudents,
  onSelectStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [onlyAttention, setOnlyAttention] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<'file' | 'paste' | 'history'>('file');
  const [pastedText, setPastedText] = useState('');
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [parsedPreviewStudents, setParsedPreviewStudents] = useState<Student[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isParsingFile, setIsParsingFile] = useState(false);

  // Detect if any mock students still remain in current state
  const mockStudentsCount = useMemo(
    () => students.filter((s) => isMockStudent(s)).length,
    [students]
  );
  const lastImportedList = useMemo(() => StorageService.getLastImportedExcel(), [isImportModalOpen]);

  // Form state
  const [formData, setFormData] = useState<Partial<Student>>({
    code: '',
    fullName: '',
    dob: '2014-01-01',
    gender: 'Nam',
    group: 'Tổ 1',
    guardianName: '',
    guardianRelationship: 'Bố',
    guardianPhone: '',
    address: '',
    notesStudy: '',
    notesDiscipline: '',
    strengths: '',
    personalGoals: '',
    supportMeasures: '',
    needsAttention: false,
    attentionTags: [],
  });

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.guardianPhone.includes(searchTerm);

      const matchGroup = selectedGroup === 'all' || s.group === selectedGroup;
      const matchAttention = !onlyAttention || s.needsAttention || s.attentionTags.length > 0;
      const matchTag = selectedTag === 'all' || s.attentionTags.includes(selectedTag);

      return matchSearch && matchGroup && matchAttention && matchTag;
    });
  }, [students, searchTerm, selectedGroup, onlyAttention, selectedTag]);

  // Open add modal
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      code: `HS613${String(students.length + 1).padStart(2, '0')}`,
      fullName: '',
      dob: '2014-01-01',
      gender: 'Nam',
      group: 'Tổ 1',
      guardianName: '',
      guardianRelationship: 'Bố',
      guardianPhone: '',
      address: '',
      notesStudy: '',
      notesDiscipline: '',
      strengths: '',
      personalGoals: '',
      supportMeasures: '',
      needsAttention: false,
      attentionTags: [],
    });
    setIsAddEditOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudent(student);
    setFormData({ ...student });
    setIsAddEditOpen(true);
  };

  // Save student (add or update)
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.fullName.trim()) return;

    // Check duplicate code
    const code = (formData.code || '').trim().toUpperCase();
    const isDuplicate = students.some(
      (s) => s.code.toUpperCase() === code && s.id !== editingStudent?.id
    );

    if (isDuplicate) {
      alert(`Mã học sinh "${code}" đã tồn tại. Vui lòng nhập mã học sinh khác.`);
      return;
    }

    if (editingStudent) {
      // Update
      const updated = students.map((s) =>
        s.id === editingStudent.id ? ({ ...s, ...formData } as Student) : s
      );
      onUpdateStudents(updated);
    } else {
      // Add
      const newStudent: Student = {
        id: `hs-${Date.now()}`,
        code: code || `HS613${String(students.length + 1).padStart(2, '0')}`,
        fullName: formData.fullName.trim(),
        dob: formData.dob || '2014-01-01',
        gender: (formData.gender as Gender) || 'Nam',
        group: (formData.group as GroupName) || 'Tổ 1',
        guardianName: (formData.guardianName || '').trim() || 'Phụ huynh',
        guardianRelationship: formData.guardianRelationship || 'Bố',
        guardianPhone: (formData.guardianPhone || '').trim(),
        address: (formData.address || '').trim(),
        notesStudy: (formData.notesStudy || '').trim(),
        notesDiscipline: (formData.notesDiscipline || '').trim(),
        strengths: (formData.strengths || '').trim(),
        personalGoals: (formData.personalGoals || '').trim(),
        supportMeasures: (formData.supportMeasures || '').trim(),
        needsAttention: (formData.attentionTags || []).length > 0 || !!formData.needsAttention,
        attentionTags: formData.attentionTags || [],
        createdAt: new Date().toISOString(),
      };
      onUpdateStudents([...students, newStudent]);
    }
    setIsAddEditOpen(false);
  };

  // Delete student with confirm
  const handleDeleteConfirm = () => {
    if (!studentToDelete) return;
    const remaining = students.filter((s) => s.id !== studentToDelete.id);
    onUpdateStudents(remaining);
    setStudentToDelete(null);
  };

  // Handle Excel Import file selection & parse for preview
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setImportErrors([]);
    setImportSummary(null);

    const result = await StorageService.parseStudentsFile(file);
    setIsParsingFile(false);

    if (result.success && result.data.length > 0) {
      setParsedPreviewStudents(result.data);
      setImportSummary(`Đã đọc thành công ${result.data.length} học sinh từ tệp Excel.`);
      setImportErrors(result.errors);
    } else {
      setParsedPreviewStudents([]);
      setImportErrors(result.errors.length ? result.errors : ['Không đọc được dữ liệu từ tệp đã chọn.']);
    }
  };

  // Confirm and apply import
  const handleConfirmImport = () => {
    if (parsedPreviewStudents.length === 0) return;

    let finalStudents: Student[] = [];

    if (importMode === 'replace') {
      finalStudents = [...parsedPreviewStudents];
    } else {
      // Append mode with duplicate code handling
      const existingCodes = new Set(students.map((s) => s.code.toUpperCase()));
      const cleaned = parsedPreviewStudents.map((item, idx) => {
        let code = item.code.toUpperCase();
        if (existingCodes.has(code)) {
          code = `HS613${String(students.length + idx + 1).padStart(2, '0')}`;
        }
        existingCodes.add(code);
        return { ...item, code };
      });
      finalStudents = [...students, ...cleaned];
    }

    onUpdateStudents(finalStudents);
    StorageService.saveLastImportedExcel(finalStudents);

    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    setToastMessage(`Đã cập nhật thành công danh sách lớp 6/13 (${finalStudents.length} học sinh)!`);
    setTimeout(() => setToastMessage(null), 4000);
    setIsImportModalOpen(false);
    setParsedPreviewStudents([]);
    setImportSummary(null);
    setImportErrors([]);
    setPastedText('');
  };

  // Explicit action to purge all auto-generated mock students
  const handlePurgeMockStudents = () => {
    const { deletedCount } = StorageService.purgeMockStudents();
    const cleanList = StorageService.getStudents();
    onUpdateStudents(cleanList);
    setToastMessage(`Đã xóa sạch ${deletedCount} học sinh mẫu tự tạo khỏi danh sách lớp!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Clear all students to re-import freshly from Excel
  const handleClearAllStudents = () => {
    onUpdateStudents([]);
    StorageService.saveStudents([]);
    setIsClearAllModalOpen(false);
    setToastMessage('Đã làm trống danh sách lớp để sẵn sàng nạp lại từ File Excel!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Parse directly pasted text copied from Excel (Ctrl + V)
  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    setIsParsingFile(true);
    setImportErrors([]);
    setImportSummary(null);

    const result = StorageService.parseStudentsPastedText(pastedText);
    setIsParsingFile(false);

    if (result.success && result.data.length > 0) {
      setParsedPreviewStudents(result.data);
      setImportSummary(`Đã nhận diện thành công ${result.data.length} học sinh từ bảng dữ liệu đã dán.`);
      setImportErrors(result.errors);
    } else {
      setParsedPreviewStudents([]);
      setImportErrors(result.errors.length ? result.errors : ['Không nhận diện được dòng dữ liệu học sinh nào.']);
    }
  };

  // Load last imported Excel file
  const handleLoadLastImported = () => {
    const last = StorageService.getLastImportedExcel();
    if (last.length > 0) {
      setParsedPreviewStudents(last);
      setImportSummary(`Đã tải lại ${last.length} học sinh từ tệp Excel đã lưu gần nhất.`);
      setImportErrors([]);
    } else {
      setImportErrors(['Chưa có bản lưu tệp Excel nào trước đó.']);
    }
  };

  // Toggle tag in form
  const toggleAttentionTag = (tag: string) => {
    const currentTags = formData.attentionTags || [];
    if (currentTags.includes(tag)) {
      setFormData({
        ...formData,
        attentionTags: currentTags.filter((t) => t !== tag),
      });
    } else {
      setFormData({
        ...formData,
        attentionTags: [...currentTags, tag],
        needsAttention: true,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Warning banner if mock students exist */}
      {mockStudentsCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-extrabold">Đang có {mockStudentsCount} học sinh mẫu tự tạo trước đó trong danh sách.</p>
              <p className="text-amber-800 text-[11px] mt-0.5">Cô có thể bấm xóa để danh sách chỉ còn đúng các em học sinh từ file Excel.</p>
            </div>
          </div>
          <button
            onClick={handlePurgeMockStudents}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 shadow-xs transition"
          >
            Xóa {mockStudentsCount} học sinh mẫu ngay
          </button>
        </div>
      )}

      {/* Prominent Excel Import Announcement Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500 via-emerald-600 to-sky-600 p-5 sm:p-6 text-white shadow-md shadow-teal-500/15">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Nhập dữ liệu tự động từ bảng tính</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              Nhập danh sách học sinh Lớp 6/13 từ tệp Excel (.xlsx / .csv)
            </h2>
            <p className="mt-1 text-xs text-teal-50 leading-relaxed">
              Cô giáo có thể tải tệp mẫu chuẩn, điền danh sách học sinh theo các cột (Họ tên, Ngày sinh, Tổ, Phụ huynh, SĐT...) rồi tải lên hoặc dán trực tiếp. Hệ thống hiển thị bảng xem trước để cô kiểm tra trước khi lưu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => StorageService.downloadSampleExcelTemplate()}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/20 backdrop-blur-sm transition"
              title="Tải về tệp mẫu Excel có sẵn các cột và hướng dẫn"
            >
              <Download className="w-4 h-4" />
              <span>Tải tệp mẫu Excel chuẩn</span>
            </button>

            {lastImportedList.length > 0 && (
              <button
                onClick={() => {
                  setImportTab('history');
                  handleLoadLastImported();
                  setIsImportModalOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow-md transition"
                title="Xem lại và nạp danh sách từ file Excel đã tải lên gần đây"
              >
                <History className="w-4 h-4" />
                <span>Xem lại Excel đã nhập ({lastImportedList.length})</span>
              </button>
            )}

            <button
              onClick={() => {
                setImportTab('file');
                setParsedPreviewStudents([]);
                setImportErrors([]);
                setImportSummary(null);
                setIsImportModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-teal-800 font-extrabold text-xs shadow-md hover:bg-teal-50 active:scale-95 transition"
            >
              <Upload className="w-4 h-4 text-teal-600" />
              <span>Tải lên tệp Excel của lớp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Danh sách Học sinh Lớp 6/13</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold">
              {students.length} học sinh
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi hồ sơ, chuyên cần, nề nếp và định hướng giáo dục nhân ái cho từng em
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => StorageService.downloadSampleExcelTemplate()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            title="Tải tệp mẫu Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Tải</span> Mẫu Excel
          </button>

          <button
            onClick={() => StorageService.exportStudentsExcel(students)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => {
              setImportTab('file');
              setParsedPreviewStudents([]);
              setImportErrors([]);
              setImportSummary(null);
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition"
          >
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            <span>Nhập từ Excel</span>
          </button>

          {students.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
              title="Xóa hết danh sách hiện tại để nạp lại từ file Excel"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa để nạp lại</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm học sinh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, mã học sinh hoặc số điện thoại phụ huynh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="all">Tất cả tổ</option>
              <option value="Tổ 1">Tổ 1</option>
              <option value="Tổ 2">Tổ 2</option>
              <option value="Tổ 3">Tổ 3</option>
              <option value="Tổ 4">Tổ 4</option>
            </select>

            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="all">Mọi nhu cầu hỗ trợ</option>
              {COMMON_ATTENTION_TAGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              onClick={() => setOnlyAttention(!onlyAttention)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 whitespace-nowrap ${
                onlyAttention
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Cần quan tâm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Grid Cards or Empty State */}
      {students.length === 0 ? (
        <div className="bg-gradient-to-b from-white to-sky-50/40 p-8 sm:p-12 rounded-3xl border-2 border-dashed border-sky-200 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-inner">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div className="max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã xóa toàn bộ học sinh mẫu tự tạo trước đó</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Sẵn sàng nạp danh sách học sinh Lớp 6/13 từ File Excel
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Cô Đỗ Kim Anh có thể chọn tệp Excel của lớp, dán trực tiếp bảng từ Excel hoặc xem lại tệp đã tải lên để áp dụng vào danh sách lớp.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setImportTab('file');
                setParsedPreviewStudents([]);
                setImportErrors([]);
                setImportSummary(null);
                setIsImportModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Tải lên tệp Excel của lớp</span>
            </button>

            <button
              onClick={() => {
                setImportTab('paste');
                setParsedPreviewStudents([]);
                setImportErrors([]);
                setImportSummary(null);
                setIsImportModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs border border-sky-200 transition"
            >
              <ClipboardPaste className="w-4 h-4 text-sky-600" />
              <span>Dán bảng từ Excel (Ctrl + V)</span>
            </button>

            {lastImportedList.length > 0 && (
              <button
                onClick={() => {
                  setImportTab('history');
                  handleLoadLastImported();
                  setIsImportModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition"
              >
                <History className="w-4 h-4 text-amber-600" />
                <span>Xem lại {lastImportedList.length} học sinh từ file Excel đã tải</span>
              </button>
            )}

            <button
              onClick={() => StorageService.downloadSampleExcelTemplate()}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition"
            >
              <Download className="w-4 h-4" />
              <span>Tải tệp mẫu Excel chuẩn</span>
            </button>
          </div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">Không tìm thấy học sinh theo bộ lọc</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thử tìm kiếm với từ khóa khác hoặc bỏ chọn các điều kiện lọc tổ/quan tâm.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const hasAttention = student.needsAttention || student.attentionTags.length > 0;
            return (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className={`group bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between ${
                  hasAttention
                    ? 'border-slate-200/90 hover:border-rose-300 bg-gradient-to-b from-white to-rose-50/20'
                    : 'border-slate-100 hover:border-sky-300'
                }`}
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-teal-500 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                        {student.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm group-hover:text-sky-600 transition">
                          {student.fullName}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {student.code} • {student.gender} • {student.group}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => handleOpenEdit(student, e)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                        title="Chỉnh sửa hồ sơ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStudentToDelete(student);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                        title="Xóa học sinh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Guardian details */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-sky-500" />
                      <span>{student.guardianName} ({student.guardianRelationship}): </span>
                      <span className="font-semibold text-slate-700">{student.guardianPhone}</span>
                    </p>
                    {student.strengths && (
                      <p className="flex items-center gap-1.5 text-emerald-700">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span className="truncate">{student.strengths}</span>
                      </p>
                    )}
                  </div>

                  {/* Attention tags */}
                  {student.attentionTags && student.attentionTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {student.attentionTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom detail action */}
                <div className="mt-4 pt-2.5 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-sky-600 group-hover:text-sky-700">
                  <span>Xem hồ sơ chi tiết</span>
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 bg-gradient-to-r from-sky-500 to-teal-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingStudent ? `Chỉnh sửa hồ sơ: ${editingStudent.fullName}` : 'Thêm học sinh mới vào Lớp 6/13'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã học sinh *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên học sinh *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổ</label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value as GroupName })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="Tổ 1">Tổ 1</option>
                    <option value="Tổ 2">Tổ 2</option>
                    <option value="Tổ 3">Tổ 3</option>
                    <option value="Tổ 4">Tổ 4</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ tên Phụ huynh / Giám hộ</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn B"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mối quan hệ</label>
                  <input
                    type="text"
                    placeholder="Bố / Mẹ / Ông bà"
                    value={formData.guardianRelationship}
                    onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa chỉ thường trú</label>
                <input
                  type="text"
                  placeholder="Số nhà, phố, phường, quận..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* Learning & Personality Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ghi chú học tập</label>
                  <textarea
                    rows={2}
                    placeholder="Học tốt môn nào, điểm cần lưu ý..."
                    value={formData.notesStudy}
                    onChange={(e) => setFormData({ ...formData, notesStudy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ghi chú nề nếp</label>
                  <textarea
                    rows={2}
                    placeholder="Ý thức, thái độ giao tiếp..."
                    value={formData.notesDiscipline}
                    onChange={(e) => setFormData({ ...formData, notesDiscipline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Điểm mạnh / Năng khiếu</label>
                  <input
                    type="text"
                    placeholder="Vẽ đẹp, đá bóng giỏi, tư duy toán tốt..."
                    value={formData.strengths}
                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mục tiêu rèn luyện</label>
                  <input
                    type="text"
                    placeholder="Rèn chữ, phát biểu nhiều hơn..."
                    value={formData.personalGoals}
                    onChange={(e) => setFormData({ ...formData, personalGoals: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biện pháp hỗ trợ của cô</label>
                <input
                  type="text"
                  placeholder="Giao việc, nhờ bạn cùng bàn nhắc nhở..."
                  value={formData.supportMeasures}
                  onChange={(e) => setFormData({ ...formData, supportMeasures: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* Attention Tags Checkboxes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Đánh dấu nội dung cần theo dõi, hỗ trợ:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COMMON_ATTENTION_TAGS.map((tag) => {
                    const isChecked = (formData.attentionTags || []).includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleAttentionTag(tag)}
                        className={`text-left px-3 py-2 rounded-xl border text-xs font-medium transition flex items-center justify-between ${
                          isChecked
                            ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{tag}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-rose-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition shadow-sm"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-slate-800 text-base">Xác nhận xóa học sinh</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bạn có chắc chắn muốn xóa học sinh <span className="font-bold text-slate-800">{studentToDelete.fullName}</span> ({studentToDelete.code}) khỏi danh sách lớp không?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel / CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-teal-600 to-sky-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-extrabold text-base">Nhập danh sách học sinh từ Excel / CSV</h3>
                  <p className="text-[11px] text-teal-100">
                    Lớp 6/13 • Tự động nhận diện các cột và kiểm tra tính toàn vẹn
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedPreviewStudents([]);
                }}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Template download & Instructions */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-teal-900">
                    💡 Hướng dẫn cấu trúc tệp Excel chuẩn:
                  </p>
                  <p className="text-teal-800 mt-0.5">
                    Tệp Excel cần có các cột: <strong>Họ và tên, Mã học sinh, Ngày sinh, Giới tính, Tổ, Họ tên phụ huynh, Số điện thoại</strong>...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => StorageService.downloadSampleExcelTemplate()}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải tệp mẫu (.xlsx)</span>
                </button>
              </div>

              {/* Import Method Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setImportTab('file')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    importTab === 'file'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>1. Chọn tệp Excel (.xlsx, .csv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportTab('paste')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    importTab === 'paste'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>2. Dán bảng từ Excel (Ctrl + V)</span>
                </button>

                {lastImportedList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setImportTab('history');
                      handleLoadLastImported();
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      importTab === 'history'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-amber-600" />
                    <span>3. Dữ liệu đã lưu gần nhất ({lastImportedList.length} HS)</span>
                  </button>
                )}
              </div>

              {/* Tab 1: File Upload */}
              {importTab === 'file' && (
                <div className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-6 text-center transition bg-slate-50/50">
                  <input
                    type="file"
                    id="excel-file-input"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="excel-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-teal-700 text-sm hover:underline">
                        Bấm vào đây để chọn tệp Excel từ máy tính / điện thoại
                      </span>
                      <p className="text-xs text-slate-500 mt-1">Hỗ trợ các định dạng .xlsx, .xls, .csv</p>
                    </div>
                  </label>
                </div>
              )}

              {/* Tab 2: Direct Paste from Excel / Sheets */}
              {importTab === 'paste' && (
                <div className="space-y-3 p-4 rounded-2xl bg-sky-50/60 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-sky-950 text-xs">
                      Sao chép các ô từ bảng Excel rồi Dán (Ctrl + V) vào khung bên dưới:
                    </label>
                    <span className="text-[11px] text-slate-500">Tự động nhận diện cột Họ tên, Ngày sinh, Tổ, SĐT</span>
                  </div>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={"1\tHS61301\tNguyễn An Khang\t12/03/2014\tNam\tTổ 1\tNguyễn Văn Hùng\t0903124589\n2\tHS61302\tTrần Bảo Anh\t25/07/2014\tNữ\tTổ 1\tLê Thị Thu Thủy\t0912445890"}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-sky-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      disabled={!pastedText.trim() || isParsingFile}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Phân tích dữ liệu vừa dán</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: History */}
              {importTab === 'history' && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-amber-950 text-xs">Bản lưu danh sách học sinh từ File Excel gần đây</p>
                      <p className="text-amber-800 text-[11px]">Số lượng: {lastImportedList.length} học sinh</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadLastImported}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Nạp vào bảng xem trước</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Warning or Error Messages */}
              {importErrors.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs max-h-36 overflow-y-auto space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Lưu ý khi đọc dữ liệu:</span>
                  </p>
                  {importErrors.map((err, i) => (
                    <p key={i} className="pl-5 text-slate-700">• {err}</p>
                  ))}
                </div>
              )}

              {/* Live Preview Section if Students Parsed */}
              {parsedPreviewStudents.length > 0 && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                      <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Đã nhận diện thành công: {parsedPreviewStudents.length} học sinh</span>
                    </div>

                    {/* Mode selection radio */}
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span>Thay thế toàn bộ lớp</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span>Thêm bổ sung ({students.length} cũ)</span>
                      </label>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700 z-10">
                        <tr>
                          <th className="p-2.5 w-12 text-center">STT</th>
                          <th className="p-2.5">Mã HS</th>
                          <th className="p-2.5">Họ và tên</th>
                          <th className="p-2.5">Ngày sinh</th>
                          <th className="p-2.5">Giới tính</th>
                          <th className="p-2.5">Tổ</th>
                          <th className="p-2.5">Phụ huynh</th>
                          <th className="p-2.5">Số điện thoại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedPreviewStudents.map((st, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition">
                            <td className="p-2.5 text-center text-slate-400 font-bold">{i + 1}</td>
                            <td className="p-2.5 font-bold text-sky-700">{st.code}</td>
                            <td className="p-2.5 font-extrabold text-slate-800">{st.fullName}</td>
                            <td className="p-2.5 text-slate-600">{st.dob}</td>
                            <td className="p-2.5 text-slate-600">{st.gender}</td>
                            <td className="p-2.5 font-semibold text-slate-700">{st.group}</td>
                            <td className="p-2.5 text-slate-600">{st.guardianName}</td>
                            <td className="p-2.5 font-medium text-slate-700">{st.guardianPhone || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedPreviewStudents([]);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition"
              >
                Hủy bỏ
              </button>

              {parsedPreviewStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Xác nhận nhập {parsedPreviewStudents.length} học sinh vào Lớp 6/13
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-slate-800 text-base">Làm trống danh sách lớp</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Thao tác này sẽ xóa toàn bộ <span className="font-bold text-slate-800">{students.length} học sinh</span> hiện tại khỏi danh sách để cô nạp lại từ File Excel chuẩn. Cô có chắc chắn muốn thực hiện?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleClearAllStudents}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
              >
                Xác nhận làm trống
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
