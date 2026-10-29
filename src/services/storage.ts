import {
  Student,
  AttendanceRecord,
  TaskItem,
  CompetitionRule,
  CompetitionLog,
  ParentNotice,
  ParentContactLog,
  StudentQuickNote,
  EducationGuidancePlan,
  DailyWeeklyTodo,
  AppSettings,
  ClassMediaItem,
} from '../types';
import {
  initialSettings,
  initialStudents,
  initialCompetitionRules,
  initialCompetitionLogs,
  initialTasks,
  initialAttendanceRecords,
  initialParentNotices,
  initialParentContacts,
  initialStudentNotes,
  initialEducationPlans,
  initialTodos,
  sampleDemoStudents,
} from '../data/mockData';
import { initialClassMedia } from '../data/initialMedia';
import * as XLSX from 'xlsx';

const STORAGE_KEYS = {
  SETTINGS: 'happy_class_settings_v1',
  STUDENTS: 'happy_class_students_v1',
  ATTENDANCE: 'happy_class_attendance_v1',
  TASKS: 'happy_class_tasks_v1',
  RULES: 'happy_class_rules_v1',
  COMPETITION_LOGS: 'happy_class_competition_logs_v1',
  NOTICES: 'happy_class_notices_v1',
  CONTACTS: 'happy_class_contacts_v1',
  NOTES: 'happy_class_notes_v1',
  EDUCATION_PLANS: 'happy_class_education_plans_v1',
  TODOS: 'happy_class_todos_v1',
  MEDIA: 'happy_class_media_v1',
  LAST_EXCEL_IMPORT: 'happy_class_last_excel_import_v1',
};

// Explicit IDs of the 20 auto-generated mock students to prevent mixing with real Excel data
export const MOCK_STUDENT_IDS = new Set([
  'hs-01', 'hs-02', 'hs-03', 'hs-04', 'hs-05',
  'hs-06', 'hs-07', 'hs-08', 'hs-09', 'hs-10',
  'hs-11', 'hs-12', 'hs-13', 'hs-14', 'hs-15',
  'hs-16', 'hs-17', 'hs-18', 'hs-19', 'hs-20',
]);

const MOCK_STUDENT_NAMES = new Set([
  'Nguyễn An Khang', 'Trần Bảo Anh', 'Lê Minh Khôi', 'Phạm Đăng Khoa',
  'Vũ Thùy Dương', 'Hoàng Gia Huy', 'Đặng Phương Linh', 'Bùi Đức Trọng',
  'Đỗ Tuấn Kiệt', 'Ngô Khánh Ngân', 'Lương Minh Nhật', 'Phan Thanh Trúc',
  'Dương Quốc Bảo', 'Mai Ngọc Hà', 'Võ Hoàng Long', 'Trịnh Cẩm Tú',
  'Lâm Tuấn Hưng', 'Hồ Phương Uyên', 'Vương Gia Huy', 'Đoàn Bảo Ngọc',
]);

export function isMockStudent(student: { id?: string; code?: string; fullName?: string }): boolean {
  if (!student) return false;
  if (student.id && MOCK_STUDENT_IDS.has(student.id)) return true;
  if (
    student.id &&
    student.id.startsWith('hs-') &&
    student.code &&
    /^HS613(0[1-9]|1[0-9]|20)$/.test(student.code) &&
    student.fullName &&
    MOCK_STUDENT_NAMES.has(student.fullName.trim())
  ) {
    return true;
  }
  return false;
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to load key ${key} from storage:`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save key ${key} to storage:`, e);
  }
}

