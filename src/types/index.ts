export type Gender = 'Nam' | 'Nữ';
export type GroupName = 'Tổ 1' | 'Tổ 2' | 'Tổ 3' | 'Tổ 4';

export interface Student {
  id: string;
  code: string;
  fullName: string;
  dob: string;
  gender: Gender;
  group: GroupName;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship: string;
  address?: string;
  notesStudy?: string;
  notesDiscipline?: string;
  strengths?: string;
  personalGoals?: string;
  supportMeasures?: string;
  needsAttention: boolean;
  attentionTags: string[];
  avatarSeed?: string;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late' | 'other';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  session: 'Sáng' | 'Chiều';
  studentId: string;
  status: AttendanceStatus;
  reason?: string;
  timeRecorded: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'needs_help';
export type TaskAssigneeType = 'all' | 'group' | 'student';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignedToType: TaskAssigneeType;
  targetGroup?: GroupName;
  targetStudentId?: string;
  assignedDate: string;
  dueDate: string;
  priority: TaskPriority;
  criteria: string;
  status: TaskStatus;
  resultNote?: string;
  bonusPoints?: number;
  createdAt: string;
}

export interface CompetitionRule {
  id: string;
  name: string;
  category: 'Chuyên cần & đúng giờ' | 'Học tập & chuẩn bị bài' | 'Ý thức & nề nếp' | 'Vệ sinh & tài sản chung' | 'Hợp tác & giúp bạn' | 'Hoạt động tập thể' | 'Việc tốt & tiến bộ';
  points: number; // positive for bonus, negative for penalty
  isPenalty: boolean;
  description?: string;
}

export interface CompetitionLog {
  id: string;
  studentId: string;
  studentName: string;
  group: GroupName;
  weekNumber: number;
  ruleId?: string;
  ruleName: string;
  points: number;
  reason: string;
  recordedAt: string;
  verified: boolean;
}

export interface ParentNotice {
  id: string;
  title: string;
  rawText: string;
  finalContent: string;
  highlights: {
    deadline: string;
    amount: string;
    timeLocation: string;
    audience: string;
    documents: string;
    actionRequired: string;
  };
  detectedMissingInfo: string[];
  adviceNotes?: string;
  mode: string;
  styleModifier: string;
  status: 'draft' | 'copied' | 'sent' | 'responded';
  createdAt: string;
}

export interface ParentContactLog {
  id: string;
  studentId: string;
  studentName: string;
  guardianName: string;
  date: string;
  topic: string;
  summary: string;
  channel: 'Zalo' | 'Điện thoại' | 'Gặp trực tiếp' | 'Khác';
  outcome: string;
  nextAction?: string;
  nextFollowUpDate?: string;
  status: 'Đã hoàn thành' | 'Cần theo dõi tiếp';
}

export interface StudentQuickNote {
  id: string;
  studentId: string;
  studentName: string;
  group: GroupName;
  date: string;
  category:
    | 'Học tập'
    | 'Chữ viết và trình bày'
    | 'Nề nếp và tự giác'
    | 'Giao tiếp và quan hệ bạn bè'
    | 'Cảm xúc và thích nghi'
    | 'Điểm mạnh và sở trường'
    | 'Việc tốt, tiến bộ'
    | 'Phối hợp gia đình'
    | 'Hỗ trợ cá nhân'
    | 'Khác';
  content: string;
  priority: 'Bình thường' | 'Quan trọng' | 'Cần chú ý ngay';
  plannedAction: string;
  recheckDate?: string;
  outcome?: string;
  status: 'Đang theo dõi' | 'Đã cải thiện';
  createdAt: string;
}

export interface EducationGuidancePlan {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  date: string;
  behaviorDescription: string;
  timeContext: string;
  frequency: string;
  knownContext: string;
  actionsTaken: string;
  initialResults: string;
  aiResult: {
    situationSummary: string;
    educationGoals: string;
    causeExplorationQuestions: string[];
    communicationScript: string;
    educationSteps: string[];
    parentMessageDraft: string;
    postEducationTracking: string;
    evaluationCriteria: string;
    safetyAlert?: string | null;
  };
  status: 'Đang thực hiện' | 'Có tiến bộ' | 'Cần hỗ trợ thêm';
}

export interface DailyWeeklyTodo {
  id: string;
  title: string;
  scope: 'daily' | 'weekly';
  dayOfWeek?: number; // 2: Thứ 2, 3: Thứ 3, ..., 7: Thứ 7, 8: Chủ nhật
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  category: string;
  note?: string;
  linkedStudentId?: string;
  createdAt: string;
}

export interface AppSettings {
  className: string;
  teacherName: string;
  schoolName: string;
  academicYear: string;
  currentWeek: number;
  startingScore: number;
  maxWeeklyScore: number;
  minWeeklyScore: number;
  isDemoMode: boolean;
}

export type MediaType = 'photo' | 'video';

export interface ClassMediaItem {
  id: string;
  title: string;
  type: MediaType;
  url: string; // Image URL / base64 or video URL / embed URL
  thumbnailUrl?: string;
  album: string; // e.g. "Lễ Khai Giảng", "Giờ Học Hạnh Phúc", "Hội Thao & Ngoại Khóa", "Sinh Nhật Lớp", "Tri Ân Thầy Cô"
  caption?: string;
  date: string; // YYYY-MM-DD
  uploaderName: string;
  uploaderRole: 'teacher' | 'parent';
  fileSizeStr?: string;
  duration?: string; // e.g. "02:15"
  likesCount: number;
  tags?: string[];
  createdAt: string;
}

export interface ParentAccount {
  studentCode: string; // Unique username (e.g. HS61301)
  studentId: string;
  studentName: string;
  passwordHashOrVal: string; // Default: '12345678'
  isPasswordChanged: boolean;
  lastPasswordChange?: string;
  updatedAt: string;
}

