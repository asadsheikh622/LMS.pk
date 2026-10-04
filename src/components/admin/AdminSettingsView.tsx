import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Settings, Shield, Key, Bell, Database, CheckCircle, Save } from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const { user } = useAuth();
  const [academyName, setAcademyName] = useState('Excellence Academy of Higher Studies');
  const [campusCity, setCampusCity] = useState('Karachi Main Campus');
  const [supportEmail, setSupportEmail] = useState('admissions@excellence.edu.pk');
  const [supportPhone, setSupportPhone] = useState('+92 21 34567890');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [allowStudentSelfActivation, setAllowStudentSelfActivation] = useState(true);
  const [autoGenerateVouchers, setAutoGenerateVouchers] = useState(true);

  const [message, setMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('System configuration saved successfully.');
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#263238] tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-[#527564]" />
            <span>Institution & System Settings</span>
          </h1>
          <p className="text-xs text-[#687477]">
            Configure campus profile, admission policies, academic year, and security parameters.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-[#EBF2ED] text-[#527564] text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Academy Profile */}
        <div className="rounded-3xl bg-white border border-[#DDD5F2] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#263238]">Campus Identity</h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-[#263238] mb-1">Institution Name</label>
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#263238] mb-1">Main Campus City</label>
                <input
                  type="text"
                  value={campusCity}
                  onChange={(e) => setCampusCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#263238] mb-1">Active Academic Term</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#263238] mb-1">Official Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#263238] mb-1">Support Phone Helpline</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DDD5F2] focus:ring-2 focus:ring-[#8FAF9A] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Portal Policies */}
        <div className="rounded-3xl bg-white border border-[#DDD5F2] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#263238]">Admissions & Portal Policies</h2>
          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2]/60 cursor-pointer">
              <input
                type="checkbox"
                checked={allowStudentSelfActivation}
                onChange={(e) => setAllowStudentSelfActivation(e.target.checked)}
                className="w-4 h-4 text-[#527564] rounded focus:ring-[#8FAF9A]"
              />
              <div>
                <span className="font-bold text-[#263238] block">Enable Student Self-Activation via /student/activate</span>
                <span className="text-[11px] text-[#687477]">Allows admitted students to verify credentials and set their initial portal password.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F0] border border-[#DDD5F2]/60 cursor-pointer">
              <input
                type="checkbox"
                checked={autoGenerateVouchers}
                onChange={(e) => setAutoGenerateVouchers(e.target.checked)}
                className="w-4 h-4 text-[#527564] rounded focus:ring-[#8FAF9A]"
              />
              <div>
                <span className="font-bold text-[#263238] block">Auto-generate Tuition Voucher on Batch Enrollment</span>
                <span className="text-[11px] text-[#687477]">Creates monthly tuition fee invoices automatically upon student course admission.</span>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Institution Settings</span>
        </button>
      </form>
    </div>
  );
};