export const StorageService = {
  getSettings(): AppSettings {
    return getFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, initialSettings);
  },
  saveSettings(settings: AppSettings): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  },

  getStudents(): Student[] {
    const raw = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, sampleDemoStudents);
    if (!raw || raw.length === 0) {
      return sampleDemoStudents;
    }
    return raw;
  },
  saveStudents(students: Student[]): void {
    saveToStorage(STORAGE_KEYS.STUDENTS, students);
  },

  getLastImportedExcel(): Student[] {
    return getFromStorage<Student[]>(STORAGE_KEYS.LAST_EXCEL_IMPORT, []);
  },
  saveLastImportedExcel(students: Student[]): void {
    saveToStorage(STORAGE_KEYS.LAST_EXCEL_IMPORT, students);
  },

  // Delete all 20 auto-generated mock students across the app
  purgeMockStudents(): { deletedCount: number; remainingCount: number } {
    const raw = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, []);
    const clean = raw.filter((s) => !isMockStudent(s));
    const deletedCount = raw.length - clean.length;
    saveToStorage(STORAGE_KEYS.STUDENTS, clean);

    // Clean related mock records
    const attendance = getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []).filter(
      (a) => !MOCK_STUDENT_IDS.has(a.studentId)
    );
    saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance);

    const logs = getFromStorage<CompetitionLog[]>(STORAGE_KEYS.COMPETITION_LOGS, []).filter(
      (l) => !l.studentId || !MOCK_STUDENT_IDS.has(l.studentId)
    );
    saveToStorage(STORAGE_KEYS.COMPETITION_LOGS, logs);

    const notes = getFromStorage<StudentQuickNote[]>(STORAGE_KEYS.NOTES, []).filter(
      (n) => !MOCK_STUDENT_IDS.has(n.studentId)
    );
    saveToStorage(STORAGE_KEYS.NOTES, notes);

    const contacts = getFromStorage<ParentContactLog[]>(STORAGE_KEYS.CONTACTS, []).filter(
      (c) => !MOCK_STUDENT_IDS.has(c.studentId)
    );
    saveToStorage(STORAGE_KEYS.CONTACTS, contacts);

    const plans = getFromStorage<EducationGuidancePlan[]>(STORAGE_KEYS.EDUCATION_PLANS, []).filter(
      (p) => !MOCK_STUDENT_IDS.has(p.studentId)
    );
    saveToStorage(STORAGE_KEYS.EDUCATION_PLANS, plans);

    const settings = this.getSettings();
    if (settings.isDemoMode) {
      this.saveSettings({ ...settings, isDemoMode: false });
    }

    return { deletedCount, remainingCount: clean.length };
  },

  getAttendance(): AttendanceRecord[] {
    return getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, initialAttendanceRecords);
  },
  saveAttendance(attendance: AttendanceRecord[]): void {
    saveToStorage(STORAGE_KEYS.ATTENDANCE, attendance);
  },

  getTasks(): TaskItem[] {
    return getFromStorage<TaskItem[]>(STORAGE_KEYS.TASKS, initialTasks);
  },
  saveTasks(tasks: TaskItem[]): void {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  },

  getRules(): CompetitionRule[] {
    return getFromStorage<CompetitionRule[]>(STORAGE_KEYS.RULES, initialCompetitionRules);
  },
  saveRules(rules: CompetitionRule[]): void {
    saveToStorage(STORAGE_KEYS.RULES, rules);
  },

  getCompetitionLogs(): CompetitionLog[] {
    return getFromStorage<CompetitionLog[]>(STORAGE_KEYS.COMPETITION_LOGS, initialCompetitionLogs);
  },
  saveCompetitionLogs(logs: CompetitionLog[]): void {
    saveToStorage(STORAGE_KEYS.COMPETITION_LOGS, logs);
  },

  getNotices(): ParentNotice[] {
    return getFromStorage<ParentNotice[]>(STORAGE_KEYS.NOTICES, initialParentNotices);
  },
  saveNotices(notices: ParentNotice[]): void {
    saveToStorage(STORAGE_KEYS.NOTICES, notices);
  },

  getContacts(): ParentContactLog[] {
    return getFromStorage<ParentContactLog[]>(STORAGE_KEYS.CONTACTS, initialParentContacts);
  },
  saveContacts(contacts: ParentContactLog[]): void {
    saveToStorage(STORAGE_KEYS.CONTACTS, contacts);
  },

  getNotes(): StudentQuickNote[] {
    return getFromStorage<StudentQuickNote[]>(STORAGE_KEYS.NOTES, initialStudentNotes);
  },
  saveNotes(notes: StudentQuickNote[]): void {
    saveToStorage(STORAGE_KEYS.NOTES, notes);
  },

  getEducationPlans(): EducationGuidancePlan[] {
    return getFromStorage<EducationGuidancePlan[]>(STORAGE_KEYS.EDUCATION_PLANS, initialEducationPlans);
  },
  saveEducationPlans(plans: EducationGuidancePlan[]): void {
    saveToStorage(STORAGE_KEYS.EDUCATION_PLANS, plans);
  },

  getTodos(): DailyWeeklyTodo[] {
    return getFromStorage<DailyWeeklyTodo[]>(STORAGE_KEYS.TODOS, initialTodos);
  },
  saveTodos(todos: DailyWeeklyTodo[]): void {
    saveToStorage(STORAGE_KEYS.TODOS, todos);
  },

  getMedia(): ClassMediaItem[] {
    return getFromStorage<ClassMediaItem[]>(STORAGE_KEYS.MEDIA, initialClassMedia);
  },
  saveMedia(media: ClassMediaItem[]): void {
    saveToStorage(STORAGE_KEYS.MEDIA, media);
  },

  // Reset to initial demo mock data
  resetToDemo(): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, { ...initialSettings, isDemoMode: true });
    saveToStorage(STORAGE_KEYS.STUDENTS, sampleDemoStudents);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, initialAttendanceRecords);
    saveToStorage(STORAGE_KEYS.TASKS, initialTasks);
    saveToStorage(STORAGE_KEYS.RULES, initialCompetitionRules);
    saveToStorage(STORAGE_KEYS.COMPETITION_LOGS, initialCompetitionLogs);
    saveToStorage(STORAGE_KEYS.NOTICES, initialParentNotices);
    saveToStorage(STORAGE_KEYS.CONTACTS, initialParentContacts);
    saveToStorage(STORAGE_KEYS.NOTES, initialStudentNotes);
    saveToStorage(STORAGE_KEYS.EDUCATION_PLANS, initialEducationPlans);
    saveToStorage(STORAGE_KEYS.TODOS, initialTodos);
  },

  // Clear data for fresh real use (keeps rules structure and empty student list)
  clearForRealClass(teacherName = 'Đỗ Kim Anh', className = 'Lớp 6/13'): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, {
      ...initialSettings,
      teacherName,
      className,
      isDemoMode: false,
    });
    saveToStorage(STORAGE_KEYS.STUDENTS, []);
    saveToStorage(STORAGE_KEYS.ATTENDANCE, []);
    saveToStorage(STORAGE_KEYS.TASKS, []);
    saveToStorage(STORAGE_KEYS.RULES, initialCompetitionRules);
    saveToStorage(STORAGE_KEYS.COMPETITION_LOGS, []);
    saveToStorage(STORAGE_KEYS.NOTICES, []);
    saveToStorage(STORAGE_KEYS.CONTACTS, []);
    saveToStorage(STORAGE_KEYS.NOTES, []);
    saveToStorage(STORAGE_KEYS.EDUCATION_PLANS, []);
    saveToStorage(STORAGE_KEYS.TODOS, [
      {
        id: 'todo-first',
        title: 'Nhập danh sách học sinh Lớp 6/13 từ tệp Excel hoặc thêm trực tiếp',
        scope: 'daily',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'high',
        isCompleted: false,
        category: 'Hồ sơ',
        createdAt: new Date().toISOString(),
      },
    ]);
  },

  // Export entire application database as a JSON file
  exportBackup(): void {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      students: this.getStudents(),
      attendance: this.getAttendance(),
      tasks: this.getTasks(),
      rules: this.getRules(),
      competitionLogs: this.getCompetitionLogs(),
      notices: this.getNotices(),
      contacts: this.getContacts(),
      notes: this.getNotes(),
      educationPlans: this.getEducationPlans(),
      todos: this.getTodos(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SaoLuu_LopHocHanhPhuc_613_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Import JSON backup
  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (Array.isArray(data.students)) this.saveStudents(data.students);
      if (Array.isArray(data.attendance)) this.saveAttendance(data.attendance);
      if (Array.isArray(data.tasks)) this.saveTasks(data.tasks);
      if (Array.isArray(data.rules)) this.saveRules(data.rules);
      if (Array.isArray(data.competitionLogs)) this.saveCompetitionLogs(data.competitionLogs);
      if (Array.isArray(data.notices)) this.saveNotices(data.notices);
      if (Array.isArray(data.contacts)) this.saveContacts(data.contacts);
      if (Array.isArray(data.notes)) this.saveNotes(data.notes);
      if (Array.isArray(data.educationPlans)) this.saveEducationPlans(data.educationPlans);
      if (Array.isArray(data.todos)) this.saveTodos(data.todos);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  // Export students list to Excel/CSV
  exportStudentsExcel(students: Student[]): void {
    const exportRows = students.map((s, index) => ({
      STT: index + 1,
      'Mã học sinh': s.code,
      'Họ và tên': s.fullName,
      'Ngày sinh': s.dob,
      'Giới tính': s.gender,
      Tổ: s.group,
      'Họ tên phụ huynh': s.guardianName,
      'Mối quan hệ': s.guardianRelationship,
      'Điện thoại liên hệ': s.guardianPhone,
      'Địa chỉ': s.address || '',
      'Ghi chú học tập': s.notesStudy || '',
      'Ghi chú nề nếp': s.notesDiscipline || '',
      'Điểm mạnh / Năng khiếu': s.strengths || '',
      'Mục tiêu rèn luyện': s.personalGoals || '',
      'Nội dung cần chú ý': (s.attentionTags || []).join(', '),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách học sinh 6-13');
    XLSX.writeFile(workbook, `DanhSach_Lop613_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  // Download a standard pre-formatted Excel template for Class 6/13
  downloadSampleExcelTemplate(): void {
    const templateData = [
      {
        'STT': 1,
        'Mã học sinh': 'HS61301',
        'Họ và tên': 'Nguyễn An Khang',
        'Ngày sinh': '12/03/2014',
        'Giới tính': 'Nam',
        'Tổ': 'Tổ 1',
        'Họ tên phụ huynh': 'Nguyễn Văn Hùng',
        'Mối quan hệ': 'Bố',
        'Điện thoại liên hệ': '0903124589',
        'Địa chỉ': 'Số 14, Ngõ 82, Phố Kim Mã',
        'Ghi chú học tập': 'Học chắc Toán, tiếp thu nhanh',
        'Ghi chú nề nếp': 'Tự giác, năng động',
        'Điểm mạnh / Năng khiếu': 'Tư duy logic, nhiệt tình giúp bạn',
        'Mục tiêu rèn luyện': 'Rèn chữ viết cẩn thận hơn',
        'Biện pháp hỗ trợ': 'Khích lệ làm nhóm trưởng học tập',
      },
      {
        'STT': 2,
        'Mã học sinh': 'HS61302',
        'Họ và tên': 'Trần Bảo Anh',
        'Ngày sinh': '25/07/2014',
        'Giới tính': 'Nữ',
        'Tổ': 'Tổ 1',
        'Họ tên phụ huynh': 'Lê Thị Thu Thủy',
        'Mối quan hệ': 'Mẹ',
        'Điện thoại liên hệ': '0912445890',
        'Địa chỉ': 'Căn 502, Chung cư Sunrise',
        'Ghi chú học tập': 'Tiếng Anh và Mỹ thuật nổi trội',
        'Ghi chú nề nếp': 'Trầm tính, giữ trật tự tốt',
        'Điểm mạnh / Năng khiếu': 'Vẽ đẹp, khéo tay',
        'Mục tiêu rèn luyện': 'Mạnh dạn phát biểu xây dựng bài',
        'Biện pháp hỗ trợ': 'Giao phụ trách trang trí bảng lớp',
      },
      {
        'STT': 3,
        'Mã học sinh': 'HS61303',
        'Họ và tên': 'Lê Minh Khôi',
        'Ngày sinh': '18/01/2014',
        'Giới tính': 'Nam',
        'Tổ': 'Tổ 2',
        'Họ tên phụ huynh': 'Lê Đình Trọng',
        'Mối quan hệ': 'Bố',
        'Điện thoại liên hệ': '0988776655',
        'Địa chỉ': 'Số 45, Đường Lê Duẩn',
        'Ghi chú học tập': 'Tiếp thu tốt, thỉnh thoảng quên đồ dùng',
        'Ghi chú nề nếp': 'Hiếu động, thích đùa vui',
        'Điểm mạnh / Năng khiếu': 'Đá bóng giỏi, nhiệt tình',
        'Mục tiêu rèn luyện': 'Chuẩn bị cặp sách trước khi đi ngủ',
        'Biện pháp hỗ trợ': 'Nhờ bạn tổ trưởng nhắc nhở buổi tối',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    // Auto-adjust column widths
    worksheet['!cols'] = [
      { wch: 6 },  // STT
      { wch: 14 }, // Mã học sinh
      { wch: 22 }, // Họ và tên
      { wch: 14 }, // Ngày sinh
      { wch: 10 }, // Giới tính
      { wch: 10 }, // Tổ
      { wch: 22 }, // Họ tên phụ huynh
      { wch: 12 }, // Mối quan hệ
      { wch: 16 }, // Điện thoại
      { wch: 28 }, // Địa chỉ
      { wch: 26 }, // Ghi chú học tập
      { wch: 22 }, // Ghi chú nề nếp
      { wch: 24 }, // Điểm mạnh
      { wch: 24 }, // Mục tiêu
      { wch: 26 }, // Biện pháp hỗ trợ
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách học sinh 6-13');
    XLSX.writeFile(workbook, 'Mau_Nhap_Danh_Sach_Hoc_Sinh_Lop_613.xlsx');
  },

  // Parse Excel or CSV file to Student array with flexible header aliases & date formatting
  async parseStudentsFile(file: File): Promise<{ success: boolean; data: Student[]; errors: string[] }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          if (!rawRows || rawRows.length === 0) {
            return resolve({ success: false, data: [], errors: ['Tệp rỗng hoặc không có dữ liệu.'] });
          }

          const students: Student[] = [];
          const errors: string[] = [];
          const seenCodes = new Set<string>();

          // Helper to find value by multiple possible header keys
          const getVal = (row: any, keys: string[]): string => {
            for (const key of keys) {
              const lowerKey = key.toLowerCase().trim();
              for (const rowKey of Object.keys(row)) {
                if (rowKey.toLowerCase().trim() === lowerKey && row[rowKey] !== undefined && row[rowKey] !== null) {
                  return String(row[rowKey]).trim();
                }
              }
            }
            return '';
          };

          // Helper to format date strings (handles DD/MM/YYYY, YYYY-MM-DD, Excel dates)
          const formatDate = (val: any): string => {
            if (!val) return '2014-01-01';
            if (val instanceof Date && !isNaN(val.getTime())) {
              return val.toISOString().split('T')[0];
            }
            const str = String(val).trim();
            // DD/MM/YYYY or DD-MM-YYYY
            const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (dmyMatch) {
              const d = dmyMatch[1].padStart(2, '0');
              const m = dmyMatch[2].padStart(2, '0');
              const y = dmyMatch[3];
              return `${y}-${m}-${d}`;
            }
            // YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
              return str;
            }
            // Numeric Excel serial date (e.g. 41650)
            const num = Number(str);
            if (!isNaN(num) && num > 30000 && num < 60000) {
              const dateObj = new Date((num - (25567 + 2)) * 86400 * 1000);
              if (!isNaN(dateObj.getTime())) {
                return dateObj.toISOString().split('T')[0];
              }
            }
            return '2014-01-01';
          };

          rawRows.forEach((row, i) => {
            const rowIndex = i + 2;

            const fullName = getVal(row, [
              'Họ và tên',
              'Họ tên',
              'Họ và tên học sinh',
              'Tên học sinh',
              'Họ tên đệm và tên',
              'HoTen',
              'Tên',
            ]);

            if (!fullName) {
              errors.push(`Dòng ${rowIndex}: Bỏ qua vì thiếu Họ và tên học sinh.`);
              return;
            }

            let code = getVal(row, [
              'Mã học sinh',
              'Mã HS',
              'MaHS',
              'Mã số học sinh',
              'Mã',
              'Số định danh',
              'Code',
            ]);

            if (!code) {
              code = `HS613${String(students.length + 1).padStart(2, '0')}`;
            }

            if (seenCodes.has(code.toUpperCase())) {
              const newCode = `HS613${String(students.length + 1).padStart(2, '0')}`;
              errors.push(`Dòng ${rowIndex}: Trùng mã học sinh "${code}". Đã đổi thành "${newCode}".`);
              code = newCode;
            }
            seenCodes.add(code.toUpperCase());

            const rawGender = getVal(row, ['Giới tính', 'GioiTinh', 'Gender', 'Nam/Nữ']).toLowerCase();
            const gender: 'Nam' | 'Nữ' = rawGender.includes('nữ') || rawGender.includes('nu') || rawGender === 'f' ? 'Nữ' : 'Nam';

            let group = getVal(row, ['Tổ', 'Tổ học tập', 'To', 'Group']);
            if (!['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].includes(group)) {
              // Attempt to normalize "1", "Tổ 1", "To 1"
              if (group.includes('1')) group = 'Tổ 1';
              else if (group.includes('2')) group = 'Tổ 2';
              else if (group.includes('3')) group = 'Tổ 3';
              else if (group.includes('4')) group = 'Tổ 4';
              else group = `Tổ ${(students.length % 4) + 1}`;
            }

            const rawDob = getVal(row, ['Ngày sinh', 'NgaySinh', 'DOB', 'Năm sinh']);
            const dob = formatDate(rawDob);

            const guardianName = getVal(row, [
              'Họ tên phụ huynh',
              'Phụ huynh',
              'Họ tên cha/mẹ',
              'Người giám hộ',
              'HoTenPH',
              'Cha mẹ',
            ]) || 'Phụ huynh học sinh';

            const guardianRelationship = getVal(row, [
              'Mối quan hệ',
              'Quan hệ',
              'Bố/Mẹ',
              'Vai trò',
            ]) || 'Phụ huynh';

            const guardianPhone = getVal(row, [
              'Điện thoại liên hệ',
              'Số điện thoại',
              'SĐT',
              'Số ĐT',
              'SDT',
              'Điện thoại',
              'Phone',
            ]);

            const address = getVal(row, ['Địa chỉ', 'Địa chỉ thường trú', 'Nơi ở', 'DiaChi']);
            const notesStudy = getVal(row, ['Ghi chú học tập', 'Học lực', 'Ghi chú học sinh', 'NotesStudy']);
            const notesDiscipline = getVal(row, ['Ghi chú nề nếp', 'Hạnh kiểm', 'Nề nếp', 'NotesDiscipline']);
            const strengths = getVal(row, ['Điểm mạnh / Năng khiếu', 'Điểm mạnh', 'Năng khiếu', 'Sở trường', 'Strengths']);
            const personalGoals = getVal(row, ['Mục tiêu rèn luyện', 'Mục tiêu', 'PersonalGoals']);
            const supportMeasures = getVal(row, ['Biện pháp hỗ trợ', 'Biện pháp của cô', 'Hỗ trợ']);

            const attentionStr = getVal(row, ['Nội dung cần chú ý', 'Cần quan tâm', 'Lưu ý']);
            const attentionTags: string[] = [];
            if (attentionStr) {
              attentionStr.split(/[,;\n]/).forEach((t) => {
                const trimmed = t.trim();
                if (trimmed) attentionTags.push(trimmed);
              });
            }

            const student: Student = {
              id: `hs-import-${Date.now()}-${i}`,
              code,
              fullName,
              dob,
              gender,
              group: group as any,
              guardianName,
              guardianRelationship,
              guardianPhone,
              address,
              notesStudy,
              notesDiscipline,
              strengths,
              personalGoals,
              supportMeasures,
              needsAttention: attentionTags.length > 0,
              attentionTags,
              createdAt: new Date().toISOString(),
            };

            students.push(student);
          });

          if (students.length > 0) {
            StorageService.saveLastImportedExcel(students);
          }

          resolve({
            success: students.length > 0,
            data: students,
            errors,
          });
        } catch (err: any) {
          resolve({
            success: false,
            data: [],
            errors: ['Định dạng tệp không hợp lệ: ' + (err?.message || String(err))],
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          data: [],
          errors: ['Không thể đọc tệp đã tải lên.'],
        });
      };

      reader.readAsBinaryString(file);
    });
  },

  // Parse directly pasted text copied from Excel or Google Sheets (Tab-separated)
  parseStudentsPastedText(text: string): { success: boolean; data: Student[]; errors: string[] } {
    const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (rawLines.length === 0) {
      return { success: false, data: [], errors: ['Nội dung dán rỗng. Vui lòng dán các ô từ bảng Excel.'] };
    }

    const students: Student[] = [];
    const errors: string[] = [];
    const seenCodes = new Set<string>();

    // Helper to format date
    const formatDate = (val: string): string => {
      const str = val.trim();
      const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmyMatch) {
        return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      return '2014-01-01';
    };

    let startIndex = 0;
    const firstLineLower = rawLines[0].toLowerCase();
    // Detect if first line is a header
    if (
      firstLineLower.includes('tên') ||
      firstLineLower.includes('họ') ||
      firstLineLower.includes('stt') ||
      firstLineLower.includes('mã')
    ) {
      startIndex = 1;
    }

    for (let i = startIndex; i < rawLines.length; i++) {
      const line = rawLines[i];
      // Split by tab, or comma if no tab present
      const cols = line.includes('\t')
        ? line.split('\t').map((c) => c.trim())
        : line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

      if (cols.length === 0 || cols.every((c) => c === '')) continue;

      let code = '';
      let fullName = '';
      let dob = '2014-01-01';
      let gender: 'Nam' | 'Nữ' = 'Nam';
      let group: 'Tổ 1' | 'Tổ 2' | 'Tổ 3' | 'Tổ 4' = 'Tổ 1';
      let guardianName = 'Phụ huynh học sinh';
      let guardianRelationship = 'Phụ huynh';
      let guardianPhone = '';
      let address = '';
      let notes = '';

      // Standard Column Detection:
      // Pattern A: STT, Mã HS, Họ và tên, Ngày sinh, Giới tính, Tổ, Phụ huynh, SĐT...
      // Pattern B: Mã HS, Họ và tên, Ngày sinh, Giới tính, Tổ, Phụ huynh, SĐT...
      // Pattern C: STT, Họ và tên, Ngày sinh, Giới tính...
      const isFirstColSTT = /^\d+$/.test(cols[0]);
      let offset = isFirstColSTT ? 1 : 0;

      // Check if current col is a Code or Name
      if (cols[offset] && /^HS[0-9A-Z_-]+$/i.test(cols[offset])) {
        code = cols[offset];
        offset++;
      }

      if (cols[offset]) {
        fullName = cols[offset];
        offset++;
      } else {
        errors.push(`Dòng ${i + 1}: Thiếu Họ và tên học sinh.`);
        continue;
      }

      // If code was not set yet
      if (!code) {
        code = `HS613${String(students.length + 1).padStart(2, '0')}`;
      }

      // Check duplicate code
      if (seenCodes.has(code.toUpperCase())) {
        code = `HS613${String(students.length + 1).padStart(2, '0')}`;
      }
      seenCodes.add(code.toUpperCase());

      // Next could be DOB
      if (cols[offset]) {
        dob = formatDate(cols[offset]);
        offset++;
      }

      // Next could be Gender
      if (cols[offset]) {
        const g = cols[offset].toLowerCase();
        gender = g.includes('nữ') || g.includes('nu') || g === 'f' ? 'Nữ' : 'Nam';
        offset++;
      }

      // Next could be Group
      const fallbackGroups: ('Tổ 1' | 'Tổ 2' | 'Tổ 3' | 'Tổ 4')[] = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];
      if (cols[offset]) {
        const grpStr = cols[offset];
        if (grpStr.includes('1')) group = 'Tổ 1';
        else if (grpStr.includes('2')) group = 'Tổ 2';
        else if (grpStr.includes('3')) group = 'Tổ 3';
        else if (grpStr.includes('4')) group = 'Tổ 4';
        else group = fallbackGroups[students.length % 4];
        offset++;
      } else {
        group = fallbackGroups[students.length % 4];
      }

      // Next could be Guardian Name
      if (cols[offset]) {
        guardianName = cols[offset];
        offset++;
      }

      // Next could be Phone or Relationship
      if (cols[offset]) {
        const val = cols[offset];
        if (/^0[0-9]{8,11}$/.test(val.replace(/[\s.-]/g, ''))) {
          guardianPhone = val;
        } else {
          guardianRelationship = val;
          offset++;
          if (cols[offset]) {
            guardianPhone = cols[offset];
          }
        }
        offset++;
      }

      // Next could be Address or Notes
      if (cols[offset]) {
        address = cols[offset];
        offset++;
      }
      if (cols[offset]) {
        notes = cols[offset];
      }

      students.push({
        id: `hs-paste-${Date.now()}-${i}`,
        code,
        fullName,
        dob,
        gender,
        group,
        guardianName: guardianName || 'Phụ huynh học sinh',
        guardianRelationship: guardianRelationship || 'Phụ huynh',
        guardianPhone,
        address,
        notesStudy: notes,
        notesDiscipline: '',
        strengths: '',
        personalGoals: '',
        supportMeasures: '',
        needsAttention: false,
        attentionTags: [],
        createdAt: new Date().toISOString(),
      });
    }

    if (students.length > 0) {
      StorageService.saveLastImportedExcel(students);
    }

    return {
      success: students.length > 0,
      data: students,
      errors,
    };
  },
};
