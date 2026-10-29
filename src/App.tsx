import React, { useState, useEffect } from 'react';
import { Navbar, TabKey } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { StudentsTab } from './components/StudentsTab';
import { AttendanceTab } from './components/AttendanceTab';
import { TasksTab } from './components/TasksTab';
import { CompetitionTab } from './components/CompetitionTab';
import { ParentNoticeTab } from './components/ParentNoticeTab';
import { EducationGuidanceTab } from './components/EducationGuidanceTab';
import { PlannerTab } from './components/PlannerTab';
import { QuickNotesTab } from './components/QuickNotesTab';
import { ReportsTab } from './components/ReportsTab';
import { SettingsTab } from './components/SettingsTab';
import { StudentDetailModal } from './components/StudentDetailModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { AuthModal } from './components/AuthModal';
import { ParentPortalView } from './components/ParentPortalView';
import { ClassMediaTab } from './components/ClassMediaTab';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { StorageService } from './services/storage';
import { AccountAuthService } from './services/accountAuth';
import {
  auth,
  testConnection,
  onAuthStateChanged,
  signInAnonymously,
  getUserProfile,
  saveUserProfile,
  fbSignOut,
  AppUserProfile,
  TEACHER_DEFAULT_EMAIL,
} from './services/firebase';
import { FirestoreSync } from './services/firestoreSync';
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
} from './types';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');

  // Application Data States
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() =>
    StorageService.getAttendance()
  );
  const [tasks, setTasks] = useState<TaskItem[]>(() => StorageService.getTasks());
  const [rules, setRules] = useState<CompetitionRule[]>(() => StorageService.getRules());
  const [competitionLogs, setCompetitionLogs] = useState<CompetitionLog[]>(() =>
    StorageService.getCompetitionLogs()
  );
  const [notices, setNotices] = useState<ParentNotice[]>(() => StorageService.getNotices());
  const [contacts, setContacts] = useState<ParentContactLog[]>(() =>
    StorageService.getContacts()
  );
  const [notes, setNotes] = useState<StudentQuickNote[]>(() => StorageService.getNotes());
  const [guidancePlans, setGuidancePlans] = useState<EducationGuidancePlan[]>(() =>
    StorageService.getEducationPlans()
  );
  const [todos, setTodos] = useState<DailyWeeklyTodo[]>(() => StorageService.getTodos());

  // Auth & Roles State
  const [currentUser, setCurrentUser] = useState<AppUserProfile | null>(() =>
    AccountAuthService.getActiveSession()
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Class Media Storage State (Không gian lưu trữ ảnh & video của lớp)
  const [media, setMedia] = useState<ClassMediaItem[]>(() => StorageService.getMedia());

  // Change Password Modal State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePasswordUserType, setChangePasswordUserType] = useState<'parent' | 'teacher'>('parent');
  const [changePasswordStudentCode, setChangePasswordStudentCode] = useState<string | undefined>();
  const [changePasswordStudentName, setChangePasswordStudentName] = useState<string | undefined>();

  // Interactive Modals
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // 1. Initial connection & Auth state initialization
  useEffect(() => {
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser.uid);
          if (profile) {
            setCurrentUser(profile);
          } else {
            const isTeacher = fbUser.email === TEACHER_DEFAULT_EMAIL || !fbUser.email;
            const newProfile: AppUserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || TEACHER_DEFAULT_EMAIL,
              displayName: isTeacher ? 'Đỗ Kim Anh (GVCN)' : 'Phụ huynh học sinh',
              role: isTeacher ? 'teacher' : 'parent',
              createdAt: new Date().toISOString(),
            };
            await saveUserProfile(newProfile);
            setCurrentUser(newProfile);
          }
        } catch (err) {
          console.warn('Profile fetch warning:', err);
        }
      } else {
        // Automatically sign in anonymously as default teacher
        try {
          const userCred = await signInAnonymously(auth);
          const defaultProfile: AppUserProfile = {
            uid: userCred.user.uid,
            email: TEACHER_DEFAULT_EMAIL,
            displayName: 'Đỗ Kim Anh (GVCN)',
            role: 'teacher',
            createdAt: new Date().toISOString(),
          };
          await saveUserProfile(defaultProfile);
          setCurrentUser(defaultProfile);
        } catch (e) {
          console.warn('Auto anonymous sign-in fallback:', e);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Cloud Firestore Subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const unsubs: (() => void)[] = [];

    if (currentUser.role === 'teacher') {
      // Teacher subscribes to all class data in real-time
      unsubs.push(
        FirestoreSync.subscribeStudents((remoteStudents) => {
          if (remoteStudents.length > 0) {
            setStudents(remoteStudents);
            StorageService.saveStudents(remoteStudents);
          } else {
            // Seed Firestore with local Excel/imported roster if available
            const local = StorageService.getStudents();
            if (local.length > 0) {
              FirestoreSync.batchSaveStudents(local);
            }
          }
        })
      );

      unsubs.push(
        FirestoreSync.subscribeAttendance((remoteAtt) => {
          if (remoteAtt.length > 0) {
            setAttendance(remoteAtt);
            StorageService.saveAttendance(remoteAtt);
          }
        })
      );

      unsubs.push(
        FirestoreSync.subscribeTasks((remoteTasks) => {
          if (remoteTasks.length > 0) {
            setTasks(remoteTasks);
            StorageService.saveTasks(remoteTasks);
          }
        })
      );

      unsubs.push(
        FirestoreSync.subscribeCompetitionLogs((remoteLogs) => {
          if (remoteLogs.length > 0) {
            setCompetitionLogs(remoteLogs);
            StorageService.saveCompetitionLogs(remoteLogs);
          }
        })
      );

      unsubs.push(
        FirestoreSync.subscribeNotices((remoteNotices) => {
          if (remoteNotices.length > 0) {
            setNotices(remoteNotices);
            StorageService.saveNotices(remoteNotices);
          }
        })
      );

      unsubs.push(
        FirestoreSync.subscribeContacts((remoteContacts) => {
          if (remoteContacts.length > 0) {
            setContacts(remoteContacts);
            StorageService.saveContacts(remoteContacts);
          }
        })
      );

      unsubs.push(
        FirestoreSync.subscribeNotes((remoteNotes) => {
          if (remoteNotes.length > 0) {
            setNotes(remoteNotes);
            StorageService.saveNotes(remoteNotes);
          }
        })
      );

      unsubs.push(
        FirestoreSync.subscribeEducationPlans((remotePlans) => {
          if (remotePlans.length > 0) {
            setGuidancePlans(remotePlans);
            StorageService.saveEducationPlans(remotePlans);
          }
        })
      );

      unsubs.push(
        FirestoreSync.subscribeTodos((remoteTodos) => {
          if (remoteTodos.length > 0) {
            setTodos(remoteTodos);
            StorageService.saveTodos(remoteTodos);
          }
        })
      );

      unsubs.push(
        FirestoreSync.subscribeSettings((remoteSettings) => {
          if (remoteSettings) {
            setSettings(remoteSettings);
            StorageService.saveSettings(remoteSettings);
          }
        })
      );

      // Media subscription for teacher
      unsubs.push(
        FirestoreSync.subscribeMedia((remoteMedia) => {
          if (remoteMedia.length > 0) {
            setMedia(remoteMedia);
            StorageService.saveMedia(remoteMedia);
          } else {
            const local = StorageService.getMedia();
            if (local.length > 0) {
              FirestoreSync.batchSaveMedia(local);
            }
          }
        })
      );
    } else {
      // Parent subscribes in real-time to child data
      const childId = currentUser.linkedStudentId;
      if (childId) {
        unsubs.push(
          FirestoreSync.subscribeStudentById(childId, (st) => {
            if (st) {
              setStudents((prev) => {
                const idx = prev.findIndex((s) => s.id === st.id);
                if (idx >= 0) {
                  return prev.map((s) => (s.id === st.id ? st : s));
                }
                return [...prev, st];
              });
            }
          })
        );

        unsubs.push(
          FirestoreSync.subscribeAttendanceByStudentId(childId, (recs) => {
            setAttendance(recs);
          })
        );

        unsubs.push(
          FirestoreSync.subscribeChildCompetitionLogs(childId, (logs) => {
            setCompetitionLogs(logs);
          })
        );

        unsubs.push(
          FirestoreSync.subscribeChildContacts(childId, (conts) => {
            setContacts(conts);
          })
        );
      }

      // Public notices are visible to parents
      unsubs.push(
        FirestoreSync.subscribeNotices((remoteNotices) => {
          setNotices(remoteNotices);
        })
      );

      unsubs.push(
        FirestoreSync.subscribeTasks((remoteTasks) => {
          setTasks(remoteTasks);
        })
      );

      unsubs.push(
        FirestoreSync.subscribeSettings((remoteSettings) => {
          if (remoteSettings) {
            setSettings(remoteSettings);
          }
        })
      );

      // Media subscription for parents
      unsubs.push(
        FirestoreSync.subscribeMedia((remoteMedia) => {
          if (remoteMedia.length > 0) {
            setMedia(remoteMedia);
            StorageService.saveMedia(remoteMedia);
          }
        })
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [currentUser]);

  // Media actions
  const handleAddMedia = async (item: ClassMediaItem) => {
    const next = [item, ...media];
    setMedia(next);
    StorageService.saveMedia(next);
    try {
      await FirestoreSync.saveMediaItem(item);
    } catch (e) {
      console.warn('Failed to sync media item to Firestore:', e);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    const next = media.filter((m) => m.id !== id);
    setMedia(next);
    StorageService.saveMedia(next);
    try {
      await FirestoreSync.deleteMediaItem(id);
    } catch (e) {
      console.warn('Failed to delete media item in Firestore:', e);
    }
  };

  const handleUpdateMedia = async (item: ClassMediaItem) => {
    const next = media.map((m) => (m.id === item.id ? item : m));
    setMedia(next);
    StorageService.saveMedia(next);
    try {
      await FirestoreSync.saveMediaItem(item);
    } catch (e) {
      console.warn('Failed to update media item in Firestore:', e);
    }
  };

  // Synchronize state mutations with persistent LocalStorage and Cloud Firestore
  const handleUpdateStudents = async (newStudents: Student[]) => {
    setStudents(newStudents);
    StorageService.saveStudents(newStudents);
    try {
      await FirestoreSync.batchSaveStudents(newStudents);
    } catch (e) {
      console.warn('Firestore update students error:', e);
    }
  };

  const handleUpdateAttendance = async (newAttendance: AttendanceRecord[]) => {
    setAttendance(newAttendance);
    StorageService.saveAttendance(newAttendance);
    try {
      await FirestoreSync.batchSaveAttendance(newAttendance);
    } catch (e) {
      console.warn('Firestore update attendance error:', e);
    }
  };

  const handleUpdateTasks = async (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    StorageService.saveTasks(newTasks);
    try {
      for (const t of newTasks) {
        await FirestoreSync.saveTask(t);
      }
    } catch (e) {
      console.warn('Firestore update tasks error:', e);
    }
  };

  const handleAddCompetitionLog = async (log: CompetitionLog) => {
    const updated = [log, ...competitionLogs];
    setCompetitionLogs(updated);
    StorageService.saveCompetitionLogs(updated);
    try {
      await FirestoreSync.saveCompetitionLog(log);
    } catch (e) {
      console.warn('Firestore save competition log error:', e);
    }
  };

  const handleDeleteCompetitionLog = async (logId: string) => {
    const updated = competitionLogs.filter((l) => l.id !== logId);
    setCompetitionLogs(updated);
    StorageService.saveCompetitionLogs(updated);
    try {
      await FirestoreSync.deleteCompetitionLog(logId);
    } catch (e) {
      console.warn('Firestore delete competition log error:', e);
    }
  };

  const handleUpdateRules = (newRules: CompetitionRule[]) => {
    setRules(newRules);
    StorageService.saveRules(newRules);
  };

  const handleAddNotice = async (notice: ParentNotice) => {
    const updated = [notice, ...notices];
    setNotices(updated);
    StorageService.saveNotices(updated);
    try {
      await FirestoreSync.saveNotice(notice);
    } catch (e) {
      console.warn('Firestore save notice error:', e);
    }
  };

  const handleUpdateNotice = async (notice: ParentNotice) => {
    const updated = notices.map((n) => (n.id === notice.id ? notice : n));
    setNotices(updated);
    StorageService.saveNotices(updated);
    try {
      await FirestoreSync.saveNotice(notice);
    } catch (e) {
      console.warn('Firestore update notice error:', e);
    }
  };

  const handleAddContact = async (contact: ParentContactLog) => {
    const updated = [contact, ...contacts];
    setContacts(updated);
    StorageService.saveContacts(updated);
    try {
      await FirestoreSync.saveContact(contact);
    } catch (e) {
      console.warn('Firestore save contact error:', e);
    }
  };

  const handleAddNote = async (note: StudentQuickNote) => {
    const updated = [note, ...notes];
    setNotes(updated);
    StorageService.saveNotes(updated);
    try {
      await FirestoreSync.saveNote(note);
    } catch (e) {
      console.warn('Firestore save note error:', e);
    }
  };

  const handleUpdateNotes = async (newNotes: StudentQuickNote[]) => {
    setNotes(newNotes);
    StorageService.saveNotes(newNotes);
    try {
      for (const n of newNotes) {
        await FirestoreSync.saveNote(n);
      }
    } catch (e) {
      console.warn('Firestore update notes error:', e);
    }
  };

  const handleAddGuidancePlan = async (plan: EducationGuidancePlan) => {
    const updated = [plan, ...guidancePlans];
    setGuidancePlans(updated);
    StorageService.saveEducationPlans(updated);
    try {
      await FirestoreSync.saveEducationPlan(plan);
    } catch (e) {
      console.warn('Firestore save guidance plan error:', e);
    }
  };

  const handleUpdateGuidancePlan = async (plan: EducationGuidancePlan) => {
    const updated = guidancePlans.map((p) => (p.id === plan.id ? plan : p));
    setGuidancePlans(updated);
    StorageService.saveEducationPlans(updated);
    try {
      await FirestoreSync.saveEducationPlan(plan);
    } catch (e) {
      console.warn('Firestore update guidance plan error:', e);
    }
  };

  const handleUpdateTodos = async (newTodos: DailyWeeklyTodo[]) => {
    setTodos(newTodos);
    StorageService.saveTodos(newTodos);
    try {
      for (const td of newTodos) {
        await FirestoreSync.saveTodo(td);
      }
    } catch (e) {
      console.warn('Firestore update todos error:', e);
    }
  };

  const handleToggleTodo = async (todoId: string) => {
    const target = todos.find((t) => t.id === todoId);
    if (!target) return;
    const updated = todos.map((t) => {
      if (t.id === todoId) {
        return { ...t, isCompleted: !t.isCompleted };
      }
      return t;
    });
    setTodos(updated);
    StorageService.saveTodos(updated);
    try {
      await FirestoreSync.saveTodo({ ...target, isCompleted: !target.isCompleted });
    } catch (e) {
      console.warn('Firestore toggle todo error:', e);
    }
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    try {
      await FirestoreSync.saveSettings(newSettings);
    } catch (e) {
      console.warn('Firestore update settings error:', e);
    }
  };

  const handleResetDemo = () => {
    StorageService.resetToDemo();
    setSettings(StorageService.getSettings());
    setStudents(StorageService.getStudents());
    setAttendance(StorageService.getAttendance());
    setTasks(StorageService.getTasks());
    setRules(StorageService.getRules());
    setCompetitionLogs(StorageService.getCompetitionLogs());
    setNotices(StorageService.getNotices());
    setContacts(StorageService.getContacts());
    setNotes(StorageService.getNotes());
    setGuidancePlans(StorageService.getEducationPlans());
    setTodos(StorageService.getTodos());
    alert('Đã khôi phục toàn bộ dữ liệu mẫu ban đầu!');
  };

  const handleClearForReal = async () => {
    StorageService.clearForRealClass(settings.teacherName, settings.className);
    setSettings(StorageService.getSettings());
    setStudents(StorageService.getStudents());
    setAttendance(StorageService.getAttendance());
    setTasks(StorageService.getTasks());
    setRules(StorageService.getRules());
    setCompetitionLogs(StorageService.getCompetitionLogs());
    setNotices(StorageService.getNotices());
    setContacts(StorageService.getContacts());
    setNotes(StorageService.getNotes());
    setGuidancePlans(StorageService.getEducationPlans());
    setTodos(StorageService.getTodos());
    setCurrentTab('students');
    try {
      await FirestoreSync.clearAllStudents();
    } catch (e) {
      console.warn('Clear Firestore students error:', e);
    }
    alert('Đã làm trống danh sách học sinh. Cô giáo có thể bắt đầu nạp danh sách học sinh thật từ file Excel.');
  };

  const handleLockWeek = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
    alert(
      `Đã khóa sổ thi đua Tuần ${settings.currentWeek}! Kết quả đã được lưu trữ cho tiết Sinh hoạt lớp.`
    );
  };

  // Quick switch role between Teacher and Parent for instant multi-device testing
  const handleQuickSwitchRole = async () => {
    if (!currentUser) return;

    if (currentUser.role === 'teacher') {
      // Switch to Parent
      const targetStudent = students.length > 0 ? students[0] : null;
      const parentProfile: AppUserProfile = {
        ...currentUser,
        role: 'parent',
        displayName: targetStudent ? `Phụ huynh em ${targetStudent.fullName}` : 'Phụ huynh học sinh',
        linkedStudentId: targetStudent?.id,
        linkedStudentCode: targetStudent?.code,
        linkedStudentName: targetStudent?.fullName,
      };
      await saveUserProfile(parentProfile);
      setCurrentUser(parentProfile);
    } else {
      // Switch to Teacher
      const teacherProfile: AppUserProfile = {
        ...currentUser,
        role: 'teacher',
        displayName: 'Đỗ Kim Anh (GVCN)',
      };
      await saveUserProfile(teacherProfile);
      setCurrentUser(teacherProfile);
    }
  };

  // Parent sending feedback to teacher
  const handleParentSendFeedback = async (topic: string, message: string) => {
    const parentStudent =
      students.find(
        (s) => s.id === currentUser?.linkedStudentId || s.code === currentUser?.linkedStudentCode
      ) || students[0];

    const newContactLog: ParentContactLog = {
      id: `feedback-${Date.now()}`,
      studentId: parentStudent ? parentStudent.id : 'unknown',
      studentName: parentStudent ? parentStudent.fullName : 'Học sinh',
      guardianName: currentUser?.displayName || 'Phụ huynh',
      date: new Date().toISOString().split('T')[0],
      topic: `[PH gửi cô Kim Anh] ${topic}`,
      summary: message,
      channel: 'Zalo',
      outcome: 'Đã nhận tin nhắn từ phụ huynh qua Sổ liên lạc điện tử',
      nextAction: 'Cô Kim Anh kiểm tra và phản hồi phụ huynh',
      status: 'Cần theo dõi tiếp',
    };

    await handleAddContact(newContactLog);
  };

  // ===================== RENDER PARENT VIEW IF ROLE IS PARENT =====================
  if (currentUser && currentUser.role === 'parent') {
    const childStudent =
      students.find(
        (s) => s.id === currentUser.linkedStudentId || s.code === currentUser.linkedStudentCode
      ) || (students.length > 0 ? students[0] : null);

    return (
      <>
        <ParentPortalView
          currentUser={currentUser}
          student={childStudent}
          attendance={attendance}
          tasks={tasks}
          competitionLogs={competitionLogs}
          notices={notices}
          contacts={contacts}
          educationPlans={guidancePlans}
          settings={settings}
          media={media}
          onAddMedia={handleAddMedia}
          onDeleteMedia={handleDeleteMedia}
          onUpdateMedia={handleUpdateMedia}
          onLogout={async () => {
            AccountAuthService.clearActiveSession();
            await fbSignOut(auth);
            setCurrentUser(null);
          }}
          onSwitchToTeacher={handleQuickSwitchRole}
          onSendFeedbackToTeacher={handleParentSendFeedback}
          onOpenChangePassword={(code?: string, name?: string) => {
            setChangePasswordUserType('parent');
            setChangePasswordStudentCode(code);
            setChangePasswordStudentName(name);
            setIsChangePasswordOpen(true);
          }}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          students={students}
          onAuthSuccess={(p) => setCurrentUser(p)}
          onOpenChangePassword={(userType: 'teacher' | 'parent', code?: string, name?: string) => {
            setChangePasswordUserType(userType);
            setChangePasswordStudentCode(code);
            setChangePasswordStudentName(name);
            setIsChangePasswordOpen(true);
          }}
        />

        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          userType={changePasswordUserType}
          studentCode={changePasswordStudentCode}
          studentName={changePasswordStudentName}
        />
      </>
    );
  }

  // ===================== RENDER TEACHER PORTAL =====================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Sticky Main Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        settings={settings}
        students={students}
        todos={todos}
        notices={notices}
        mediaCount={media.length}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenChangePassword={() => {
          setChangePasswordUserType('teacher');
          setChangePasswordStudentCode(undefined);
          setChangePasswordStudentName(undefined);
          setIsChangePasswordOpen(true);
        }}
        onQuickSwitchRole={handleQuickSwitchRole}
      />

      {/* Main Body Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardTab
            students={students}
            attendance={attendance}
            tasks={tasks}
            todos={todos}
            notices={notices}
            competitionLogs={competitionLogs}
            settings={settings}
            onNavigate={(tab) => setCurrentTab(tab as TabKey)}
            onToggleTodo={handleToggleTodo}
            onSelectStudent={(st) => setSelectedStudentForDetail(st)}
            onOpenAiParentDraft={() => setCurrentTab('notices')}
          />
        )}

        {currentTab === 'students' && (
          <StudentsTab
            students={students}
            onUpdateStudents={handleUpdateStudents}
            onSelectStudent={(st) => setSelectedStudentForDetail(st)}
          />
        )}

        {currentTab === 'attendance' && (
          <AttendanceTab
            students={students}
            attendance={attendance}
            onUpdateAttendance={handleUpdateAttendance}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksTab
            tasks={tasks}
            students={students}
            onUpdateTasks={handleUpdateTasks}
            onAddCompetitionLog={handleAddCompetitionLog}
            currentWeek={settings.currentWeek}
          />
        )}

        {currentTab === 'competition' && (
          <CompetitionTab
            students={students}
            rules={rules}
            competitionLogs={competitionLogs}
            settings={settings}
            onAddLog={handleAddCompetitionLog}
            onDeleteLog={handleDeleteCompetitionLog}
            onUpdateRules={handleUpdateRules}
            onLockWeek={handleLockWeek}
          />
        )}

        {currentTab === 'notices' && (
          <ParentNoticeTab
            notices={notices}
            students={students}
            contacts={contacts}
            settings={settings}
            onAddNotice={handleAddNotice}
            onUpdateNotice={handleUpdateNotice}
            onAddContact={handleAddContact}
          />
        )}

        {currentTab === 'guidance' && (
          <EducationGuidanceTab
            students={students}
            guidancePlans={guidancePlans}
            onAddGuidancePlan={handleAddGuidancePlan}
            onUpdateGuidancePlan={handleUpdateGuidancePlan}
          />
        )}

        {currentTab === 'planner' && (
          <PlannerTab
            todos={todos}
            students={students}
            onUpdateTodos={handleUpdateTodos}
            onToggleTodo={handleToggleTodo}
          />
        )}

        {currentTab === 'notes' && (
          <QuickNotesTab
            notes={notes}
            students={students}
            onUpdateNotes={handleUpdateNotes}
            onAddTodo={(td) => handleUpdateTodos([td, ...todos])}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsTab
            students={students}
            attendance={attendance}
            tasks={tasks}
            competitionLogs={competitionLogs}
            contacts={contacts}
            todos={todos}
            settings={settings}
          />
        )}

        {currentTab === 'media' && (
          <ClassMediaTab
            media={media}
            onAddMedia={handleAddMedia}
            onDeleteMedia={handleDeleteMedia}
            onUpdateMedia={handleUpdateMedia}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetDemo={handleResetDemo}
            onClearForReal={handleClearForReal}
          />
        )}
      </main>

      {/* Student Detailed Profile Modal */}
      {selectedStudentForDetail && (
        <StudentDetailModal
          student={selectedStudentForDetail}
          onClose={() => setSelectedStudentForDetail(null)}
          onUpdateStudent={(updatedStudent) => {
            const next = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
            handleUpdateStudents(next);
            setSelectedStudentForDetail(updatedStudent);
          }}
          onAddNote={handleAddNote}
          onAddContact={handleAddContact}
          onAddGuidancePlan={handleAddGuidancePlan}
          attendance={attendance}
          tasks={tasks}
          notes={notes}
          guidancePlans={guidancePlans}
          contacts={contacts}
        />
      )}

      {/* AI Assistant Chat Modal */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        students={students}
        attendance={attendance}
        tasks={tasks}
        todos={todos}
        settings={settings}
      />

      {/* Auth & Role Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        students={students}
        onAuthSuccess={(p) => setCurrentUser(p)}
        onOpenChangePassword={(userType: 'teacher' | 'parent', code?: string, name?: string) => {
          setChangePasswordUserType(userType);
          setChangePasswordStudentCode(code);
          setChangePasswordStudentName(name);
          setIsChangePasswordOpen(true);
        }}
      />

      {/* Change Password Modal for Teacher/Parent */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userType={changePasswordUserType}
        studentCode={changePasswordStudentCode}
        studentName={changePasswordStudentName}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Ứng dụng <strong>Lớp Học Hạnh Phúc – Lớp 6/13</strong> • Giáo viên chủ nhiệm: <strong>Đỗ Kim Anh</strong>
          </p>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Cloud Firestore Đồng bộ Trực tuyến</span>
            <span>•</span>
            <span>THCS Đàm Quang Trung</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
