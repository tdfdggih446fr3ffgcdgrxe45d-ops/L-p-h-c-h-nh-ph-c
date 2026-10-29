import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Home,
  Calendar,
  Sparkles,
  Heart,
  CheckCircle2,
  Clock,
  BookOpen,
  MessageCircle,
  AlertCircle,
  FileText,
  Shield,
  Edit3,
  Save,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Send,
  HelpCircle,
  Info,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  TaskItem,
  StudentQuickNote,
  EducationGuidancePlan,
  ParentContactLog,
  Gender,
  GroupName,
} from '../types';

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onAddNote?: (note: StudentQuickNote) => void;
  onAddContact?: (contact: ParentContactLog) => void;
  onAddGuidancePlan?: (plan: EducationGuidancePlan) => void;
  attendance: AttendanceRecord[];
  tasks: TaskItem[];
  notes: StudentQuickNote[];
  guidancePlans: EducationGuidancePlan[];
  contacts: ParentContactLog[];
}

const COMMON_ATTENTION_TAGS = [
  'Cần rèn chữ viết',
  'Cần rèn thói quen chuẩn bị bài',
  'Cần cải thiện việc tập trung',
  'Cần rèn tính tự giác',
  'Phát triển kỹ năng làm việc nhóm',
  'Cần hỗ trợ hòa nhập bạn bè',
  'Hay quên sách vở/đồ dùng',
  'Hay đi học muộn',
  'Chưa tích cực phát biểu',
  'Cần kèm thêm môn Toán',
  'Cần kèm thêm môn Ngữ Văn',
  'Cần kèm thêm môn Tiếng Anh',
  'Có năng khiếu nổi bật',
  'Cần động viên, khích lệ tự tin',
];

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onUpdateStudent,
  onAddNote,
  onAddContact,
  onAddGuidancePlan,
  attendance,
  tasks,
  notes,
  guidancePlans,
  contacts,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'attendance' | 'tasks' | 'notes' | 'guidance' | 'contacts'
  >('overview');

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Student>({ ...student });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');

  // Quick note add form state inside modal
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [newNoteCategory, setNewNoteCategory] = useState<StudentQuickNote['category']>('Học tập');
  const [newNotePriority, setNewNotePriority] = useState<StudentQuickNote['priority']>('Bình thường');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNotePlannedAction, setNewNotePlannedAction] = useState('');
  const [newNoteRecheckDate, setNewNoteRecheckDate] = useState('');

  // Quick parent contact add form state inside modal
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactTopic, setNewContactTopic] = useState('');
  const [newContactChannel, setNewContactChannel] = useState<ParentContactLog['channel']>('Zalo');
  const [newContactSummary, setNewContactSummary] = useState('');
  const [newContactOutcome, setNewContactOutcome] = useState('');
  const [newContactNextAction, setNewContactNextAction] = useState('');
  const [newContactStatus, setNewContactStatus] = useState<ParentContactLog['status']>('Đã hoàn thành');

  // Quick guidance plan add state
  const [showAddGuidanceForm, setShowAddGuidanceForm] = useState(false);
  const [newGuidanceBehavior, setNewGuidanceBehavior] = useState('');
  const [newGuidanceContext, setNewGuidanceContext] = useState('');
  const [newGuidanceGoals, setNewGuidanceGoals] = useState('');
  const [newGuidanceScript, setNewGuidanceScript] = useState('');
  const [newGuidanceParentMsg, setNewGuidanceParentMsg] = useState('');

  // Synchronize editForm when student prop updates
  useEffect(() => {
    setEditForm({ ...student });
  }, [student]);

  const studentAttendance = attendance.filter((a) => a.studentId === student.id);
  const studentTasks = tasks.filter(
    (t) =>
      t.targetStudentId === student.id ||
      t.assignedToType === 'all' ||
      (t.assignedToType === 'group' && t.targetGroup === student.group)
  );
  const studentNotes = notes.filter((n) => n.studentId === student.id);
  const studentPlans = guidancePlans.filter((g) => g.studentId === student.id);
  const studentContacts = contacts.filter((c) => c.studentId === student.id);

  // Attendance statistics
  const presentCount = studentAttendance.filter((a) => a.status === 'present').length;
  const excusedCount = studentAttendance.filter((a) => a.status === 'excused').length;
  const unexcusedCount = studentAttendance.filter((a) => a.status === 'unexcused').length;
  const lateCount = studentAttendance.filter((a) => a.status === 'late').length;

  const handleToggleTag = (tag: string) => {
    const currentTags = editForm.attentionTags || [];
    if (currentTags.includes(tag)) {
      setEditForm({
        ...editForm,
        attentionTags: currentTags.filter((t) => t !== tag),
      });
    } else {
      setEditForm({
        ...editForm,
        attentionTags: [...currentTags, tag],
      });
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    const currentTags = editForm.attentionTags || [];
    if (!currentTags.includes(trimmed)) {
      setEditForm({
        ...editForm,
        attentionTags: [...currentTags, trimmed],
      });
    }
    setCustomTagInput('');
  };

  const handleSaveProfileChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) {
      alert('Vui lòng nhập họ và tên học sinh.');
      return;
    }

    const updated: Student = {
      ...editForm,
      fullName: editForm.fullName.trim(),
      code: editForm.code.trim().toUpperCase(),
      guardianName: (editForm.guardianName || '').trim(),
      guardianPhone: (editForm.guardianPhone || '').trim(),
      address: (editForm.address || '').trim(),
      notesStudy: (editForm.notesStudy || '').trim(),
      notesDiscipline: (editForm.notesDiscipline || '').trim(),
      strengths: (editForm.strengths || '').trim(),
      personalGoals: (editForm.personalGoals || '').trim(),
      supportMeasures: (editForm.supportMeasures || '').trim(),
      needsAttention: (editForm.attentionTags || []).length > 0 || editForm.needsAttention,
    };

    onUpdateStudent(updated);
    setIsEditing(false);
    setSaveSuccessMsg('Đã cập nhật hồ sơ thực tế thành công!');
    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 3500);
  };

  // Submit new note
  const handleSubmitNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) {
      alert('Vui lòng nhập nội dung ghi chú quan sát thực tế.');
      return;
    }

    const newNote: StudentQuickNote = {
      id: `note-${Date.now()}`,
      studentId: student.id,
      studentName: student.fullName,
      group: student.group,
      date: new Date().toISOString().split('T')[0],
      category: newNoteCategory,
      content: newNoteContent.trim(),
      priority: newNotePriority,
      plannedAction: newNotePlannedAction.trim(),
      recheckDate: newNoteRecheckDate || undefined,
      status: 'Đang theo dõi',
      createdAt: new Date().toISOString(),
    };

    if (onAddNote) {
      onAddNote(newNote);
    }
    setNewNoteContent('');
    setNewNotePlannedAction('');
    setNewNoteRecheckDate('');
    setShowAddNoteForm(false);
    setSaveSuccessMsg('Đã thêm ghi chú thực tế mới vào hồ sơ!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Submit new contact log
  const handleSubmitNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactTopic.trim() || !newContactSummary.trim()) {
      alert('Vui lòng nhập chủ đề và tóm tắt nội dung trao đổi.');
      return;
    }

    const newContact: ParentContactLog = {
      id: `contact-${Date.now()}`,
      studentId: student.id,
      studentName: student.fullName,
      guardianName: student.guardianName || 'Phụ huynh',
      date: new Date().toISOString().split('T')[0],
      topic: newContactTopic.trim(),
      summary: newContactSummary.trim(),
      channel: newContactChannel,
      outcome: newContactOutcome.trim() || 'Phụ huynh đã tiếp nhận thông tin và phối hợp cùng cô.',
      nextAction: newContactNextAction.trim(),
      status: newContactStatus,
    };

    if (onAddContact) {
      onAddContact(newContact);
    }
    setNewContactTopic('');
    setNewContactSummary('');
    setNewContactOutcome('');
    setNewContactNextAction('');
    setShowAddContactForm(false);
    setSaveSuccessMsg('Đã ghi nhật ký liên hệ phụ huynh vào hồ sơ!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Submit new guidance plan
  const handleSubmitNewGuidance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuidanceBehavior.trim()) {
      alert('Vui lòng nhập mô tả hành vi quan sát.');
      return;
    }

    const newPlan: EducationGuidancePlan = {
      id: `plan-${Date.now()}`,
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.code,
      date: new Date().toISOString().split('T')[0],
      behaviorDescription: newGuidanceBehavior.trim(),
      timeContext: newGuidanceContext.trim() || 'Trong các tiết học tại lớp',
      frequency: 'Quan sát thực tế trong tuần',
      knownContext: 'Được ghi nhận từ quá trình giảng dạy của GVCN',
      actionsTaken: 'Cô đã gặp riêng trao đổi, khích lệ và giao nhiệm vụ vừa sức',
      initialResults: 'Em hợp tác tốt, lắng nghe cô chỉ bảo',
      aiResult: {
        situationSummary: `Tình huống quan sát thực tế ở học sinh ${student.fullName}: ${newGuidanceBehavior.trim()}`,
        educationGoals: newGuidanceGoals.trim() || 'Giúp em nhận biết hành vi, nâng cao tính tự giác và hòa đồng cùng tập thể.',
        causeExplorationQuestions: [
          'Điều gì làm con cảm thấy khó khăn nhất trong việc này?',
          'Cô và các bạn có thể làm gì để hỗ trợ con tốt hơn?',
        ],
        communicationScript: newGuidanceScript.trim() || `Cô Kim Anh nhận thấy con rất có tiềm năng và mong muốn con tiến bộ từng ngày. Chúng ta cùng cố gắng nhé!`,
        educationSteps: [
          'Gặp riêng trao đổi nhẹ nhàng, không phê bình trước lớp',
          'Thiết lập mục tiêu nhỏ theo từng ngày/tuần',
          'Biểu dương ngay khi em có tiến bộ dù nhỏ',
        ],
        parentMessageDraft: newGuidanceParentMsg.trim() || `Kính gửi Phụ huynh em ${student.fullName}, cô Kim Anh muốn chia sẻ tình hình học tập và nhờ gia đình cùng khích lệ em rèn luyện thêm tại nhà.`,
        postEducationTracking: 'Theo dõi sự thay đổi trong 1-2 tuần tiếp theo.',
        evaluationCriteria: 'Em có ý thức tự giác hơn và hợp tác tích cực với thầy cô và các bạn.',
      },
      status: 'Đang thực hiện',
    };

    if (onAddGuidancePlan) {
      onAddGuidancePlan(newPlan);
    }
    setNewGuidanceBehavior('');
    setNewGuidanceContext('');
    setNewGuidanceGoals('');
    setNewGuidanceScript('');
    setNewGuidanceParentMsg('');
    setShowAddGuidanceForm(false);
    setSaveSuccessMsg('Đã tạo kế hoạch định hướng giáo dục mới cho em!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const subTabs = [
    { key: 'overview', label: 'Hồ sơ & Đặc điểm', icon: User },
    { key: 'attendance', label: `Chuyên cần (${studentAttendance.length})`, icon: Calendar },
    { key: 'tasks', label: `Nhiệm vụ (${studentTasks.length})`, icon: CheckCircle2 },
    { key: 'notes', label: `Ghi chú (${studentNotes.length})`, icon: FileText },
    { key: 'guidance', label: `Định hướng GD (${studentPlans.length})`, icon: Heart },
    { key: 'contacts', label: `Phối hợp PH (${studentContacts.length})`, icon: MessageCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-500 via-sky-600 to-teal-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-xl shadow-inner border border-white/25 shrink-0">
              {student.fullName ? student.fullName.charAt(0) : 'E'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">
                  {student.fullName}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/25 font-bold">
                  {student.code}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/25 font-bold">
                  {student.group}
                </span>
                {student.needsAttention && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/90 text-white font-bold flex items-center gap-1 shadow-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>Cần quan tâm</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-sky-100 mt-1 flex flex-wrap items-center gap-2">
                <span>{student.gender}</span>
                <span>•</span>
                <span>Sinh: {student.dob ? new Date(student.dob).toLocaleDateString('vi-VN') : '---'}</span>
                <span>•</span>
                <span>PH: {student.guardianName || 'Chưa cập nhật'} ({student.guardianRelationship || 'PH'}) - {student.guardianPhone || 'Chưa có SĐT'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEditing ? (
              <button
                onClick={() => {
                  setEditForm({ ...student });
                  setIsEditing(true);
                  setActiveSubTab('overview');
                }}
                className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition flex items-center gap-1.5 text-xs font-bold border border-white/20 shadow-xs active:scale-95"
                title="Chỉnh sửa cập nhật hồ sơ thực tế"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Cập nhật hồ sơ</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditForm({ ...student });
                  setIsEditing(false);
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-semibold"
              >
                Hủy sửa
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
              title="Đóng hồ sơ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-500 text-white px-6 py-2.5 text-xs font-bold flex items-center gap-2 shadow-xs shrink-0 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Sub-tab Navigation */}
        <div className="border-b border-slate-100 px-6 bg-slate-50/70 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex space-x-2 py-2">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveSubTab(tab.key as any);
                    if (tab.key !== 'overview' && isEditing) {
                      setIsEditing(false);
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-sky-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-tab Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW & PROFILE EDIT */}
          {activeSubTab === 'overview' && (
            <div>
              {isEditing ? (
                /* INLINE EDIT MODE: Full update according to real changes */
                <form onSubmit={handleSaveProfileChanges} className="space-y-6">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <p className="font-bold">Chế độ cập nhật hồ sơ thực tế của học sinh</p>
                      <p className="mt-0.5">
                        Cô Kim Anh có thể chỉnh sửa mọi thông tin hồ sơ theo thực tế hiện tại. Sau khi bấm <strong>"Lưu thay đổi hồ sơ thực tế"</strong>, dữ liệu sẽ lập tức được lưu vĩnh viễn và đồng bộ trên toàn ứng dụng.
                      </p>
                    </div>
                  </div>

                  {/* SECTION 1: THÔNG TIN HỌC SINH CƠ BẢN */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-600" />
                      <span>1. Thông tin học sinh cơ bản</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Họ và tên học sinh <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                          placeholder="VD: Nguyễn Văn An"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mã học sinh <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.code}
                          onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white font-mono uppercase"
                          placeholder="VD: HS61301"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tổ sinh hoạt
                        </label>
                        <select
                          value={editForm.group}
                          onChange={(e) => setEditForm({ ...editForm, group: e.target.value as GroupName })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                        >
                          <option value="Tổ 1">Tổ 1</option>
                          <option value="Tổ 2">Tổ 2</option>
                          <option value="Tổ 3">Tổ 3</option>
                          <option value="Tổ 4">Tổ 4</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          value={editForm.dob}
                          onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Giới tính
                        </label>
                        <div className="flex gap-2">
                          {(['Nam', 'Nữ'] as Gender[]).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, gender: g })}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                                editForm.gender === g
                                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: GIA ĐÌNH & PHỤ HUYNH */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>2. Gia đình, Phụ huynh & Liên lạc thực tế</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Họ tên phụ huynh / người giám hộ
                        </label>
                        <input
                          type="text"
                          value={editForm.guardianName}
                          onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                          placeholder="VD: Trần Văn Bình"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mối quan hệ
                        </label>
                        <select
                          value={editForm.guardianRelationship}
                          onChange={(e) => setEditForm({ ...editForm, guardianRelationship: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                        >
                          <option value="Bố">Bố</option>
                          <option value="Mẹ">Mẹ</option>
                          <option value="Ông">Ông</option>
                          <option value="Bà">Bà</option>
                          <option value="Người giám hộ">Người giám hộ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Số điện thoại liên hệ
                        </label>
                        <input
                          type="tel"
                          value={editForm.guardianPhone}
                          onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                          placeholder="VD: 0912345678"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Địa chỉ cư trú / Nơi ở hiện tại
                        </label>
                        <input
                          type="text"
                          value={editForm.address || ''}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                          placeholder="VD: Số nhà ..., Tổ dân phố ..., Quận / Huyện ..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: ĐẶC ĐIỂM, NĂNG LỰC & MỤC TIÊU PHÁT TRIỂN */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>3. Đặc điểm cá nhân, Năng lực & Biện pháp hỗ trợ</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Điểm mạnh, năng khiếu nổi bật
                        </label>
                        <textarea
                          rows={2}
                          value={editForm.strengths || ''}
                          onChange={(e) => setEditForm({ ...editForm, strengths: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                          placeholder="VD: Tiếp thu bài nhanh, vẽ đẹp, nhiệt tình giúp đỡ bạn bè..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mục tiêu rèn luyện cá nhân
                        </label>
                        <textarea
                          rows={2}
                          value={editForm.personalGoals || ''}
                          onChange={(e) => setEditForm({ ...editForm, personalGoals: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                          placeholder="VD: Rèn chữ viết cẩn thận hơn, tự giác chuẩn bị bài trước khi đến lớp..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Biện pháp hỗ trợ của cô Kim Anh
                        </label>
                        <textarea
                          rows={2}
                          value={editForm.supportMeasures || ''}
                          onChange={(e) => setEditForm({ ...editForm, supportMeasures: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                          placeholder="VD: Phân công bạn tổ trưởng kèm cặp, khen ngợi động viên kịp thời..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: GHI CHÚ SƯ PHẠM */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-sky-600" />
                      <span>4. Ghi chú sư phạm (Học tập & Nề nếp)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ghi chú học tập thực tế
                        </label>
                        <textarea
                          rows={3}
                          value={editForm.notesStudy || ''}
                          onChange={(e) => setEditForm({ ...editForm, notesStudy: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                          placeholder="Ghi nhận về học lực, khả năng tiếp thu các môn, tình hình làm bài tập..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ghi chú nề nếp & đạo đức thực tế
                        </label>
                        <textarea
                          rows={3}
                          value={editForm.notesDiscipline || ''}
                          onChange={(e) => setEditForm({ ...editForm, notesDiscipline: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                          placeholder="Ghi nhận về ý thức kỷ luật, xếp hàng, giao tiếp với bạn bè và thầy cô..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5: NỘI DUNG THEO DÕI & HỖ TRỢ */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span>5. Nội dung cần theo dõi, hỗ trợ (Nhãn & Mức độ)</span>
                      </h4>
                      <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-rose-300 transition">
                        <input
                          type="checkbox"
                          checked={editForm.needsAttention}
                          onChange={(e) => setEditForm({ ...editForm, needsAttention: e.target.checked })}
                          className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                        />
                        <span className="text-xs font-bold text-slate-700">
                          Học sinh cần đặc biệt quan tâm
                        </span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500">
                        Bấm để chọn / bỏ chọn các nhãn nội dung rèn luyện cần theo dõi:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_ATTENTION_TAGS.map((tag) => {
                          const isSelected = (editForm.attentionTags || []).includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleTag(tag)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              <span>{tag}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom tag add */}
                      <div className="flex gap-2 pt-2 max-w-md">
                        <input
                          type="text"
                          value={customTagInput}
                          onChange={(e) => setCustomTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomTag();
                            }
                          }}
                          placeholder="Thêm nhãn theo dõi tùy chỉnh khác..."
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomTag}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
                        >
                          + Thêm nhãn
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* FORM ACTIONS */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm({ ...student });
                        setIsEditing(false);
                      }}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Lưu thay đổi hồ sơ thực tế</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEW MODE: High quality real profile cards */
                <div className="space-y-6">
                  {/* Action banner to update */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                        <Sparkles className="w-5 h-5 text-amber-200" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                          Hồ sơ rèn luyện thực tế: {student.fullName} ({student.code})
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tổ {student.group} • Cập nhật lần cuối: {student.createdAt ? new Date(student.createdAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditForm({ ...student });
                        setIsEditing(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Cập nhật hồ sơ thực tế</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Contact Info Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-sky-500" />
                        <span>Thông tin liên lạc & gia đình</span>
                      </h4>
                      <div className="space-y-2 text-xs text-slate-700">
                        <p>
                          <span className="text-slate-400 font-medium">Họ tên PH:</span>{' '}
                          <span className="font-bold text-slate-800">{student.guardianName || 'Chưa cập nhật'}</span>{' '}
                          <span className="text-slate-500">({student.guardianRelationship || 'Phụ huynh'})</span>
                        </p>
                        <p>
                          <span className="text-slate-400 font-medium">Số điện thoại:</span>{' '}
                          {student.guardianPhone ? (
                            <a
                              href={`tel:${student.guardianPhone}`}
                              className="font-bold text-sky-600 hover:underline"
                            >
                              {student.guardianPhone}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">Chưa có số điện thoại</span>
                          )}
                        </p>
                        <p>
                          <span className="text-slate-400 font-medium">Địa chỉ cư trú:</span>{' '}
                          <span className="text-slate-800">{student.address || 'Chưa cập nhật địa chỉ'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Strengths & Goals Card */}
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Điểm mạnh, năng khiếu & mục tiêu</span>
                      </h4>
                      <div className="space-y-2 text-xs text-slate-700">
                        <p>
                          <span className="text-emerald-800 font-bold">Điểm mạnh / Năng khiếu:</span>{' '}
                          <span>{student.strengths || 'Đang cập nhật'}</span>
                        </p>
                        <p>
                          <span className="text-emerald-800 font-bold">Mục tiêu rèn luyện cá nhân:</span>{' '}
                          <span>{student.personalGoals || 'Đang cập nhật'}</span>
                        </p>
                        <p>
                          <span className="text-emerald-800 font-bold">Biện pháp hỗ trợ của cô:</span>{' '}
                          <span>{student.supportMeasures || 'Khích lệ, quan tâm và đồng hành'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Study & Discipline Notes */}
                    <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-2.5">
                      <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                        <span>Ghi chú học tập</span>
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {student.notesStudy || 'Chưa có ghi chú đặc biệt về học tập.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2.5">
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ghi chú nề nếp & đạo đức</span>
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {student.notesDiscipline || 'Chấp hành tốt nội quy lớp học.'}
                      </p>
                    </div>

                    {/* Attention Tags */}
                    <div className="md:col-span-2 p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Nội dung đang được cô Kim Anh theo dõi, hỗ trợ</span>
                        </h4>
                        {student.needsAttention && (
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                            Học sinh cần cô quan tâm sát sao
                          </span>
                        )}
                      </div>

                      {student.attentionTags && student.attentionTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {student.attentionTags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          Học sinh duy trì nề nếp và học tập ổn định, hiện chưa có nội dung cần can thiệp đặc biệt.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHUYÊN CẦN */}
          {activeSubTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                  <p className="text-[11px] font-bold text-emerald-700">Có mặt</p>
                  <p className="text-xl font-black text-emerald-800 mt-1">{presentCount}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                  <p className="text-[11px] font-bold text-amber-700">Vắng có phép</p>
                  <p className="text-xl font-black text-amber-800 mt-1">{excusedCount}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-100 text-center">
                  <p className="text-[11px] font-bold text-orange-700">Đi muộn</p>
                  <p className="text-xl font-black text-orange-800 mt-1">{lateCount}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-center">
                  <p className="text-[11px] font-bold text-rose-700">Vắng không phép</p>
                  <p className="text-xl font-black text-rose-800 mt-1">{unexcusedCount}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lịch sử điểm danh chi tiết ({studentAttendance.length} lượt)
                </h4>
              </div>

              {studentAttendance.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                  Chưa có bản ghi điểm danh nào cho học sinh này. Dữ liệu sẽ xuất hiện khi cô điểm danh ở mục Điểm danh.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
                  {studentAttendance.map((rec) => (
                    <div key={rec.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">
                          {rec.date} ({rec.session})
                        </span>
                        {rec.reason && <p className="text-slate-500 text-[11px] mt-0.5">Lý do: {rec.reason}</p>}
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
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
          )}

          {/* TAB 3: NHIỆM VỤ */}
          {activeSubTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nhiệm vụ rèn luyện áp dụng cho em ({studentTasks.length})
                </h4>
              </div>

              {studentTasks.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                  Hiện không có nhiệm vụ nào được giao riêng cho em hoặc tổ của em.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {studentTasks.map((t) => (
                    <div key={t.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">{t.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-700">
                            Hạn: {t.dueDate}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {t.status === 'completed'
                              ? 'Đã xong'
                              : t.status === 'in_progress'
                              ? 'Đang làm'
                              : 'Chưa làm'}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-600">{t.description}</p>
                      {t.criteria && (
                        <p className="text-[11px] text-teal-700 font-medium">Tiêu chí: {t.criteria}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GHI CHÚ NHANH - CẬP NHẬT THỰC TẾ */}
          {activeSubTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Ghi chú quan sát thực tế ({studentNotes.length})
                </h4>
                <button
                  onClick={() => setShowAddNoteForm(!showAddNoteForm)}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddNoteForm ? 'Đóng biểu mẫu' : 'Thêm ghi chú mới'}</span>
                </button>
              </div>

              {/* Add Note Form */}
              {showAddNoteForm && (
                <form
                  onSubmit={handleSubmitNewNote}
                  className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-3 text-xs"
                >
                  <h5 className="font-bold text-teal-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-700" />
                    <span>Ghi nhận sự việc, nề nếp hoặc học tập thực tế của {student.fullName}</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phân loại ghi chú</label>
                      <select
                        value={newNoteCategory}
                        onChange={(e) => setNewNoteCategory(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Học tập">Học tập</option>
                        <option value="Chữ viết và trình bày">Chữ viết và trình bày</option>
                        <option value="Nề nếp và tự giác">Nề nếp và tự giác</option>
                        <option value="Giao tiếp và quan hệ bạn bè">Giao tiếp và bạn bè</option>
                        <option value="Cảm xúc và thích nghi">Cảm xúc và thích nghi</option>
                        <option value="Điểm mạnh và sở trường">Điểm mạnh và sở trường</option>
                        <option value="Việc tốt, tiến bộ">Việc tốt, tiến bộ</option>
                        <option value="Phối hợp gia đình">Phối hợp gia đình</option>
                        <option value="Hỗ trợ cá nhân">Hỗ trợ cá nhân</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mức độ ưu tiên</label>
                      <select
                        value={newNotePriority}
                        onChange={(e) => setNewNotePriority(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Bình thường">Bình thường</option>
                        <option value="Quan trọng">Quan trọng</option>
                        <option value="Cần chú ý ngay">Cần chú ý ngay</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nội dung quan sát thực tế <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="VD: Trong giờ học hôm nay, em đã chủ động giơ tay phát biểu 2 lần và giúp bạn cùng bàn hoàn thành bài tập..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Biện pháp / Việc cô Kim Anh dự kiến làm
                      </label>
                      <input
                        type="text"
                        value={newNotePlannedAction}
                        onChange={(e) => setNewNotePlannedAction(e.target.value)}
                        placeholder="VD: Khen ngợi em trước tổ, cộng 2 điểm thi đua tuần..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Ngày hẹn kiểm tra lại (tùy chọn)
                      </label>
                      <input
                        type="date"
                        value={newNoteRecheckDate}
                        onChange={(e) => setNewNoteRecheckDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddNoteForm(false)}
                      className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold shadow-xs"
                    >
                      Lưu ghi chú thực tế
                    </button>
                  </div>
                </form>
              )}

              {studentNotes.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                  Chưa có ghi chú nào cho học sinh này. Hãy bấm "+ Thêm ghi chú mới" ở trên để ghi lại quá trình quan sát thực tế.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                            {n.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              n.priority === 'Cần chú ý ngay'
                                ? 'bg-rose-100 text-rose-700'
                                : n.priority === 'Quan trọng'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {n.priority}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">{n.date}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-medium">{n.content}</p>
                      {n.plannedAction && (
                        <p className="text-[11px] text-sky-700 bg-sky-50/70 p-2 rounded-xl border border-sky-100">
                          👉 <strong>Dự kiến của cô:</strong> {n.plannedAction}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ĐỊNH HƯỚNG GIÁO DỤC TÍCH CỰC */}
          {activeSubTab === 'guidance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hồ sơ định hướng "Cùng em tiến bộ" ({studentPlans.length})
                </h4>
                <button
                  onClick={() => setShowAddGuidanceForm(!showAddGuidanceForm)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddGuidanceForm ? 'Đóng biểu mẫu' : 'Lập kế hoạch định hướng'}</span>
                </button>
              </div>

              {/* Add Guidance Plan Form */}
              {showAddGuidanceForm && (
                <form
                  onSubmit={handleSubmitNewGuidance}
                  className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-3 text-xs"
                >
                  <h5 className="font-bold text-sky-900 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-sky-700" />
                    <span>Lập kế hoạch định hướng giáo dục tích cực cho {student.fullName}</span>
                  </h5>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mô tả hành vi quan sát được thực tế <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={newGuidanceBehavior}
                      onChange={(e) => setNewGuidanceBehavior(e.target.value)}
                      placeholder="VD: Em hay nói chuyện riêng trong giờ Khoa học Tự nhiên và chưa tự giác ghi chép bài đầy đủ..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mục tiêu giáo dục cụ thể</label>
                      <input
                        type="text"
                        value={newGuidanceGoals}
                        onChange={(e) => setNewGuidanceGoals(e.target.value)}
                        placeholder="VD: Giúp em tập trung nghe giảng và hoàn thành 100% bài vở..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kịch bản cô trò chuyện nhẹ nhàng</label>
                      <input
                        type="text"
                        value={newGuidanceScript}
                        onChange={(e) => setNewGuidanceScript(e.target.value)}
                        placeholder="VD: Cô nhận thấy con tiếp thu rất nhanh, nếu con tập trung hơn con sẽ đạt điểm rất cao..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nội dung trao đổi / Tin nhắn phối hợp với PH</label>
                    <input
                      type="text"
                      value={newGuidanceParentMsg}
                      onChange={(e) => setNewGuidanceParentMsg(e.target.value)}
                      placeholder="VD: Nhờ gia đình nhắc nhở em chuẩn bị bài và kiểm tra vở ghi sau mỗi buổi học..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddGuidanceForm(false)}
                      className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold shadow-xs"
                    >
                      Lưu kế hoạch định hướng
                    </button>
                  </div>
                </form>
              )}

              {studentPlans.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                  Chưa có kế hoạch định hướng riêng cho học sinh này. Cô có thể bấm "+ Lập kế hoạch định hướng" ở trên hoặc dùng trợ lý AI ở mục Định hướng GD.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentPlans.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-2.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 text-sm">
                          Tình huống: {p.behaviorDescription}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                          {p.status}
                        </span>
                      </div>
                      <p className="text-slate-700">
                        <strong className="text-sky-800">Mục tiêu giáo dục:</strong> {p.aiResult.educationGoals}
                      </p>
                      <p className="text-slate-700">
                        <strong className="text-teal-800">Kịch bản trao đổi:</strong> "{p.aiResult.communicationScript}"
                      </p>
                      {p.aiResult.parentMessageDraft && (
                        <p className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-100">
                          📱 <strong>Tin nhắn PH:</strong> {p.aiResult.parentMessageDraft}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PHỐI HỢP PHỤ HUYNH - CẬP NHẬT THỰC TẾ */}
          {activeSubTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lịch sử trao đổi với phụ huynh ({studentContacts.length})
                </h4>
                <button
                  onClick={() => setShowAddContactForm(!showAddContactForm)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddContactForm ? 'Đóng biểu mẫu' : 'Ghi nhật ký liên hệ'}</span>
                </button>
              </div>

              {/* Add Parent Contact Form */}
              {showAddContactForm && (
                <form
                  onSubmit={handleSubmitNewContact}
                  className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3 text-xs"
                >
                  <h5 className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-700" />
                    <span>Ghi nhận lần trao đổi thực tế với Phụ huynh em {student.fullName}</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Chủ đề trao đổi <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newContactTopic}
                        onChange={(e) => setNewContactTopic(e.target.value)}
                        placeholder="VD: Trao đổi tình hình học tập và nề nếp tháng 9..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hình thức liên lạc</label>
                      <select
                        value={newContactChannel}
                        onChange={(e) => setNewContactChannel(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Zalo">Zalo</option>
                        <option value="Điện thoại">Điện thoại</option>
                        <option value="Gặp trực tiếp">Gặp trực tiếp</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tóm tắt nội dung trao đổi <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={newContactSummary}
                      onChange={(e) => setNewContactSummary(e.target.value)}
                      placeholder="VD: Cô thông báo tình hình em tiến bộ trong môn Toán, nhắc nhở gia đình kèm thêm môn Tiếng Anh..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Kết quả / Phản hồi của phụ huynh
                      </label>
                      <input
                        type="text"
                        value={newContactOutcome}
                        onChange={(e) => setNewContactOutcome(e.target.value)}
                        placeholder="VD: Phụ huynh đồng thuận và cam kết đồng hành cùng cô..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Biện pháp phối hợp tiếp theo
                      </label>
                      <input
                        type="text"
                        value={newContactNextAction}
                        onChange={(e) => setNewContactNextAction(e.target.value)}
                        placeholder="VD: Nhắn tin kiểm tra kết quả vào cuối tuần..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddContactForm(false)}
                      className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-xs"
                    >
                      Lưu nhật ký liên hệ
                    </button>
                  </div>
                </form>
              )}

              {studentContacts.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                  Chưa có lần liên hệ nào được lưu cho học sinh này. Bấm "+ Ghi nhật ký liên hệ" để lưu lại các cuộc gọi, tin nhắn Zalo hoặc gặp mặt trực tiếp.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentContacts.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{c.topic}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                            {c.channel}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">{c.date}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.summary}</p>
                      {c.outcome && (
                        <p className="text-emerald-700 font-bold text-[11px] bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                          ✅ <strong>Kết quả:</strong> {c.outcome}
                        </p>
                      )}
                      {c.nextAction && (
                        <p className="text-sky-700 text-[11px]">
                          👉 <strong>Tiếp theo:</strong> {c.nextAction}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
