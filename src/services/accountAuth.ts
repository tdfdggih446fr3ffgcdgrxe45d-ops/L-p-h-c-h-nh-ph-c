import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, AppUserProfile, TEACHER_DEFAULT_EMAIL } from './firebase';
import { Student, ParentAccount } from '../types';
import { sampleDemoStudents } from '../data/mockData';

// Constants requested by User
export const TEACHER_CREDENTIALS = {
  phone: '0399679445',
  email: TEACHER_DEFAULT_EMAIL,
  defaultPassword: 'Abcd@1234',
  displayName: 'Đỗ Kim Anh (GVCN)',
};

export const PARENT_DEFAULT_PASSWORD = '12345678';

const STORAGE_KEYS = {
  TEACHER_PASSWORD: 'happy_class_teacher_password_v1',
  PARENT_ACCOUNTS: 'happy_class_parent_accounts_v1',
  CURRENT_USER_SESSION: 'happy_class_active_user_session_v1',
};

// Local storage helper
function getLocalParentAccounts(): Record<string, ParentAccount> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PARENT_ACCOUNTS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to read parent accounts from local storage:', e);
    return {};
  }
}

function saveLocalParentAccounts(accounts: Record<string, ParentAccount>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PARENT_ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to write parent accounts to local storage:', e);
  }
}

