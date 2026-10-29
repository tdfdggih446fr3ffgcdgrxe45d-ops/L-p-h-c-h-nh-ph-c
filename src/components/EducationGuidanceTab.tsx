import React, { useState } from 'react';
import {
  HeartHandshake,
  Sparkles,
  ShieldAlert,
  Send,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
  RefreshCw,
  Plus,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';
import { Student, EducationGuidancePlan } from '../types';

interface EducationGuidanceTabProps {
  students: Student[];
  guidancePlans: EducationGuidancePlan[];
  onAddGuidancePlan: (plan: EducationGuidancePlan) => void;
  onUpdateGuidancePlan: (plan: EducationGuidancePlan) => void;
}

const PRESET_SITUATIONS = [
  {
    title: 'Nói chuyện riêng & mất tập trung trong giờ học',
    behavior: 'Nói chuyện riêng với bạn bên cạnh trong giờ học, làm gián đoạn bài giảng và chưa hoàn thành bài tập tại lớp.',
    context: 'Trong tiết học Khoa học tự nhiên sáng nay',
    frequency: 'Thỉnh thoảng xảy ra khi làm việc nhóm',
  },
  {
    title: 'Quên chuẩn bị sách vở hoặc đồ dùng học tập',
    behavior: 'Quên mang sách giáo khoa và compa, chưa làm phần bài tập về nhà theo hướng dẫn.',
    context: 'Đầu giờ truy bài',
    frequency: '2 lần trong tuần qua',
  },
  {
    title: 'Trêu chọc hoặc có lời nói chưa tôn trọng bạn',
    behavior: 'Đặt biệt danh và trêu chọc bạn cùng bàn trong giờ ra chơi khiến bạn khó chịu và buồn.',
    context: 'Giờ giải lao sau tiết 2',
    frequency: 'Lần đầu quan sát thấy',
  },
  {
    title: 'Mâu thuẫn hoặc tranh cãi gay gắt với bạn trong lớp',
    behavior: 'Tranh giành đồ dùng hoặc bất đồng ý kiến khi làm việc nhóm dẫn tới cãi vã to tiếng.',
    context: 'Trong giờ thảo luận Hoạt động trải nghiệm',
    frequency: 'Mới xảy ra',
  },
];

export const EducationGuidanceTab: React.FC<EducationGuidanceTabProps> = ({
  students,
  guidancePlans,
  onAddGuidancePlan,
  onUpdateGuidancePlan,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [behaviorDescription, setBehaviorDescription] = useState<string>('');
  const [timeContext, setTimeContext] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('Thỉnh thoảng');
  const [knownContext, setKnownContext] = useState<string>('');
  const [actionsTaken, setActionsTaken] = useState<string>('');
  const [initialResults, setInitialResults] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<EducationGuidancePlan | null>(
    guidancePlans.length > 0 ? guidancePlans[0] : null
  );
  const [copiedParentMsg, setCopiedParentMsg] = useState(false);

  const handleApplyPreset = (preset: (typeof PRESET_SITUATIONS)[0]) => {
    setBehaviorDescription(preset.behavior);
    setTimeContext(preset.context);
    setFrequency(preset.frequency);
  };

  const handleGenerateGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!behaviorDescription.trim()) {
      alert('Vui lòng nhập mô tả hành vi quan sát được.');
      return;
    }

    const student = students.find((s) => s.id === selectedStudentId);

    setIsLoading(true);
    setCopiedParentMsg(false);

    try {
      const response = await fetch('/api/ai/education-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student ? student.fullName : 'Học sinh lớp 6/13',
          studentCode: student ? student.code : 'HS613',
          behaviorDescription,
          timeContext,
          frequency,
          knownContext,
          actionsTaken,
          initialResults,
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi máy chủ khi tạo định hướng giáo dục.');
      }

      const data = await response.json();

      const newPlan: EducationGuidancePlan = {
        id: `edu-${Date.now()}`,
        studentId: student ? student.id : 'unknown',
        studentName: student ? student.fullName : 'Học sinh lớp 6/13',
        studentCode: student ? student.code : 'HS613',
        date: new Date().toISOString().split('T')[0],
        behaviorDescription,
        timeContext,
        frequency,
        knownContext,
        actionsTaken,
        initialResults,
        aiResult: {
          situationSummary: data.situationSummary,
          educationGoals: data.educationGoals,
          causeExplorationQuestions: data.causeExplorationQuestions || [],
          communicationScript: data.communicationScript,
          educationSteps: data.educationSteps || [],
          parentMessageDraft: data.parentMessageDraft,
          postEducationTracking: data.postEducationTracking,
          evaluationCriteria: data.evaluationCriteria,
          safetyAlert: data.safetyAlert || null,
        },
        status: 'Đang thực hiện',
      };

      setCurrentPlan(newPlan);
      onAddGuidancePlan(newPlan);
    } catch (err: any) {
      console.error(err);
      alert('Không thể tạo định hướng giáo dục lúc này: ' + err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyParentMessage = () => {
    if (!currentPlan?.aiResult?.parentMessageDraft) return;
    navigator.clipboard.writeText(currentPlan.aiResult.parentMessageDraft);
    setCopiedParentMsg(true);
    setTimeout(() => setCopiedParentMsg(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-indigo-600 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-sky-600/15">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Kỷ luật tích cực & Giáo dục nhân văn cấp THCS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            CÙNG EM TIẾN BỘ – GỢI Ý BIỆN PHÁP GIÁO DỤC
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-sky-100 leading-relaxed">
            Khi học sinh vi phạm nội quy hoặc có khó khăn tâm lý, AI đồng hành cùng Cô Kim Anh phân tích
            nguyên nhân, gợi ý lời nói nhẹ nhàng tôn trọng lòng tự trọng của con, hướng dẫn các bước đồng hành
            và soạn tin nhắn tinh tế gửi gia đình.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Nhập tình huống thực tế</h3>
            <span className="text-xs text-slate-400">Không dán nhãn tính cách</span>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Chọn nhanh tình huống thường gặp:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SITUATIONS.map((preset, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleApplyPreset(preset)}
                  className="text-left text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 transition"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleGenerateGuidance} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chọn học sinh *</label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">-- Chọn học sinh trong Lớp 6/13 --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.code} - {s.group})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mô tả hành vi quan sát được *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Mô tả cụ thể hành động quan sát thấy, tránh suy diễn đạo đức..."
                value={behaviorDescription}
                onChange={(e) => setBehaviorDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thời gian, bối cảnh</label>
                <input
                  type="text"
                  placeholder="VD: Tiết 2 môn Văn..."
                  value={timeContext}
                  onChange={(e) => setTimeContext(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tần suất</label>
                <input
                  type="text"
                  placeholder="VD: Lần đầu / 2 lần..."
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hoàn cảnh gia đình / Tâm lý liên quan đã biết
              </label>
              <input
                type="text"
                placeholder="VD: Con mới chuyển cấp, bố mẹ đi công tác xa, con hay lo âu..."
                value={knownContext}
                onChange={(e) => setKnownContext(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Biện pháp cô giáo đã thử áp dụng
              </label>
              <input
                type="text"
                placeholder="VD: Nhắc nhở bằng ánh mắt, trao đổi nhẹ sau giờ học..."
                value={actionsTaken}
                onChange={(e) => setActionsTaken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md shadow-sky-500/25 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang xây dựng kế hoạch giáo dục...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo Phương Án Giáo Dục Tích Cực</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Structured AI Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {currentPlan ? (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Định hướng hỗ trợ: {currentPlan.studentName} ({currentPlan.studentCode})
                  </h3>
                  <p className="text-xs text-slate-400">Lập ngày: {currentPlan.date}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-800 self-start">
                  {currentPlan.status}
                </span>
              </div>

              {/* Safety Alert if present */}
              {currentPlan.aiResult.safetyAlert && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <span>LƯU Ý BẢO VỆ AN TOÀN HỌC SINH</span>
                  </div>
                  <p>{currentPlan.aiResult.safetyAlert}</p>
                </div>
              )}

              {/* 1. Mô tả tình huống & Mục tiêu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-700 block text-xs uppercase mb-1">
                    1. Mô tả khách quan tình huống
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {currentPlan.aiResult.situationSummary}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100">
                  <span className="font-bold text-sky-800 block text-xs uppercase mb-1">
                    2. Mục tiêu giáo dục cụ thể
                  </span>
                  <p className="text-sky-900 leading-relaxed">
                    {currentPlan.aiResult.educationGoals}
                  </p>
                </div>
              </div>

              {/* 3. Tìm hiểu nguyên nhân (Câu hỏi mở) */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 text-xs space-y-2">
                <span className="font-bold text-amber-900 block text-xs uppercase">
                  3. Câu hỏi mở để cô giáo trao đổi tìm hiểu nguyên nhân
                </span>
                <div className="space-y-1.5 pl-2">
                  {currentPlan.aiResult.causeExplorationQuestions.map((q, idx) => (
                    <p key={idx} className="text-slate-700 flex items-start gap-2">
                      <span className="font-bold text-amber-600">💬</span>
                      <span>"{q}"</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* 4. Cách trao đổi với học sinh (Lời thoại mẫu) */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 text-xs space-y-2">
                <span className="font-bold text-teal-900 block text-xs uppercase">
                  4. Gợi ý lời nói của cô giáo khi gặp riêng học sinh
                </span>
                <p className="text-slate-800 italic leading-relaxed bg-white/70 p-3 rounded-xl border border-teal-100">
                  "{currentPlan.aiResult.communicationScript}"
                </p>
              </div>

              {/* 5. Biện pháp giáo dục cụ thể */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 block uppercase">
                  5. Các bước hỗ trợ & rèn luyện
                </span>
                <div className="space-y-2">
                  {currentPlan.aiResult.educationSteps.map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Phối hợp với phụ huynh (Tin nhắn mẫu có nút sao chép) */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 uppercase">
                    6. Tin nhắn trao đổi riêng với phụ huynh
                  </span>
                  <button
                    onClick={handleCopyParentMessage}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition"
                  >
                    {copiedParentMsg ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép tin nhắn</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-indigo-100 text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {currentPlan.aiResult.parentMessageDraft}
                </div>
              </div>

              {/* 7 & 8: Theo dõi & Đánh giá kết quả */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-700 block text-xs uppercase mb-1">
                    7. Kế hoạch theo dõi sau đó
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {currentPlan.aiResult.postEducationTracking}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="font-bold text-emerald-800 block text-xs uppercase mb-1">
                    8. Tiêu chí minh chứng tiến bộ
                  </span>
                  <p className="text-emerald-900 leading-relaxed">
                    {currentPlan.aiResult.evaluationCriteria}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center space-y-3">
              <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">Chưa có phương án nào được chọn</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Điền tình huống cụ thể ở bảng bên trái để nhận gợi ý phương án sư phạm nhân ái từ AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
