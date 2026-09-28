import React, { useState } from 'react';

interface OlympiadEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  isFree: boolean;
}

export const OlympiadEnrollModal: React.FC<OlympiadEnrollModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  isFree,
}) => {
  const [studentName, setStudentName] = useState('Arjun Sharma');
  const [studentGrade, setStudentGrade] = useState('Class 9');
  const [whatsappNumber, setWhatsappNumber] = useState('+91 98765 43210');
  const [enrolled, setEnrolled] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnrolled(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">school</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 leading-tight">{title}</h3>
              <p className="text-[11px] text-gray-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {enrolled ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">done_all</span>
            </div>
            <h4 className="font-bold text-gray-900 text-lg">Seat Reserved Successfully!</h4>
            <p className="text-xs text-gray-600">
              Pass and webinar meeting link have been dispatched to {whatsappNumber}. We can't wait to see you there!
            </p>
            <button
              onClick={onClose}
              className="mt-2 py-2 px-6 bg-blue-600 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Student Name</label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Grade / Class</label>
                <select
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500"
                >
                  <option>Class 5</option>
                  <option>Class 6</option>
                  <option>Class 7</option>
                  <option>Class 8</option>
                  <option>Class 9</option>
                  <option>Class 10 Board</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">WhatsApp for Alerts</label>
                <input
                  type="text"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl text-[11px] text-blue-900 font-medium">
              ✨ Free instant entry pass includes 3 mock Olympiad papers + AI live doubt clearing.
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#2563eb] text-white font-bold text-xs rounded-xl hover:bg-blue-700 tactile-btn-primary cursor-pointer shadow-sm"
            >
              {isFree ? 'Claim Free Entry Pass →' : 'Confirm Registration →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
