import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Copy,
  Check,
  Edit3,
  RefreshCw,
  AlertTriangle,
  FileText,
  Clock,
  DollarSign,
  MapPin,
  Users,
  FileCheck,
  Phone,
  MessageCircle,
  Plus,
  BookOpen,
  Info,
  ChevronRight,
} from 'lucide-react';
import { Student, ParentNotice, ParentContactLog, AppSettings } from '../types';

interface ParentNoticeTabProps {
  students: Student[];
  notices: ParentNotice[];
  contacts: ParentContactLog[];
  settings: AppSettings;
  onAddNotice: (notice: ParentNotice) => void;
  onUpdateNotice: (notice: ParentNotice) => void;
  onAddContact: (contact: ParentContactLog) => void;
}

const NOTICE_MODES = [
  { id: 'general', label: '1. Thông báo chung toàn lớp', desc: 'Gửi tới toàn thể cha mẹ học sinh' },
  { id: 'reminder', label: '2. Nhắc nhở phụ huynh', desc: 'Nhắc hạn hoàn thành hồ sơ, biểu mẫu nhẹ nhàng' },
  { id: 'private_student', label: '3. Trao đổi riêng học sinh', desc: 'Tình hình học tập, nề nếp của một con' },
  { id: 'emergency', label: '4. Thông báo khẩn', desc: 'Thời tiết, nghỉ học đột xuất, an toàn' },
  { id: 'fee_insurance', label: '5. Thu phí & Bảo hiểm', desc: 'Bảo hiểm y tế, văn bản tài chính minh bạch' },
  { id: 'pta_meeting', label: '6. Mời họp phụ huynh', desc: 'Giấy mời họp đầu năm / giữa kỳ / cuối kỳ' },
  { id: 'special_support', label: '7. Hỗ trợ đặc thù', desc: 'Phối hợp với gia đình học sinh cần trợ giúp' },
  { id: 'praise_thanks', label: '8. Biểu dương & Cảm ơn', desc: 'Khen ngợi nỗ lực tiến bộ của con' },
];

