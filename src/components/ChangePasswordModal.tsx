import React, { useState } from 'react';
import { KeyRound, X, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AccountAuthService, PARENT_DEFAULT_PASSWORD } from '../services/accountAuth';
import confetti from 'canvas-confetti';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'parent' | 'teacher';
  studentCode?: string;
  studentName?: string;
  onPasswordChanged?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userType,
  studentCode,
  studentName,
  onPasswordChanged,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    if (newPassword === oldPassword) {
      setErrorMsg('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }

    setLoading(true);
    try {
      if (userType === 'parent') {
        if (!studentCode) {
          setErrorMsg('Thiếu thông tin mã học sinh.');
          setLoading(false);
          return;
        }

        const res = await AccountAuthService.changeParentPassword(
          studentCode,
          oldPassword,
          newPassword
        );

        if (!res.success) {
          setErrorMsg(res.error || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
          setLoading(false);
          return;
        }
      } else {
        const res = await AccountAuthService.changeTeacherPassword(oldPassword, newPassword);
        if (!res.success) {
          setErrorMsg(res.error || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
          setLoading(false);
          return;
        }
      }

      setSuccessMsg('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới cho các lần đăng nhập tiếp theo.');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });

      if (onPasswordChanged) {
        onPasswordChanged();
      }

      setTimeout(() => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMsg('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-600 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Đổi Mật Khẩu Đăng Nhập</h3>
              <p className="text-xs text-sky-100">
                {userType === 'parent'
                  ? `Phụ huynh em ${studentName || studentCode} (${studentCode})`
                  : 'Giáo viên chủ nhiệm Đỗ Kim Anh'}
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {userType === 'parent' && (
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 text-sky-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-950">Mã học sinh (Tên đăng nhập):</span>
                <span className="font-mono font-black text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-200 text-xs">
                  {studentCode}
                </span>
              </div>
              <p className="text-[11px] text-sky-700">
                Mật khẩu mặc định ban đầu là: <code className="font-bold text-sky-900 bg-sky-200/60 px-1 py-0.5 rounded">{PARENT_DEFAULT_PASSWORD}</code>. Nếu chưa từng đổi, hãy điền <code className="font-bold">{PARENT_DEFAULT_PASSWORD}</code> vào ô mật khẩu hiện tại.
              </p>
            </div>
          )}

          {userType === 'teacher' && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
              <span className="font-bold text-slate-900">Tài khoản GV:</span> SĐT 0399679445 (Mặc định: Abcd@1234)
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mật khẩu hiện tại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-extrabold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
