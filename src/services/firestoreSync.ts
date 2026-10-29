import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Student,
  AttendanceRecord,
  TaskItem,
  CompetitionLog,
  ParentNotice,
  ParentContactLog,
  StudentQuickNote,
  EducationGuidancePlan,
  DailyWeeklyTodo,
  AppSettings,
  ClassMediaItem,
} from '../types';

export const FirestoreSync = {
  // ===================== STUDENTS =====================
  subscribeStudents(callback: (students: Student[]) => void): Unsubscribe {
    const colRef = collection(db, 'students');
    return onSnapshot(colRef, (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Student);
      });
      callback(list);
    }, (error) => {
      console.warn('Students subscription error:', error.message);
    });
  },

  subscribeStudentById(studentId: string, callback: (student: Student | null) => void): Unsubscribe {
    const docRef = doc(db, 'students', studentId);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Student);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn('Student detail subscription error:', error.message);
    });
  },

  async saveStudent(student: Student): Promise<void> {
    await setDoc(doc(db, 'students', student.id), student, { merge: true });
  },

  async deleteStudent(studentId: string): Promise<void> {
    await deleteDoc(doc(db, 'students', studentId));
  },

  async batchSaveStudents(students: Student[]): Promise<void> {
    const batch = writeBatch(db);
    students.forEach((st) => {
      batch.set(doc(db, 'students', st.id), st, { merge: true });
    });
    await batch.commit();
  },

  async clearAllStudents(): Promise<void> {
    const snap = await getDocs(collection(db, 'students'));
    const batch = writeBatch(db);
    snap.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  },

  // ===================== ATTENDANCE =====================
  subscribeAttendance(callback: (attendance: AttendanceRecord[]) => void): Unsubscribe {
    const colRef = collection(db, 'attendance');
    return onSnapshot(colRef, (snapshot) => {
      const list: AttendanceRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AttendanceRecord);
      });
      callback(list);
    }, (error) => {
      console.warn('Attendance subscription error:', error.message);
    });
  },

  subscribeAttendanceByStudentId(studentId: string, callback: (attendance: AttendanceRecord[]) => void): Unsubscribe {
    const q = query(collection(db, 'attendance'), where('studentId', '==', studentId));
    return onSnapshot(q, (snapshot) => {
      const list: AttendanceRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AttendanceRecord);
      });
      callback(list);
    }, (error) => {
      console.warn('Child attendance subscription error:', error.message);
    });
  },

  async saveAttendanceRecord(rec: AttendanceRecord): Promise<void> {
    await setDoc(doc(db, 'attendance', rec.id), rec, { merge: true });
  },

  async batchSaveAttendance(records: AttendanceRecord[]): Promise<void> {
    const batch = writeBatch(db);
    records.forEach((r) => {
      batch.set(doc(db, 'attendance', r.id), r, { merge: true });
    });
    await batch.commit();
  },

  // ===================== TASKS =====================
  subscribeTasks(callback: (tasks: TaskItem[]) => void): Unsubscribe {
    const colRef = collection(db, 'tasks');
    return onSnapshot(colRef, (snapshot) => {
      const list: TaskItem[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as TaskItem);
      });
      callback(list);
    }, (error) => {
      console.warn('Tasks subscription error:', error.message);
    });
  },

  async saveTask(task: TaskItem): Promise<void> {
    await setDoc(doc(db, 'tasks', task.id), task, { merge: true });
  },

  async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'tasks', taskId));
  },

  // ===================== COMPETITION LOGS =====================
  subscribeCompetitionLogs(callback: (logs: CompetitionLog[]) => void): Unsubscribe {
    const colRef = collection(db, 'competition_logs');
    return onSnapshot(colRef, (snapshot) => {
      const list: CompetitionLog[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as CompetitionLog);
      });
      callback(list);
    }, (error) => {
      console.warn('Competition logs subscription error:', error.message);
    });
  },

  subscribeChildCompetitionLogs(studentId: string, callback: (logs: CompetitionLog[]) => void): Unsubscribe {
    const q = query(collection(db, 'competition_logs'), where('studentId', '==', studentId));
    return onSnapshot(q, (snapshot) => {
      const list: CompetitionLog[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as CompetitionLog);
      });
      callback(list);
    }, (error) => {
      console.warn('Child competition logs error:', error.message);
    });
  },

  async saveCompetitionLog(log: CompetitionLog): Promise<void> {
    await setDoc(doc(db, 'competition_logs', log.id), log, { merge: true });
  },

  async deleteCompetitionLog(logId: string): Promise<void> {
    await deleteDoc(doc(db, 'competition_logs', logId));
  },

  // ===================== NOTICES =====================
  subscribeNotices(callback: (notices: ParentNotice[]) => void): Unsubscribe {
    const colRef = collection(db, 'notices');
    return onSnapshot(colRef, (snapshot) => {
      const list: ParentNotice[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ParentNotice);
      });
      callback(list);
    }, (error) => {
      console.warn('Notices subscription error:', error.message);
    });
  },

  async saveNotice(notice: ParentNotice): Promise<void> {
    await setDoc(doc(db, 'notices', notice.id), notice, { merge: true });
  },

  async deleteNotice(noticeId: string): Promise<void> {
    await deleteDoc(doc(db, 'notices', noticeId));
  },

  // ===================== CONTACTS =====================
  subscribeContacts(callback: (contacts: ParentContactLog[]) => void): Unsubscribe {
    const colRef = collection(db, 'parent_contacts');
    return onSnapshot(colRef, (snapshot) => {
      const list: ParentContactLog[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ParentContactLog);
      });
      callback(list);
    }, (error) => {
      console.warn('Contacts subscription error:', error.message);
    });
  },

  subscribeChildContacts(studentId: string, callback: (contacts: ParentContactLog[]) => void): Unsubscribe {
    const q = query(collection(db, 'parent_contacts'), where('studentId', '==', studentId));
    return onSnapshot(q, (snapshot) => {
      const list: ParentContactLog[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ParentContactLog);
      });
      callback(list);
    }, (error) => {
      console.warn('Child contacts subscription error:', error.message);
    });
  },

  async saveContact(contact: ParentContactLog): Promise<void> {
    await setDoc(doc(db, 'parent_contacts', contact.id), contact, { merge: true });
  },

  // ===================== NOTES (TEACHER ONLY) =====================
  subscribeNotes(callback: (notes: StudentQuickNote[]) => void): Unsubscribe {
    const colRef = collection(db, 'student_notes');
    return onSnapshot(colRef, (snapshot) => {
      const list: StudentQuickNote[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as StudentQuickNote);
      });
      callback(list);
    }, (error) => {
      console.warn('Notes subscription error:', error.message);
    });
  },

  async saveNote(note: StudentQuickNote): Promise<void> {
    await setDoc(doc(db, 'student_notes', note.id), note, { merge: true });
  },

  async deleteNote(noteId: string): Promise<void> {
    await deleteDoc(doc(db, 'student_notes', noteId));
  },

  // ===================== EDUCATION PLANS =====================
  subscribeEducationPlans(callback: (plans: EducationGuidancePlan[]) => void): Unsubscribe {
    const colRef = collection(db, 'education_plans');
    return onSnapshot(colRef, (snapshot) => {
      const list: EducationGuidancePlan[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as EducationGuidancePlan);
      });
      callback(list);
    }, (error) => {
      console.warn('Education plans subscription error:', error.message);
    });
  },

  async saveEducationPlan(plan: EducationGuidancePlan): Promise<void> {
    await setDoc(doc(db, 'education_plans', plan.id), plan, { merge: true });
  },

  // ===================== TODOS (TEACHER ONLY) =====================
  subscribeTodos(callback: (todos: DailyWeeklyTodo[]) => void): Unsubscribe {
    const colRef = collection(db, 'todos');
    return onSnapshot(colRef, (snapshot) => {
      const list: DailyWeeklyTodo[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as DailyWeeklyTodo);
      });
      callback(list);
    }, (error) => {
      console.warn('Todos subscription error:', error.message);
    });
  },

  async saveTodo(todo: DailyWeeklyTodo): Promise<void> {
    await setDoc(doc(db, 'todos', todo.id), todo, { merge: true });
  },

  async deleteTodo(todoId: string): Promise<void> {
    await deleteDoc(doc(db, 'todos', todoId));
  },

  // ===================== SETTINGS =====================
  subscribeSettings(callback: (settings: AppSettings | null) => void): Unsubscribe {
    const docRef = doc(db, 'settings', 'class_settings');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as AppSettings);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn('Settings subscription error:', error.message);
    });
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await setDoc(doc(db, 'settings', 'class_settings'), settings, { merge: true });
  },

  // ===================== CLASS MEDIA (PHOTOS & VIDEOS) =====================
  subscribeMedia(callback: (media: ClassMediaItem[]) => void): Unsubscribe {
    const colRef = collection(db, 'class_media');
    return onSnapshot(colRef, (snapshot) => {
      const list: ClassMediaItem[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ClassMediaItem);
      });
      // Sort by date descending
      list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
      callback(list);
    }, (error) => {
      console.warn('Class media subscription error:', error.message);
    });
  },

  async saveMediaItem(item: ClassMediaItem): Promise<void> {
    await setDoc(doc(db, 'class_media', item.id), item, { merge: true });
  },

  async deleteMediaItem(mediaId: string): Promise<void> {
    await deleteDoc(doc(db, 'class_media', mediaId));
  },

  async batchSaveMedia(items: ClassMediaItem[]): Promise<void> {
    const batch = writeBatch(db);
    items.forEach((m) => {
      batch.set(doc(db, 'class_media', m.id), m, { merge: true });
    });
    await batch.commit();
  },
};