export const ParentNoticeTab: React.FC<ParentNoticeTabProps> = ({
  students,
  notices,
  contacts,
  settings,
  onAddNotice,
  onUpdateNotice,
  onAddContact,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ai_generator' | 'contact_book'>('ai_generator');

  // Input fields
  const [rawText, setRawText] = useState('');
  const [selectedMode, setSelectedMode] = useState('general');
  const [deadline, setDeadline] = useState('');
  const [amount, setAmount] = useState('');
  const [targetAudience, setTargetAudience] = useState('Toàn thể học sinh Lớp 6/13');
  const [method, setMethod] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<ParentNotice | null>(
    notices.length > 0 ? notices[0] : null
  );
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedText, setEditedText] = useState('');

  // Contact book form state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState<Partial<ParentContactLog>>({
    studentId: '',
    guardianName: '',
    date: new Date().toISOString().split('T')[0],
    topic: '',
    summary: '',
    channel: 'Zalo',
    outcome: '',
    nextAction: '',
    status: 'Đã hoàn thành',
  });

  // Call backend Gemini AI endpoint
  const handleGenerate = async (styleModifier = 'standard') => {
    if (!rawText.trim()) {
      alert('Vui lòng dán văn bản hoặc nhập các ý chính cần thông báo.');
      return;
    }

    setIsGenerating(true);
    setCopiedSuccess(false);

    try {
      const student = students.find((s) => s.id === selectedStudentId);

      const response = await fetch('/api/ai/parent-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          additionalInfo: {
            deadline,
            amount,
            targetAudience,
            method,
          },
          mode: selectedMode,
          styleModifier,
          studentContext: student
            ? { name: student.fullName, code: student.code, note: student.notesStudy }
            : null,
          teacherName: settings.teacherName,
          className: settings.className,
        }),
      });

      if (!response.ok) {
        throw new Error('Máy chủ phản hồi lỗi khi tạo thông báo.');
      }

      const data = await response.json();

      const newNotice: ParentNotice = {
        id: `notice-${Date.now()}`,
        title: rawText.slice(0, 60).replace(/\n/g, ' ') + '...',
        rawText,
        finalContent: data.content,
        highlights: {
          deadline: data.keyHighlights?.deadline || deadline || 'Theo thông báo',
          amount: data.keyHighlights?.amount || amount || 'Không có',
          timeLocation: data.keyHighlights?.timeLocation || method || 'Lớp 6/13',
          audience: data.keyHighlights?.audience || targetAudience,
          documents: data.keyHighlights?.documents || 'Sổ liên lạc/phiếu xác nhận',
          actionRequired: data.keyHighlights?.actionRequired || 'Phụ huynh xác nhận và đôn đốc con',
        },
        detectedMissingInfo: data.detectedMissingInfo || [],
        adviceNotes: data.adviceNotes || '',
        mode: selectedMode,
        styleModifier,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };

      setGeneratedResult(newNotice);
      setEditedText(newNotice.finalContent);
      onAddNotice(newNotice);
    } catch (err: any) {
      console.error(err);
      alert('Đã xảy ra lỗi khi tạo thông báo: ' + (err?.message || 'Vui lòng thử lại.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    const textToCopy = isEditingContent ? editedText : generatedResult.finalContent;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);

    // Update notice status to 'copied'
    const updated: ParentNotice = {
      ...generatedResult,
      finalContent: textToCopy,
      status: 'copied',
    };
    setGeneratedResult(updated);
    onUpdateNotice(updated);
  };

  const handleSaveEditedContent = () => {
    if (!generatedResult) return;
    const updated: ParentNotice = {
      ...generatedResult,
      finalContent: editedText,
    };
    setGeneratedResult(updated);
    onUpdateNotice(updated);
    setIsEditingContent(false);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === contactForm.studentId);
    if (!student) return;

    const newContact: ParentContactLog = {
      id: `contact-${Date.now()}`,
      studentId: student.id,
      studentName: student.fullName,
      guardianName: contactForm.guardianName || student.guardianName,
      date: contactForm.date || new Date().toISOString().split('T')[0],
      topic: contactForm.topic || 'Trao đổi tình hình học sinh',
      summary: contactForm.summary || '',
      channel: contactForm.channel as any,
      outcome: contactForm.outcome || 'Đã thống nhất',
      nextAction: contactForm.nextAction,
      status: (contactForm.status as any) || 'Đã hoàn thành',
    };

    onAddContact(newContact);
    setIsAddContactOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-sky-600/15">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chức năng trọng tâm của Lớp Học Hạnh Phúc</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              TRỢ LÝ AI – TỪ VĂN BẢN THÀNH TIN NHẮN PHỤ HUYNH
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-sky-100 max-w-2xl leading-relaxed">
              Dán công văn, thông báo trường hoặc ý chính. AI chuyển thể thành tin nhắn ấm áp, lịch sự,
              tôn trọng, rõ ràng hạn chót và trách nhiệm, tối ưu gửi Zalo cho phụ huynh Lớp 6/13.
            </p>
          </div>

          <div className="flex items-center bg-white/15 p-1 rounded-2xl backdrop-blur-sm self-start">
            <button
              onClick={() => setActiveSubTab('ai_generator')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeSubTab === 'ai_generator' ? 'bg-white text-sky-800 shadow-xs' : 'text-white/90'
              }`}
            >
              Soạn thảo AI
            </button>
            <button
              onClick={() => setActiveSubTab('contact_book')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeSubTab === 'contact_book' ? 'bg-white text-sky-800 shadow-xs' : 'text-white/90'
              }`}
            >
              Sổ liên lạc ({contacts.length})
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'ai_generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Input Form (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                <span>1. Dữ liệu văn bản đầu vào</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Cô Đỗ Kim Anh</span>
            </div>

            {/* Mode selection buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Chế độ thông báo phù hợp:
              </label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {NOTICE_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.desc})
                  </option>
                ))}
              </select>
            </div>

            {/* If mode is private student, show student picker */}
            {(selectedMode === 'private_student' || selectedMode === 'special_support') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn học sinh trao đổi riêng:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="">-- Chọn học sinh cần trao đổi --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.code} - {s.group})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Raw text input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Nội dung văn bản / Thông báo gốc *
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setRawText(
                      'Thông báo về việc tổ chức Hội chợ Ẩm thực Quê hương chào mừng ngày 20/11. Mỗi lớp dựng 1 gian hàng truyền thống. Kinh phí tham gia tự nguyện 50.000đ/học sinh do Ban đại diện CMHS hỗ trợ quản lý. Phụ huynh đăng ký hỗ trợ trước thứ Ba ngày 03/11. Địa điểm sân trường THCS.'
                    )
                  }
                  className="text-[11px] text-sky-600 hover:underline font-medium"
                >
                  Dán văn bản mẫu
                </button>
              </div>
              <textarea
                rows={5}
                required
                placeholder="Dán toàn văn công văn, kết luận họp, hoặc các gạch đầu dòng cần dặn dò phụ huynh..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            {/* Additional parameters */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
              <span className="font-bold text-slate-700 block">Thông tin bổ sung (nếu có):</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Hạn cuối nộp/phản hồi:</label>
                  <input
                    type="text"
                    placeholder="VD: 17h00 ngày 30/10"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-medium">Số tiền / Kinh phí:</label>
                  <input
                    type="text"
                    placeholder="VD: Miễn phí / 50.000đ"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] text-slate-500 font-medium">Hình thức nộp / Địa điểm:</label>
                  <input
                    type="text"
                    placeholder="VD: Nộp trực tiếp cho cô Kim Anh hoặc qua tài khoản ban đại diện..."
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Primary Generate Button */}
            <button
              onClick={() => handleGenerate('standard')}
              disabled={isGenerating}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-teal-600 hover:from-sky-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-sky-500/25 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang phân tích & chuyển văn phong...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo Tin Nhắn Phụ Huynh</span>
                </>
              )}
            </button>
          </div>

          {/* RIGHT COLUMN: Output Result & Refinements (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {generatedResult ? (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-5">
                {/* Result Top Bar with Copy Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      <Send className="w-4 h-4 text-teal-600" />
                      <span>Nội dung tin nhắn hoàn chỉnh</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Sẵn sàng gửi qua Zalo phụ huynh hoặc Sổ liên lạc điện tử
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingContent(!isEditingContent)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingContent ? 'Hủy sửa' : 'Chỉnh sửa'}</span>
                    </button>

                    <button
                      onClick={handleCopy}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                        copiedSuccess
                          ? 'bg-emerald-600 text-white'
                          : 'bg-teal-500 hover:bg-teal-600 text-white active:scale-95'
                      }`}
                    >
                      {copiedSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Sao chép tin nhắn</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Important Highlights Cards */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nội dung quan trọng cần lưu ý (Trích xuất nổi bật):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Hạn cuối</span>
                      <span className="font-bold text-amber-900 mt-0.5 block">
                        {generatedResult.highlights.deadline}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Số tiền</span>
                      <span className="font-bold text-emerald-900 mt-0.5 block">
                        {generatedResult.highlights.amount}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
                      <span className="text-[10px] font-bold text-sky-800 uppercase block">Thời gian & Địa điểm</span>
                      <span className="font-bold text-sky-900 mt-0.5 block">
                        {generatedResult.highlights.timeLocation}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                      <span className="text-[10px] font-bold text-indigo-800 uppercase block">Đối tượng</span>
                      <span className="font-bold text-indigo-900 mt-0.5 block">
                        {generatedResult.highlights.audience}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
                      <span className="text-[10px] font-bold text-purple-800 uppercase block">Hồ sơ cần nộp</span>
                      <span className="font-bold text-purple-900 mt-0.5 block">
                        {generatedResult.highlights.documents}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-800 uppercase block">Phụ huynh cần làm</span>
                      <span className="font-bold text-rose-900 mt-0.5 block">
                        {generatedResult.highlights.actionRequired}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Missing Info Warning */}
                {generatedResult.detectedMissingInfo && generatedResult.detectedMissingInfo.length > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Thông tin còn thiếu trong văn bản gốc mà phụ huynh thường hay hỏi:</span>
                    </p>
                    {generatedResult.detectedMissingInfo.map((info, idx) => (
                      <p key={idx} className="pl-5 text-slate-700">• {info}</p>
                    ))}
                  </div>
                )}

                {/* Message Body Display or Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-600">
                      Bản nháp tin nhắn gửi phụ huynh:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Trạng thái: <span className="font-semibold text-teal-600 uppercase">{generatedResult.status}</span>
                    </span>
                  </div>

                  {isEditingContent ? (
                    <div className="space-y-2">
                      <textarea
                        rows={10}
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full p-4 rounded-2xl border-2 border-sky-400 font-sans text-xs sm:text-sm leading-relaxed focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsEditingContent(false)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSaveEditedContent}
                          className="px-4 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-bold"
                        >
                          Lưu chỉnh sửa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans selection:bg-teal-100">
                      {generatedResult.finalContent}
                    </div>
                  )}
                </div>

                {/* Quick Tone & Style Refinement Buttons */}
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-2">
                    Tùy biến nhanh văn phong AI:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleGenerate('concise')}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      ⚡ Viết ngắn gọn hơn
                    </button>
                    <button
                      onClick={() => handleGenerate('gentler')}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      🌸 Viết nhẹ nhàng hơn
                    </button>
                    <button
                      onClick={() => handleGenerate('more_formal')}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      🏛️ Viết trang trọng hơn
                    </button>
                    <button
                      onClick={() => handleGenerate('short_zalo')}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition"
                    >
                      📱 Định dạng Zalo lướt nhanh
                    </button>
                    <button
                      onClick={() => handleGenerate('official_notice')}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      📜 Thông báo chính thức
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center space-y-3">
                <Send className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">Chưa có bản nháp tin nhắn</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Dán nội dung văn bản ở cột bên trái và bấm nút "Tạo Tin Nhắn Phụ Huynh" để AI phân tích.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Sổ theo dõi liên lạc phụ huynh */
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Sổ theo dõi trao đổi với Phụ huynh</h3>
              <p className="text-xs text-slate-500">Lưu trữ các cuộc gọi, tin nhắn Zalo và trao đổi trực tiếp</p>
            </div>
            <button
              onClick={() => setIsAddContactOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-xs active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi nhận liên lạc mới</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {contacts.map((c) => (
              <div key={c.id} className="py-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-sm">{c.studentName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-600">{c.guardianName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-700">
                      {c.channel}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{c.date}</span>
                </div>
                <p className="font-bold text-slate-700">Chủ đề: {c.topic}</p>
                <p className="text-slate-600">{c.summary}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-emerald-700 font-semibold text-[11px]">
                    👉 Kết quả: {c.outcome}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === 'Đã hoàn thành'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Contact Modal */}
          {isAddContactOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
              <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
                <h3 className="font-bold text-slate-800 text-base">Ghi nhận liên hệ phụ huynh</h3>
                <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Học sinh liên quan *</label>
                    <select
                      required
                      value={contactForm.studentId}
                      onChange={(e) => {
                        const st = students.find((s) => s.id === e.target.value);
                        setContactForm({
                          ...contactForm,
                          studentId: e.target.value,
                          guardianName: st ? st.guardianName : '',
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
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
                    <label className="block font-semibold text-slate-700 mb-1">Họ tên phụ huynh</label>
                    <input
                      type="text"
                      value={contactForm.guardianName}
                      onChange={(e) => setContactForm({ ...contactForm, guardianName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Kênh liên hệ</label>
                      <select
                        value={contactForm.channel}
                        onChange={(e) => setContactForm({ ...contactForm, channel: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      >
                        <option value="Zalo">Zalo</option>
                        <option value="Điện thoại">Điện thoại</option>
                        <option value="Gặp trực tiếp">Gặp trực tiếp</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Ngày trao đổi</label>
                      <input
                        type="date"
                        value={contactForm.date}
                        onChange={(e) => setContactForm({ ...contactForm, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Chủ đề trao đổi *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nhắc nhở bài tập, động viên tâm lý..."
                      value={contactForm.topic}
                      onChange={(e) => setContactForm({ ...contactForm, topic: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nội dung tóm tắt</label>
                    <textarea
                      rows={2}
                      placeholder="Ghi nhận phản hồi của phụ huynh..."
                      value={contactForm.summary}
                      onChange={(e) => setContactForm({ ...contactForm, summary: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kết quả & Hành động tiếp theo</label>
                    <input
                      type="text"
                      placeholder="VD: Phụ huynh đồng ý kiểm tra cặp sách buổi tối..."
                      value={contactForm.outcome}
                      onChange={(e) => setContactForm({ ...contactForm, outcome: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddContactOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-teal-500 text-white font-bold"
                    >
                      Lưu thông tin
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
