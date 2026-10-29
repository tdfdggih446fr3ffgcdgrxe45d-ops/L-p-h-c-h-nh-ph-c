import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Plus,
  Flame,
  Sparkles,
  ShieldAlert,
  Settings2,
  Lock,
  CheckCircle2,
  Trash2,
  Heart,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import {
  Student,
  CompetitionRule,
  CompetitionLog,
  AppSettings,
  GroupName,
} from '../types';
import confetti from 'canvas-confetti';

interface CompetitionTabProps {
  students: Student[];
  rules: CompetitionRule[];
  competitionLogs: CompetitionLog[];
  settings: AppSettings;
  onAddLog: (log: CompetitionLog) => void;
  onDeleteLog: (logId: string) => void;
  onUpdateRules: (rules: CompetitionRule[]) => void;
  onLockWeek: () => void;
}

export const CompetitionTab: React.FC<CompetitionTabProps> = ({
  students,
  rules,
  competitionLogs,
  settings,
  onAddLog,
  onDeleteLog,
  onUpdateRules,
  onLockWeek,
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(settings.currentWeek);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // New log form state
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formRuleId, setFormRuleId] = useState<string>('');
  const [customPoints, setCustomPoints] = useState<number>(3);
  const [formReason, setFormReason] = useState<string>('');

  // Logs for current selected week
  const weekLogs = useMemo(() => {
    return competitionLogs.filter((l) => l.weekNumber === selectedWeek);
  }, [competitionLogs, selectedWeek]);

  // Calculate scores per student
  const studentScores = useMemo(() => {
    const scores: Record<
      string,
      {
        student: Student;
        score: number;
        bonusTotal: number;
        penaltyTotal: number;
        logsCount: number;
      }
    > = {};

    students.forEach((s) => {
      scores[s.id] = {
        student: s,
        score: settings.startingScore,
        bonusTotal: 0,
        penaltyTotal: 0,
        logsCount: 0,
      };
    });

    weekLogs.forEach((log) => {
      if (scores[log.studentId]) {
        scores[log.studentId].score += log.points;
        if (log.points > 0) scores[log.studentId].bonusTotal += log.points;
        else scores[log.studentId].penaltyTotal += Math.abs(log.points);
        scores[log.studentId].logsCount++;
      }
    });

    return Object.values(scores).sort((a, b) => b.score - a.score);
  }, [students, weekLogs, settings.startingScore]);

  // Calculate scores per group
  const groupScores = useMemo(() => {
    const groups: Record<GroupName, { score: number; memberCount: number; bonus: number; penalty: number }> = {
      'Tổ 1': { score: settings.startingScore, memberCount: 0, bonus: 0, penalty: 0 },
      'Tổ 2': { score: settings.startingScore, memberCount: 0, bonus: 0, penalty: 0 },
      'Tổ 3': { score: settings.startingScore, memberCount: 0, bonus: 0, penalty: 0 },
      'Tổ 4': { score: settings.startingScore, memberCount: 0, bonus: 0, penalty: 0 },
    };

    students.forEach((s) => {
      if (groups[s.group]) {
        groups[s.group].memberCount++;
      }
    });

    weekLogs.forEach((log) => {
      if (groups[log.group]) {
        groups[log.group].score += log.points;
        if (log.points > 0) groups[log.group].bonus += log.points;
        else groups[log.group].penalty += Math.abs(log.points);
      }
    });

    return (Object.keys(groups) as GroupName[])
      .map((name) => ({ name, ...groups[name] }))
      .sort((a, b) => b.score - a.score);
  }, [students, weekLogs, settings.startingScore]);

  // Top positive students (top 5)
  const topStudents = studentScores.slice(0, 5);

  // Most improved students (students with progress bonus)
  const improvedStudents = weekLogs.filter(
    (l) => l.points > 0 && (l.ruleName.includes('tiến bộ') || l.reason.includes('tiến bộ'))
  );

  // Good deeds (Việc tốt)
  const goodDeeds = weekLogs.filter(
    (l) => l.points > 0 && (l.ruleName.includes('Việc tốt') || l.ruleName.includes('giúp đỡ') || l.points >= 4)
  );

  const handleRuleChange = (ruleId: string) => {
    setFormRuleId(ruleId);
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      setCustomPoints(rule.points);
      setFormReason(rule.name);
    }
  };

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === formStudentId);
    if (!student) return;

    const rule = rules.find((r) => r.id === formRuleId);
    const newLog: CompetitionLog = {
      id: `log-${Date.now()}`,
      studentId: student.id,
      studentName: student.fullName,
      group: student.group,
      weekNumber: selectedWeek,
      ruleId: rule?.id,
      ruleName: rule ? rule.name : 'Ghi nhận thi đua',
      points: Number(customPoints),
      reason: formReason.trim() || rule?.name || 'Ghi nhận điểm tuần',
      recordedAt: new Date().toISOString(),
      verified: true,
    };

    onAddLog(newLog);

    if (newLog.points > 0) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch (err) {
        // ignore
      }
    }

    setIsAddLogOpen(false);
    setFormStudentId('');
    setFormRuleId('');
    setFormReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header and Week Selection */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Bảng Thi Đua Hằng Tuần</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              Tuần {selectedWeek} (Khởi đầu {settings.startingScore} đ)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tôn vinh sự tiến bộ và hành động nhân ái, không bêu tên xếp cuối gây tổn thương học sinh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
            {[6, 7, 8, 9, 10].map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  selectedWeek === w
                    ? 'bg-white text-amber-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tuần {w}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddLogOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi nhận điểm</span>
          </button>

          <button
            onClick={onLockWeek}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            title="Khóa sổ thi đua tuần sau khi GVCN xác nhận"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Khóa sổ tuần</span>
          </button>
        </div>
      </div>

      {/* Group Ranking Podium Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {groupScores.map((g, idx) => {
          const isLeader = idx === 0;
          return (
            <div
              key={g.name}
              className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
                isLeader
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-xs ring-2 ring-amber-300/60'
                  : 'bg-white border-slate-100 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hạng #{idx + 1}
                </span>
                {isLeader ? (
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Trophy className="w-4 h-4" />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-400">Tổ xuất sắc</span>
                )}
              </div>

              <div className="mt-2">
                <h3 className="text-lg font-extrabold text-slate-800">{g.name}</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{g.score}</span>
                  <span className="text-xs font-bold text-slate-500">điểm</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-semibold">+{g.bonus} điểm cộng</span>
                <span className="text-rose-600 font-semibold">-{g.penalty} điểm trừ</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2 Column Section: Top Positive Students & Good Deeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Active Students */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Gương mặt tích cực trong tuần</span>
            </h3>
            <span className="text-xs text-slate-400">Biểu dương trước lớp</span>
          </div>

          <div className="space-y-2.5">
            {topStudents.map((item, idx) => (
              <div
                key={item.student.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl font-extrabold text-xs flex items-center justify-center ${
                      idx === 0
                        ? 'bg-amber-400 text-amber-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-800'
                        : idx === 2
                        ? 'bg-orange-300 text-orange-900'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{item.student.fullName}</h4>
                    <p className="text-[11px] text-slate-500">{item.student.group}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-600">
                    {item.score} đ
                  </span>
                  <p className="text-[10px] text-slate-400">+{item.bonusTotal} thưởng</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Good Deeds & Progress */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Việc tốt & Sự tiến bộ đáng khen</span>
            </h3>
            <span className="text-xs text-slate-400">Ghi nhận nhân ái</span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {goodDeeds.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Chưa có bản ghi việc tốt trong tuần này.</p>
            ) : (
              goodDeeds.map((g) => (
                <div key={g.id} className="p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">{g.studentName} ({g.group})</span>
                    <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                      +{g.points} đ
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 text-[11px]">{g.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Week Logs Table (All actions with delete/verify) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base">
            Nhật ký thi đua Tuần {selectedWeek} ({weekLogs.length} lần ghi nhận)
          </h3>
          <p className="text-xs text-slate-400">Có thể điều chỉnh khi phát hiện nhầm lẫn</p>
        </div>

        {weekLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Chưa có lượt ghi nhận điểm nào trong tuần này.</p>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {weekLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 ${
                      log.points > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {log.points > 0 ? `+${log.points}` : log.points}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{log.studentName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                        {log.group}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-[11px] text-slate-500 font-medium">{log.ruleName}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{log.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    {new Date(log.recordedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Xóa bản ghi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Log Modal */}
      {isAddLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">Ghi nhận điểm thi đua tuần {selectedWeek}</h3>
              <button onClick={() => setIsAddLogOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLog} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn học sinh *</label>
                <select
                  required
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">-- Chọn học sinh nhận điểm --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.group})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu chí thi đua có sẵn</label>
                <select
                  value={formRuleId}
                  onChange={(e) => handleRuleChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">-- Chọn tiêu chí chuẩn hoặc tự nhập --</option>
                  {rules.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.points > 0 ? `+${r.points}` : r.points} đ] {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điểm (+ cộng / - trừ)</label>
                <input
                  type="number"
                  required
                  value={customPoints}
                  onChange={(e) => setCustomPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do cụ thể *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ghi rõ minh chứng hoặc tình huống thực tế..."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLogOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition shadow-xs"
                >
                  Ghi nhận điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
