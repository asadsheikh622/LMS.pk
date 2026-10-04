import React from 'react';
import {
  Shield, CheckCircle2, Award, Calendar, BookOpen, Clock,
  Smartphone, Database, Lock, Users, Laptop
} from 'lucide-react';

interface FeaturesSectionProps {
  onSelectRole: (role: 'STUDENT' | 'TEACHER' | 'ADMIN') => void;
  onActivate: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onSelectRole, onActivate }) => {
  return (
    <div className="space-y-24 py-12">
      
      {/* ABOUT SECTION */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white/95 border border-[#DDD5F2]/70 p-8 sm:p-12 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="px-3 py-1 rounded-full bg-[#EBF2ED] text-[#527564] text-xs font-bold uppercase tracking-wider">
              Academy Infrastructure
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#263238] tracking-tight">
              An Integrated Academic Ecosystem Built for Scalable Excellence
            </h2>
            <p className="text-[#687477] text-sm sm:text-base leading-relaxed">
              Academy LMS bridges institutional governance, faculty management, and student learning into a unified, secure system. From automated verified student onboarding to real-time batch attendance and gradebook auditing, every workflow adheres to enterprise standards.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 text-xs sm:text-sm font-semibold text-[#263238]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8FAF9A]" />
                <span>Cloud SQL Relational Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8FAF9A]" />
                <span>Server-Side RBAC Enforcement</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8FAF9A]" />
                <span>Verified Admissions Flow</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8FAF9A]" />
                <span>Microsecond Connection Pooling</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#FAF7F0] p-6 rounded-2xl border border-[#DDD5F2] space-y-4">
            <h3 className="font-bold text-sm text-[#263238]">Live Academic Hub</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#DDD5F2]/50 flex justify-between items-center">
                <span className="text-[#687477]">Main Campus</span>
                <span className="font-semibold text-[#263238]">Zaitoon Ashraf IT Park</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#DDD5F2]/50 flex justify-between items-center">
                <span className="text-[#687477]">Active Cohorts</span>
                <span className="font-semibold text-[#263238]">Batch 20 & Batch 21</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#DDD5F2]/50 flex justify-between items-center">
                <span className="text-[#687477]">Core Specialization</span>
                <span className="font-semibold text-[#263238]">Full-Stack Web & Cloud Systems</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#527564]">
            Functional Modules
          </span>
          <h2 className="text-3xl font-extrabold text-[#263238] tracking-tight">
            Complete LMS Capabilities
          </h2>
          <p className="text-sm text-[#687477]">
            Purpose-built components engineered for academic workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-[#DDD5F2] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF2ED] text-[#527564] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#263238]">Attendance Intelligence</h3>
            <p className="text-xs text-[#687477] leading-relaxed">
              Mark batch attendance daily with Present, Absent, Leave, and Late states. Automatically compute percentage compliance for exam eligibility.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#DDD5F2] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F4F1FB] text-[#7b69b8] flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#263238]">Assignments & Quizzes</h3>
            <p className="text-xs text-[#687477] leading-relaxed">
              Faculty publish assignments with deadlines, instructions, and max marks. Timed quizzes calculate pass/fail criteria instantaneously.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#DDD5F2] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0] text-[#527564] flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#263238]">Financial Vouchers</h3>
            <p className="text-xs text-[#687477] leading-relaxed">
              Track monthly fee vouchers, due dates, receipt numbers, and payment status securely tied to student admission records.
            </p>
          </div>
        </div>
      </section>

      {/* QUICK CREDENTIALS HELPER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-3xl bg-[#FAF7F0] border border-[#DDD5F2] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#263238] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#527564]" />
                <span>Pre-Configured Demonstration Credentials</span>
              </h3>
              <p className="text-xs text-[#687477]">
                Use these test accounts to explore each authenticated role immediately
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-[#DDD5F2] text-[#263238]">
              Cloud SQL Seed Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Student */}
            <div className="p-4 rounded-2xl bg-white border border-[#DDD5F2] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#527564]">Student Portal</span>
                <span className="text-[10px] text-[#687477]">Enrolled</span>
              </div>
              <div className="text-[11px] text-[#263238] space-y-1">
                <div>User / ID: <code className="font-mono bg-[#FAF7F0] px-1 py-0.5 rounded">STU-2026-001</code></div>
                <div>Pass: <code className="font-mono bg-[#FAF7F0] px-1 py-0.5 rounded">Academy123!</code></div>
              </div>
              <button
                onClick={() => onSelectRole('STUDENT')}
                className="w-full mt-2 py-1.5 rounded-lg bg-[#EBF2ED] text-[#527564] font-semibold text-[11px] hover:bg-[#8FAF9A]/20 transition cursor-pointer"
              >
                Launch Student Login &rarr;
              </button>
            </div>

            {/* Teacher */}
            <div className="p-4 rounded-2xl bg-white border border-[#DDD5F2] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#7b69b8]">Teacher Portal</span>
                <span className="text-[10px] text-[#687477]">Faculty</span>
              </div>
              <div className="text-[11px] text-[#263238] space-y-1">
                <div>Email: <code className="font-mono bg-[#FAF7F0] px-1 py-0.5 rounded">tariq.qasim@academy.edu</code></div>
                <div>Pass: <code className="font-mono bg-[#FAF7F0] px-1 py-0.5 rounded">Academy123!</code></div>
              </div>
              <button
                onClick={() => onSelectRole('TEACHER')}
                className="w-full mt-2 py-1.5 rounded-lg bg-[#F4F1FB] text-[#7b69b8] font-semibold text-[11px] hover:bg-[#A99AD9]/20 transition cursor-pointer"
              >
                Launch Faculty Login &rarr;
              </button>
            </div>

            {/* Admin */}
            <div className="p-4 rounded-2xl bg-white border border-[#DDD5F2] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#263238]">Super Admin</span>
                <span className="text-[10px] text-[#687477]">Director</span>
              </div>
              <div className="text-[11px] text-[#263238] space-y-1">
                <div>Email: <code className="font-mono bg-[#FAF7F0] px-1 py-0.5 rounded">superadmin@academy.edu</code></div>
                <div>Pass: <code className="font-mono bg-[#FAF7F0] px-1 py-0.5 rounded">SuperAdmin123!</code></div>
              </div>
              <button
                onClick={() => onSelectRole('ADMIN')}
                className="w-full mt-2 py-1.5 rounded-lg bg-[#263238] text-white font-semibold text-[11px] hover:bg-[#151c1f] transition cursor-pointer"
              >
                Launch Admin Console &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white border border-[#DDD5F2] p-8 text-center max-w-2xl mx-auto space-y-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#527564]">Academic Enquiries</span>
          <h2 className="text-2xl font-bold text-[#263238]">Need Help with Admission or Activation?</h2>
          <p className="text-xs text-[#687477]">
            Our Admissions and Examination Officers are available during campus hours (Monday to Friday, 09:00 AM - 05:00 PM).
          </p>
          <div className="pt-2 flex justify-center gap-6 text-xs text-[#263238] font-semibold">
            <span>Email: admissions@academy.edu</span>
            <span>&bull;</span>
            <span>Tel: +92 21 34567890</span>
          </div>
        </div>
      </section>

    </div>
  );
};
