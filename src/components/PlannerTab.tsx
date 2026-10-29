import React, { useState, useMemo } from 'react';
import {
  CalendarRange,
  CheckCircle,
  Plus,
  Clock,
  AlertCircle,
  Calendar,
  CheckSquare,
  Sparkles,
  Trash2,
  Filter,
  X,
} from 'lucide-react';
import { DailyWeeklyTodo, Student } from '../types';

interface PlannerTabProps {
  todos: DailyWeeklyTodo[];
  students: Student[];
  onUpdateTodos: (todos: DailyWeeklyTodo[]) => void;
  onToggleTodo: (todoId: string) => void;
}

const WEEKDAYS = [
  { id: 2, name: 'Thứ Hai', note: 'Sinh hoạt dưới cờ & Triển khai tuần' },
  { id: 3, name: 'Thứ Ba', note: 'Kiểm tra nề nếp & Giúp bạn' },
  { id: 4, name: 'Thứ Tư', note: 'Theo dõi học sinh cần hỗ trợ' },
  { id: 5, name: 'Thứ Năm', note: 'Liên hệ phụ huynh & Rà soát hồ sơ' },
  { id: 6, name: 'Thứ Sáu', note: 'Sinh hoạt lớp & Tổng kết thi đua' },
  { id: 7, name: 'Thứ Bảy', note: 'Kế hoạch tuần tiếp theo' },
];

export const PlannerTab: React.FC<PlannerTabProps> = ({
  todos,
  students,
  onUpdateTodos,
  onToggleTodo,
}) => {
  const [activeView, setActiveView] = useState<'daily' | 'weekly'>('daily');
  const [filterState, setFilterState] = useState<'all' | 'today' | 'pending' | 'completed'>('today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // New todo form
  const [formTitle, setFormTitle] = useState('');
  const [formScope, setFormScope] = useState<'daily' | 'weekly'>('daily');
  const [formDueDate, setFormDueDate] = useState(todayStr);
  const [formDayOfWeek, setFormDayOfWeek] = useState(2);
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formCategory, setFormCategory] = useState('Chuyên cần');
  const [formNote, setFormNote] = useState('');

  // Calculations
  const completedCount = todos.filter((t) => t.isCompleted).length;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  // Filtered todos for daily view
  const filteredDailyTodos = useMemo(() => {
    return todos.filter((t) => {
      if (t.scope !== 'daily') return false;
      if (filterState === 'today') return t.dueDate === todayStr;
      if (filterState === 'pending') return !t.isCompleted;
      if (filterState === 'completed') return t.isCompleted;
      return true;
    });
  }, [todos, filterState, todayStr]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newTodo: DailyWeeklyTodo = {
      id: `todo-${Date.now()}`,
      title: formTitle.trim(),
      scope: formScope,
      dueDate: formDueDate,
      dayOfWeek: formScope === 'weekly' ? Number(formDayOfWeek) : undefined,
      priority: formPriority,
      isCompleted: false,
      category: formCategory,
      note: formNote.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onUpdateTodos([newTodo, ...todos]);
    setIsAddModalOpen(false);
    setFormTitle('');
    setFormNote('');
  };

  const handleDeleteTodo = (id: string) => {
    onUpdateTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Kế hoạch Công việc Chủ nhiệm</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
              Tiến độ {progressPercent}%
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý công việc hằng ngày và hằng tuần khoa học, giảm tải áp lực hành chính cho cô giáo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setActiveView('daily')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeView === 'daily' ? 'bg-white text-sky-600 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Hằng ngày
            </button>
            <button
              onClick={() => setActiveView('weekly')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeView === 'weekly' ? 'bg-white text-sky-600 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Lịch tuần (Thứ 2 - CN)
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm việc mới</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5 text-xs font-bold">
            <span className="text-slate-700">Tiến độ hoàn thành công việc:</span>
            <span className="text-sky-600 font-black">{completedCount} / {todos.length} việc ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-teal-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {activeView === 'daily' ? (
        <div className="space-y-4">
          {/* Daily Filter Bar */}
          <div className="flex items-center gap-2">
            {[
              { id: 'today', label: 'Hôm nay' },
              { id: 'pending', label: 'Chưa hoàn thành' },
              { id: 'completed', label: 'Đã hoàn thành' },
              { id: 'all', label: 'Tất cả' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterState(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterState === f.id
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Daily List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs divide-y divide-slate-100">
            {filteredDailyTodos.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Không có việc nào trong mục này.
              </div>
            ) : (
              filteredDailyTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-4 flex items-start justify-between gap-3 transition ${
                    todo.isCompleted ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleTodo(todo.id)}
                      className="mt-0.5 text-slate-400 hover:text-sky-600 transition"
                    >
                      {todo.isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-sky-500" />
                      )}
                    </button>
                    <div>
                      <h4
                        className={`text-xs sm:text-sm font-bold text-slate-800 ${
                          todo.isCompleted ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {todo.title}
                      </h4>
                      {todo.note && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{todo.note}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {todo.category}
                        </span>
                        <span className="text-[10px] text-slate-400">Hạn: {todo.dueDate}</span>
                        {todo.priority === 'high' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700">
                            Ưu tiên cao
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                    title="Xóa việc"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Weekly Schedule Columns (Thứ 2 đến Thứ 7) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WEEKDAYS.map((day) => {
            const dayTodos = todos.filter((t) => t.dayOfWeek === day.id);
            return (
              <div
                key={day.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm">{day.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{day.note}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                      {dayTodos.length} việc
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {dayTodos.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">Chưa có lịch cố định</p>
                    ) : (
                      dayTodos.map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs"
                        >
                          <button
                            onClick={() => onToggleTodo(t.id)}
                            className="mt-0.5 text-slate-400"
                          >
                            {t.isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className={t.isCompleted ? 'line-through text-slate-400 font-medium' : 'font-bold text-slate-700'}>
                              {t.title}
                            </span>
                            {t.note && <p className="text-[10px] text-slate-500 mt-0.5">{t.note}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Todo Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">Thêm việc cần làm mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTodo} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên công việc *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kiểm tra chuyên cần, Nhắc nộp hồ sơ..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phạm vi việc</label>
                  <select
                    value={formScope}
                    onChange={(e) => setFormScope(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="daily">Hằng ngày</option>
                    <option value="weekly">Hằng tuần</option>
                  </select>
                </div>

                {formScope === 'daily' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ngày đến hạn</label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Thứ trong tuần</label>
                    <select
                      value={formDayOfWeek}
                      onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    >
                      {WEEKDAYS.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức ưu tiên</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="high">Ưu tiên cao</option>
                    <option value="medium">Bình thường</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Danh mục</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="Chuyên cần">Chuyên cần</option>
                    <option value="Hồ sơ">Hồ sơ học sinh</option>
                    <option value="Thi đua">Thi đua tuần</option>
                    <option value="Thông báo">Thông báo phụ huynh</option>
                    <option value="Hỗ trợ học sinh">Hỗ trợ học sinh</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú thêm</label>
                <textarea
                  rows={2}
                  placeholder="Chi tiết công việc cần làm..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
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
                  className="px-5 py-2 rounded-xl bg-sky-500 text-white font-bold"
                >
                  Lưu công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
