import React, { useState } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  GraduationCap,
  Users,
  AlertCircle,
  Sparkles,
  Phone,
  UserCheck,
  KeyRound,
  ArrowRight,
  Info,
} from 'lucide-react';
import { AppUserProfile } from '../services/firebase';
import { Student } from '../types';
import {
  AccountAuthService,
  TEACHER_CREDENTIALS,
  PARENT_DEFAULT_PASSWORD,
} from '../services/accountAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onAuthSuccess: (profile: AppUserProfile) => void;
  onOpenChangePassword?: (userType: 'teacher' | 'parent', code?: string, name?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  students,
  onAuthSuccess,
  onOpenChangePassword,
}) => {
  const [role, setRole] = useState<'teacher' | 'parent'>('parent');
  
  // Teacher credentials state
  const [teacherPhone, setTeacherPhone] = useState(TEACHER_CREDENTIALS.phone);
  const [teacherPass, setTeacherPass] = useState(TEACHER_CREDENTIALS.defaultPassword);

  // Parent credentials state
  const [studentCodeInput, setStudentCodeInput] = useState(
    students.length > 0 ? students[0].code : 'HS61301'
  );
  const [parentPass, setParentPass] = useState(PARENT_DEFAULT_PASSWORD);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  // Handle Teacher Form Login
  const handleTeacherLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessNotice('');

    try {
      const res = await AccountAuthService.verifyTeacherLogin(teacherPhone, teacherPass);
      if (res.success && res.profile) {
        onAuthSuccess(res.profile);
        onClose();
      } else {
        setErrorMsg(res.error || 'Đăng nhập không thành công.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi hệ thống khi đăng nhập giáo viên.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Parent Form Login
  const handleParentLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessNotice('');

    try {
      const res = await AccountAuthService.verifyParentLogin(
        studentCodeInput,
        parentPass,
        students
      );

      if (res.success && res.profile) {
        onAuthSuccess(res.profile);
        onClose();
      } else {
        setErrorMsg(res.error || 'Đăng nhập không thành công.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi hệ thống khi đăng nhập phụ huynh.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click login helpers for demonstration
  const handleQuickTeacher = () => {
    setRole('teacher');
    setTeacherPhone(TEACHER_CREDENTIALS.phone);
    setTeacherPass(TEACHER_CREDENTIALS.defaultPassword);
    setTimeout(() => {
      AccountAuthService.verifyTeacherLogin(
        TEACHER_CREDENTIALS.phone,
        TEACHER_CREDENTIALS.defaultPassword
      ).then((res) => {
        if (res.success && res.profile) {
          onAuthSuccess(res.profile);
          onClose();
        }
      });
    }, 50);
  };

  const handleQuickParent = (code: string) => {
    setRole('parent');
    setStudentCodeInput(code);
    setParentPass(PARENT_DEFAULT_PASSWORD);
    setTimeout(() => {
      AccountAuthService.verifyParentLogin(code, PARENT_DEFAULT_PASSWORD, students).then((res) => {
        if (res.success && res.profile) {
          onAuthSuccess(res.profile);
          onClose();
        }
      });
    }, 50);
  };

  const selectedStudentObj = students.find(
    (s) => s.code.toUpperCase() === studentCodeInput.toUpperCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-sky-600 via-teal-600 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                Đăng Nhập Hệ Thống
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                  Lớp 6/13
                </span>
              </h3>
              <p className="text-xs text-sky-100">Cổng Giáo viên chủ nhiệm & Phụ huynh học sinh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <UserCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setRole('parent');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                role === 'parent'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Phụ huynh học sinh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('teacher');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                role === 'teacher'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Giáo viên chủ nhiệm</span>
            </button>
          </div>

          {/* Account credentials guideline notice */}
          {role === 'parent' ? (
            <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 text-teal-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-teal-800">
                <Info className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Quy định tài khoản Phụ huynh:</span>
              </div>
              <ul className="text-[11px] text-teal-700 list-disc list-inside space-y-0.5">
                <li>
                  <strong>Tên đăng nhập:</strong> Mã học sinh của con (VD: <code className="bg-teal-100 px-1 py-0.5 rounded font-mono font-bold">HS61301</code> đến <code className="bg-teal-100 px-1 py-0.5 rounded font-mono font-bold">HS61320</code>).
                </li>
                <li>
                  <strong>Mật khẩu mặc định:</strong> <code className="bg-teal-100 px-1 py-0.5 rounded font-mono font-bold">{PARENT_DEFAULT_PASSWORD}</code>.
                </li>
                <li>Sau khi đăng nhập, Phụ huynh có thể bấm nút <strong>Đổi mật khẩu</strong> để nâng cao bảo mật.</li>
              </ul>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200 text-sky-900 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sky-800">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Quy định tài khoản Giáo viên chủ nhiệm:</span>
              </div>
              <ul className="text-[11px] text-sky-700 list-disc list-inside space-y-0.5">
                <li>
                  <strong>Tài khoản đăng nhập GV:</strong> Số điện thoại <code className="bg-sky-100 px-1 py-0.5 rounded font-mono font-bold">{TEACHER_CREDENTIALS.phone}</code>.
                </li>
                <li>
                  <strong>Mật khẩu giáo viên:</strong> <code className="bg-sky-100 px-1 py-0.5 rounded font-mono font-bold">{TEACHER_CREDENTIALS.defaultPassword}</code>.
                </li>
              </ul>
            </div>
          )}

          {/* Forms */}
          {role === 'parent' ? (
            <form onSubmit={handleParentLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tên đăng nhập (Mã Học Sinh của con) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={studentCodeInput}
                    onChange={(e) => setStudentCodeInput(e.target.value.toUpperCase())}
                    placeholder="VD: HS61301"
                    className="w-full pl-3.5 pr-28 py-2.5 rounded-xl border border-slate-200 bg-white uppercase font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {students.length > 0 && (
                    <div className="absolute right-1 top-1 bottom-1 flex items-center">
                      <select
                        value={studentCodeInput}
                        onChange={(e) => setStudentCodeInput(e.target.value)}
                        className="h-full px-2 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                      >
                        <option value="">Chọn nhanh mã</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.code}>
                            {s.code} - {s.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {selectedStudentObj && (
                  <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                    Học sinh: <strong>{selectedStudentObj.fullName}</strong> ({selectedStudentObj.group})
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">
                    Mật khẩu <span className="text-slate-400 font-normal">(Mặc định: 12345678)</span>
                  </label>
                  {onOpenChangePassword && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenChangePassword('parent', studentCodeInput, selectedStudentObj?.fullName);
                      }}
                      className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Đổi mật khẩu?</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={parentPass}
                    onChange={(e) => setParentPass(e.target.value)}
                    placeholder="Nhập 12345678 hoặc mật khẩu mới"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập Cổng Phụ Huynh'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleTeacherLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Số điện thoại Giáo viên chủ nhiệm <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={teacherPhone}
                    onChange={(e) => setTeacherPhone(e.target.value)}
                    placeholder="0399679445"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Số điện thoại đăng nhập mặc định: <strong>0399679445</strong> (Cô Đỗ Kim Anh)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">
                    Mật khẩu Giáo viên <span className="text-slate-400 font-normal">(Mặc định: Abcd@1234)</span>
                  </label>
                  {onOpenChangePassword && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenChangePassword('teacher');
                      }}
                      className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Đổi mật khẩu?</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={teacherPass}
                    onChange={(e) => setTeacherPass(e.target.value)}
                    placeholder="Nhập Abcd@1234"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập Cổng Giáo Viên'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 1-Click Quick Testing Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                Thử nghiệm nhanh (1 chạm):
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickTeacher}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition text-left flex items-center justify-between"
              >
                <span>GVCN: 0399679445</span>
                <span className="text-[10px] text-sky-600 bg-sky-200/60 px-1.5 py-0.5 rounded">Cô Kim Anh</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickParent(studentCodeInput || 'HS61301')}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition text-left flex items-center justify-between"
              >
                <span>Phụ huynh: {studentCodeInput || 'HS61301'}</span>
                <span className="text-[10px] text-teal-600 bg-teal-200/60 px-1.5 py-0.5 rounded">MK: 12345678</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
