import React, { useState, useMemo } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  ArrowRight,
  Trash2,
  X,
  Edit2,
} from 'lucide-react';
import { Student, StudentQuickNote, DailyWeeklyTodo } from '../types';

interface QuickNotesTabProps {
  students: Student[];
  notes: StudentQuickNote[];
  onUpdateNotes: (notes: StudentQuickNote[]) => void;
  onAddTodo: (todo: DailyWeeklyTodo) => void;
}

const CATEGORIES = [
  'Học tập',
  'Chữ viết và trình bày',
  'Nề nếp và tự giác',
  'Giao tiếp và quan hệ bạn bè',
  'Cảm xúc và thích nghi',
  'Điểm mạnh và sở trường',
  'Việc tốt, tiến bộ',
  'Phối hợp gia đình',
  'Hỗ trợ cá nhân',
  'Khác',
] as const;

const NOTE_TEMPLATES = [
  {
    category: 'Nề nếp và tự giác',
    content: 'Học sinh cần được nhắc nhở nhẹ nhàng về việc chuẩn bị sách vở trước khi đến lớp. Tuần tới, giao nhiệm vụ tự kiểm tra cặp sách và ghi nhận khi em thực hiện tốt.',
    action: 'Giao tự kiểm cặp sách buổi tối, nhờ bạn kiểm tra chéo.',
  },
  {
    category: 'Giao tiếp và quan hệ bạn bè',
    content: 'Học sinh còn ít chủ động giao tiếp với bạn. Tạo cơ hội tham gia hoạt động nhóm nhỏ, phân công nhiệm vụ phù hợp và theo dõi sự tiến bộ.',
    action: 'Xếp nhóm cùng bạn hòa đồng trong tiết Hoạt động trải nghiệm.',
  },
  {
    category: 'Việc tốt, tiến bộ',
    content: 'Học sinh có tiến bộ trong việc hoàn thành bài tập. Tiếp tục động viên, ghi nhận cụ thể để duy trì động lực học tập.',
    action: 'Tuyên dương trước tiết sinh hoạt lớp.',
  },
  {
    category: 'Chữ viết và trình bày',
    content: 'Chữ viết còn hơi ẩu và chưa đều nét ở môn Ngữ văn. Hướng dẫn con ngồi ngay ngắn và nắn nót từng chữ.',
    action: 'Chấm vở riêng và khen thưởng khi viết tiến bộ.',
  },
];

export const QuickNotesTab: React.FC<QuickNotesTabProps> = ({
  students,
  notes,
  onUpdateNotes,
  onAddTodo,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formStudentId, setFormStudentId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState<(typeof CATEGORIES)[number]>('Học tập');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState<'Bình thường' | 'Quan trọng' | 'Cần chú ý ngay'>('Bình thường');
  const [formAction, setFormAction] = useState('');
  const [formRecheckDate, setFormRecheckDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        n.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'all' || n.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [notes, searchTerm, categoryFilter]);

  const handleApplyTemplate = (tpl: (typeof NOTE_TEMPLATES)[0]) => {
    setFormCategory(tpl.category as any);
    setFormContent(tpl.content);
    setFormAction(tpl.action);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === formStudentId);
    if (!student || !formContent.trim()) return;

    const newNote: StudentQuickNote = {
      id: `note-${Date.now()}`,
      studentId: student.id,
      studentName: student.fullName,
      group: student.group,
      date: formDate,
      category: formCategory,
      content: formContent.trim(),
      priority: formPriority,
      plannedAction: formAction.trim(),
      recheckDate: formRecheckDate,
      status: 'Đang theo dõi',
      createdAt: new Date().toISOString(),
    };

    onUpdateNotes([newNote, ...notes]);
    setIsAddModalOpen(false);
    setFormStudentId('');
    setFormContent('');
    setFormAction('');
  };

  const handleToggleStatus = (note: StudentQuickNote) => {
    const updated = notes.map((n) => {
      if (n.id === note.id) {
        return {
          ...n,
          status: (n.status === 'Đang theo dõi' ? 'Đã cải thiện' : 'Đang theo dõi') as any,
        };
      }
      return n;
    });
    onUpdateNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    onUpdateNotes(notes.filter((n) => n.id !== id));
  };

  // Convert note to todo
  const handleConvertToTodo = (note: StudentQuickNote) => {
    const newTodo: DailyWeeklyTodo = {
      id: `todo-${Date.now()}`,
      title: `Theo dõi học sinh ${note.studentName}: ${note.plannedAction || note.content.slice(0, 50)}`,
      scope: 'daily',
      dueDate: note.recheckDate || new Date().toISOString().split('T')[0],
      priority: note.priority === 'Cần chú ý ngay' ? 'high' : 'medium',
      isCompleted: false,
      category: 'Hỗ trợ học sinh',
      linkedStudentId: note.studentId,
      note: note.content,
      createdAt: new Date().toISOString(),
    };
    onAddTodo(newTodo);
    alert(`Đã thêm việc "${newTodo.title}" vào Kế hoạch việc cần làm!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Ghi Chú Nhanh Học Sinh</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {notes.length} ghi chú
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận chỉ trong vài giây, tôn trọng sự riêng tư và theo dõi tiến bộ của học sinh
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi chú mới</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh hoặc từ khóa nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="all">Mọi nhóm nội dung</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <StickyNote className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">Chưa có ghi chú nào phù hợp</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`bg-white p-5 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                note.status === 'Đã cải thiện'
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : note.priority === 'Cần chú ý ngay'
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-100 hover:border-amber-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{note.studentName}</h3>
                    <p className="text-[11px] text-slate-400">
                      {note.group} • {note.date}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      note.priority === 'Cần chú ý ngay'
                        ? 'bg-rose-100 text-rose-800'
                        : note.priority === 'Quan trọng'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {note.category}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-700 leading-relaxed">{note.content}</p>

                {note.plannedAction && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700">
                    <span className="font-bold text-sky-800">👉 Dự kiến:</span> {note.plannedAction}
                  </div>
                )}

                {note.recheckDate && (
                  <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Kiểm tra lại: {note.recheckDate}</span>
                  </p>
                )}
              </div>

              {/* Action footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggleStatus(note)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    note.status === 'Đã cải thiện'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {note.status}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleConvertToTodo(note)}
                    className="p-1 text-sky-600 hover:bg-sky-50 rounded"
                    title="Chuyển thành việc cần làm"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Xóa ghi chú"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">Thêm ghi chú nhanh học sinh</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Buttons */}
            <div>
              <span className="block text-xs font-bold text-slate-700 mb-1.5">Chọn mẫu ghi chú nhanh:</span>
              <div className="flex flex-wrap gap-1.5">
                {NOTE_TEMPLATES.map((tpl, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition"
                  >
                    {tpl.category}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chọn học sinh *</label>
                  <select
                    required
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.group})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhóm nội dung</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú ngắn *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi nhận cụ thể, mang tính mô tả khách quan, tôn trọng học sinh..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Việc giáo viên dự định thực hiện</label>
                <input
                  type="text"
                  placeholder="VD: Nhắc nhở riêng, phân công nhiệm vụ trong tổ..."
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="Bình thường">Bình thường</option>
                    <option value="Quan trọng">Quan trọng</option>
                    <option value="Cần chú ý ngay">Cần chú ý ngay</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày kiểm tra lại</label>
                  <input
                    type="date"
                    value={formRecheckDate}
                    onChange={(e) => setFormRecheckDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold"
                >
                  Lưu ghi chú
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