export const AccountAuthService = {
  // ===================== TEACHER AUTHENTICATION =====================
  // Teacher logs in with Phone: 0399679445, Password: Abcd@1234
  async getTeacherPassword(): Promise<string> {
    const local = localStorage.getItem(STORAGE_KEYS.TEACHER_PASSWORD);
    if (local) return local;

    try {
      const docRef = doc(db, 'settings', 'teacher_auth');
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().password) {
        const pass = snap.data().password;
        localStorage.setItem(STORAGE_KEYS.TEACHER_PASSWORD, pass);
        return pass;
      }
    } catch (e) {
      console.warn('Could not read teacher auth doc from Firestore:', e);
    }

    return TEACHER_CREDENTIALS.defaultPassword;
  },

  async verifyTeacherLogin(identifier: string, passwordInput: string): Promise<{
    success: boolean;
    error?: string;
    profile?: AppUserProfile;
  }> {
    const cleanId = identifier.trim().replace(/[\s.-]/g, '');
    const validIds = [
      TEACHER_CREDENTIALS.phone,
      TEACHER_CREDENTIALS.email.toLowerCase(),
      'dokimanh',
      '0399679445',
    ];

    if (!validIds.includes(cleanId.toLowerCase()) && !cleanId.includes('0399679445')) {
      return {
        success: false,
        error: `Số điện thoại hoặc tên đăng nhập không đúng. Vui lòng nhập số điện thoại GV: ${TEACHER_CREDENTIALS.phone}`,
      };
    }

    const currentPass = await this.getTeacherPassword();
    if (passwordInput !== currentPass) {
      return {
        success: false,
        error: 'Mật khẩu giáo viên không chính xác. (Mặc định: Abcd@1234)',
      };
    }

    const profile: AppUserProfile = {
      uid: 'teacher-dokimanh-main',
      email: TEACHER_CREDENTIALS.email,
      displayName: TEACHER_CREDENTIALS.displayName,
      role: 'teacher',
      createdAt: new Date().toISOString(),
    };

    this.saveActiveSession(profile);
    return { success: true, profile };
  },

  async changeTeacherPassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const currentPass = await this.getTeacherPassword();
    if (oldPassword !== currentPass) {
      return { success: false, error: 'Mật khẩu hiện tại không chính xác.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
    }

    localStorage.setItem(STORAGE_KEYS.TEACHER_PASSWORD, newPassword);

    try {
      await setDoc(doc(db, 'settings', 'teacher_auth'), {
        phone: TEACHER_CREDENTIALS.phone,
        email: TEACHER_CREDENTIALS.email,
        password: newPassword,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to sync teacher password to Firestore:', e);
    }

    return { success: true };
  },

  // ===================== PARENT AUTHENTICATION =====================
  // Parent logs in with Username: Mã HS (e.g. HS61301), Default Password: 12345678
  async getParentAccount(studentCode: string): Promise<ParentAccount | null> {
    const normCode = studentCode.trim().toUpperCase();
    const localMap = getLocalParentAccounts();
    if (localMap[normCode]) {
      return localMap[normCode];
    }

    try {
      const docRef = doc(db, 'student_accounts', normCode);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as ParentAccount;
        localMap[normCode] = data;
        saveLocalParentAccounts(localMap);
        return data;
      }
    } catch (e) {
      console.warn(`Firestore getParentAccount error for ${normCode}:`, e);
    }

    return null;
  },

  async verifyParentLogin(
    studentCodeInput: string,
    passwordInput: string,
    availableStudents: Student[]
  ): Promise<{
    success: boolean;
    error?: string;
    student?: Student;
    profile?: AppUserProfile;
    isDefaultPassword?: boolean;
  }> {
    const normCode = studentCodeInput.trim().toUpperCase();
    if (!normCode) {
      return { success: false, error: 'Vui lòng nhập Mã học sinh của con.' };
    }

    const studentList = availableStudents.length > 0 ? availableStudents : sampleDemoStudents;
    const student = studentList.find(
      (s) => s.code.toUpperCase() === normCode || s.id.toUpperCase() === normCode
    );

    if (!student) {
      return {
        success: false,
        error: `Không tìm thấy học sinh với mã "${studentCodeInput}". Vui lòng kiểm tra lại mã học sinh (VD: HS61301 - HS61320).`,
      };
    }

    const account = await this.getParentAccount(student.code);
    const expectedPassword = account ? account.passwordHashOrVal : PARENT_DEFAULT_PASSWORD;

    if (passwordInput !== expectedPassword) {
      const hint = !account?.isPasswordChanged
        ? 'Mật khẩu mặc định là: 12345678'
        : 'Mật khẩu đã được thay đổi trước đó, vui lòng nhập mật khẩu mới.';
      return {
        success: false,
        error: `Mật khẩu không đúng. (${hint})`,
      };
    }

    const profile: AppUserProfile = {
      uid: `parent-${student.code.toLowerCase()}`,
      email: `phuhuynh.${student.code.toLowerCase()}@damquangtrung.edu.vn`,
      displayName: `Phụ huynh em ${student.fullName}`,
      role: 'parent',
      linkedStudentId: student.id,
      linkedStudentCode: student.code,
      linkedStudentName: student.fullName,
      createdAt: new Date().toISOString(),
    };

    this.saveActiveSession(profile);

    return {
      success: true,
      student,
      profile,
      isDefaultPassword: !account?.isPasswordChanged,
    };
  },

  async changeParentPassword(
    studentCode: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const normCode = studentCode.trim().toUpperCase();
    const account = await this.getParentAccount(normCode);
    const expectedOldPassword = account ? account.passwordHashOrVal : PARENT_DEFAULT_PASSWORD;

    if (oldPassword !== expectedOldPassword) {
      return { success: false, error: 'Mật khẩu hiện tại không chính xác.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Mật khẩu mới phải có độ dài từ 6 ký tự trở lên.' };
    }

    if (newPassword === oldPassword) {
      return { success: false, error: 'Mật khẩu mới không được trùng với mật khẩu cũ.' };
    }

    const updatedAccount: ParentAccount = {
      studentCode: normCode,
      studentId: account?.studentId || normCode,
      studentName: account?.studentName || '',
      passwordHashOrVal: newPassword,
      isPasswordChanged: true,
      lastPasswordChange: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const localMap = getLocalParentAccounts();
    localMap[normCode] = updatedAccount;
    saveLocalParentAccounts(localMap);

    try {
      await setDoc(doc(db, 'student_accounts', normCode), updatedAccount, { merge: true });
    } catch (e) {
      console.warn('Failed to sync updated parent password to Firestore:', e);
    }

    return { success: true };
  },

  async resetParentPasswordToDefault(studentCode: string): Promise<{ success: boolean; error?: string }> {
    const normCode = studentCode.trim().toUpperCase();
    const updatedAccount: ParentAccount = {
      studentCode: normCode,
      studentId: normCode,
      studentName: '',
      passwordHashOrVal: PARENT_DEFAULT_PASSWORD,
      isPasswordChanged: false,
      lastPasswordChange: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const localMap = getLocalParentAccounts();
    localMap[normCode] = updatedAccount;
    saveLocalParentAccounts(localMap);

    try {
      await setDoc(doc(db, 'student_accounts', normCode), updatedAccount, { merge: true });
    } catch (e) {
      console.warn('Failed to reset parent password in Firestore:', e);
    }

    return { success: true };
  },

  // Session persistence
  saveActiveSession(profile: AppUserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SESSION, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  },

  getActiveSession(): AppUserProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  clearActiveSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_SESSION);
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  },
};
