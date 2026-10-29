import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  Filter,
  Users,
  User,
  Calendar,
  X,
  Sparkles,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { TaskItem, TaskStatus, TaskPriority, TaskAssigneeType, Student, GroupName, CompetitionLog } from '../types';
import confetti from 'canvas-confetti';

interface TasksTabProps {
  tasks: TaskItem[];
  students: Student[];
  currentWeek: number;
  onUpdateTasks: (newTasks: TaskItem[]) => void;
  onAddCompetitionLog: (log: CompetitionLog) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  students,
  currentWeek,
  onUpdateTasks,
  onAddCompetitionLog,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New task form state
  const [form, setForm] = useState<Partial<TaskItem>>({
    title: '',
    description: '',
    assignedToType: 'all',
    targetGroup: 'Tổ 1',
    targetStudentId: '',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    priority: 'medium',
    criteria: '',
    status: 'in_progress',
    bonusPoints: 3,
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchAssignee = assigneeFilter === 'all' || t.assignedToType === assigneeFilter;
      return matchStatus && matchPriority && matchAssignee;
    });
  }, [tasks, statusFilter, priorityFilter, assigneeFilter]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: form.title.trim(),
      description: form.description?.trim() || '',
      assignedToType: form.assignedToType || 'all',
      targetGroup: form.assignedToType === 'group' ? form.targetGroup : undefined,
      targetStudentId: form.assignedToType === 'student' ? form.targetStudentId : undefined,
      assignedDate: form.assignedDate || new Date().toISOString().split('T')[0],
      dueDate: form.dueDate || new Date().toISOString().split('T')[0],
      priority: form.priority || 'medium',
      criteria: form.criteria?.trim() || '',
      status: 'in_progress',
      bonusPoints: Number(form.bonusPoints) || 0,
      createdAt: new Date().toISOString(),
    };

    onUpdateTasks([newTask, ...tasks]);
    setIsModalOpen(false);
  };

  const handleUpdateStatus = (task: TaskItem, newStatus: TaskStatus) => {
    const updated = tasks.map((t) => {
      if (t.id === task.id) {
        return { ...t, status: newStatus };
      }
      return t;
    });
    onUpdateTasks(updated);

    // If marked as completed and has bonus points, award bonus!
    if (newStatus === 'completed' && task.bonusPoints && task.bonusPoints > 0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {
        // ignore
      }

      if (task.assignedToType === 'student' && task.targetStudentId) {
        const student = students.find((s) => s.id === task.targetStudentId);
        if (student) {
          onAddCompetitionLog({
            id: `comp-${Date.now()}`,
            studentId: student.id,
            studentName: student.fullName,
            group: student.group,
            weekNumber: currentWeek,
            ruleName: `Hoàn thành nhiệm vụ: ${task.title}`,
            points: task.bonusPoints,
            reason: `Đạt tiêu chí nhiệm vụ "${task.title}"`,
            recordedAt: new Date().toISOString(),
            verified: true,
          });
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Quản lý Nhiệm vụ Rèn luyện</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
              {tasks.filter((t) => t.status !== 'completed').length} việc đang làm
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Giao việc vừa sức, hướng tới việc tốt mỗi ngày và tinh thần hỗ trợ bạn bè, không trừng phạt
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-600 text-white shadow-xs active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Giao nhiệm vụ mới</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="all">Mọi trạng thái</option>
          <option value="in_progress">Đang thực hiện</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="needs_help">Cần hỗ trợ</option>
          <option value="pending">Chưa thực hiện</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="all">Mọi mức ưu tiên</option>
          <option value="urgent">Khẩn cấp</option>
          <option value="high">Ưu tiên cao</option>
          <option value="medium">Bình thường</option>
          <option value="low">Thấp</option>
        </select>

        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="all">Mọi đối tượng</option>
          <option value="all">Toàn thể lớp 6/13</option>
          <option value="group">Theo từng tổ</option>
          <option value="student">Từng cá nhân</option>
        </select>
      </div>

      {/* Task List Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">Không có nhiệm vụ nào phù hợp</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            let assigneeLabel = 'Toàn thể lớp 6/13';
            if (task.assignedToType === 'group') assigneeLabel = `${task.targetGroup}`;
            else if (task.assignedToType === 'student') {
              const s = students.find((x) => x.id === task.targetStudentId);
              assigneeLabel = s ? `Học sinh: ${s.fullName}` : 'Cá nhân';
            }

            return (
              <div
                key={task.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{task.title}</h3>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {assigneeLabel}
                        </span>
                        <span>•</span>
                        <span>Hạn: {task.dueDate}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {task.priority === 'urgent'
                        ? 'Khẩn cấp'
                        : task.priority === 'high'
                        ? 'Ưu tiên cao'
                        : 'Bình thường'}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">{task.description}</p>

                  {task.criteria && (
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700">
                      <span className="font-bold text-teal-800">Tiêu chí hoàn thành:</span> {task.criteria}
                    </div>
                  )}

                  {task.bonusPoints && task.bonusPoints > 0 ? (
                    <div className="mt-2 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>Cộng +{task.bonusPoints} điểm thi đua khi hoàn thành</span>
                    </div>
                  ) : null}
                </div>

                {/* Status Switcher Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Trạng thái:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateStatus(task, 'in_progress')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        task.status === 'in_progress'
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Đang làm
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(task, 'needs_help')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        task.status === 'needs_help'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                      }`}
                    >
                      Cần hỗ trợ
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(task, 'completed')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        task.status === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                      }`}
                    >
                      Đã xong
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">Giao nhiệm vụ rèn luyện mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên nhiệm vụ *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trực nhật tổ 2, Chuẩn bị bài trải nghiệm..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả cụ thể việc học sinh cần thực hiện..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giao cho đối tượng</label>
                  <select
                    value={form.assignedToType}
                    onChange={(e) => setForm({ ...form, assignedToType: e.target.value as TaskAssigneeType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <option value="all">Cả lớp 6/13</option>
                    <option value="group">Theo tổ</option>
                    <option value="student">Từng học sinh</option>
                  </select>
                </div>

                {form.assignedToType === 'group' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Chọn Tổ</label>
                    <select
                      value={form.targetGroup}
                      onChange={(e) => setForm({ ...form, targetGroup: e.target.value as GroupName })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option value="Tổ 1">Tổ 1</option>
                      <option value="Tổ 2">Tổ 2</option>
                      <option value="Tổ 3">Tổ 3</option>
                      <option value="Tổ 4">Tổ 4</option>
                    </select>
                  </div>
                )}

                {form.assignedToType === 'student' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Chọn Học sinh</label>
                    <select
                      value={form.targetStudentId}
                      onChange={(e) => setForm({ ...form, targetStudentId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option value="">-- Chọn học sinh --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.group})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hạn hoàn thành</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Điểm cộng thi đua</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={form.bonusPoints}
                    onChange={(e) => setForm({ ...form, bonusPoints: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu chí hoàn thành</label>
                <input
                  type="text"
                  placeholder="VD: Phòng học sạch sẽ trước 7h00 sáng, không có rác..."
                  value={form.criteria}
                  onChange={(e) => setForm({ ...form, criteria: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold transition shadow-xs"
                >
                  Giao nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
