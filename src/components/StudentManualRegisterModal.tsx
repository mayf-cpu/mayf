import React, { useState } from 'react';
import { UserProfile, registerStudentManually } from '../firebase';

interface StudentManualRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (student: UserProfile) => void;
  onToast: (msg: string) => void;
  onSwitchToGoogle?: () => void;
}

const GRADES = ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
const TARGET_EXAMS = [
  'CBSE Board Examinations',
  'ICSE Board Examinations',
  'National Math Olympiad (IMO / SOF)',
  'NTSE & Foundation Math',
  'State Board Curriculum',
];

export const StudentManualRegisterModal: React.FC<StudentManualRegisterModalProps> = ({
  isOpen,
  onClose,
  onRegistered,
  onToast,
  onSwitchToGoogle,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [grade, setGrade] = useState('Class 10');
  const [targetExam, setTargetExam] = useState(TARGET_EXAMS[0]);
  const [schoolName, setSchoolName] = useState('');
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = displayName.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanMobile = mobileNumber.replace(/\D/g, '').trim();

    if (!cleanName) {
      setErrorMessage('Please enter student full name');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (cleanMobile && countryCode === '+91' && cleanMobile.length !== 10) {
      setErrorMessage('Indian mobile number must be exactly 10 digits');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await registerStudentManually({
        displayName: cleanName,
        email: cleanEmail,
        countryCode: countryCode.trim(),
        mobileNumber: cleanMobile,
        grade,
        targetExam,
        schoolName: schoolName.trim(),
        whatsappAlerts,
        isPro: false,
      });

      // Save local demo session so student is automatically recognized in current browser session
      try {
        const studentSession = {
          uid: created.userId,
          email: created.email,
          displayName: created.displayName,
          photoURL: created.photoURL,
          emailVerified: true,
          isAnonymous: false,
        };
        localStorage.setItem('maths_dev_session', JSON.stringify(studentSession));
      } catch {}

      onToast(`🎉 Welcome aboard, ${created.displayName}! Your student profile has been created.`);
      onRegistered(created);
      onClose();
    } catch (err: any) {
      console.error('Error during manual registration:', err);
      setErrorMessage(err?.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-5 sm:p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm mb-2 border border-white/20">
            <span className="material-symbols-outlined text-[15px]">school</span>
            Free Student Registration
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Create Your Student Account
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-md">
            Register directly to access printable formula cheat sheets, revision vaults &amp; WhatsApp study alerts.
          </p>
        </div>

        {/* Modal Form Scrollable */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Student Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#111c2d] focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#111c2d] focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Grade & Target Exam */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Class / Grade:</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#111c2d] focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Target Examination:</label>
              <select
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#111c2d] focus:bg-white focus:border-blue-500 outline-none cursor-pointer"
              >
                {TARGET_EXAMS.map((exam) => (
                  <option key={exam} value={exam}>{exam}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Number & School Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Mobile / WhatsApp Number:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-16 bg-[#f0f3ff] border border-blue-100 rounded-xl px-2 py-2.5 text-xs font-bold text-center outline-none"
                  placeholder="+91"
                />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  maxLength={10}
                  className="flex-1 bg-[#f0f3ff] border border-blue-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#111c2d] focus:bg-white focus:border-blue-500 outline-none"
                  placeholder="9876543210"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">10-digit number for exam alerts</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">School / Institute Name:</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Delhi Public School"
                className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#111c2d] focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* WhatsApp Alert Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappAlerts}
              onChange={(e) => setWhatsappAlerts(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded cursor-pointer shrink-0"
            />
            <div className="text-xs">
              <span className="font-bold text-emerald-950 block">Receive instant formula sheets on WhatsApp</span>
              <span className="text-[11px] text-emerald-700">Exam date notifications, Olympiad updates &amp; revision notes</span>
            </div>
          </label>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            {onSwitchToGoogle && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToGoogle();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Or Sign in with Google</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-75"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSubmitting ? 'sync' : 'person_add'}
                </span>
                <span>{isSubmitting ? 'Registering...' : 'Register Student'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
