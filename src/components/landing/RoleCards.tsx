import React from 'react';
import { GraduationCap, UserCheck, ArrowRight, KeyRound, Sparkles, Check } from 'lucide-react';

interface RoleCardsProps {
  onStudentLogin: () => void;
  onStudentActivate: () => void;
  onTeacherLogin: () => void;
}

export const RoleCards: React.FC<RoleCardsProps> = ({
  onStudentLogin,
  onStudentActivate,
  onTeacherLogin,
}) => {
  return (
    <section id="roles" className="py-16 bg-gradient-to-b from-transparent to-[#F4EFE6]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2ED] text-[#527564] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Your Academy Portal</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#263238] tracking-tight">
            Designed for Learners and Educators
          </h2>
          <p className="text-base text-[#687477]">
            Sign in to your designated academic workspace to access assignments, real-time attendance, and course materials.
          </p>
        </div>

        {/* 2 Public Cards ONLY: Student & Teacher (Admin strictly excluded) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* STUDENT CARD */}
          <div className="relative rounded-3xl bg-white/95 border border-[#DDD5F2]/60 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-6">
              {/* Badge & Icon */}
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-[#EBF2ED] text-[#527564] flex items-center justify-center transition-transform group-hover:scale-105">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#EBF2ED] text-[#527564] text-xs font-bold uppercase tracking-wider">
                  Enrolled Portal
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#263238] tracking-tight">
                  Student
                </h3>
                <p className="text-base text-[#687477] leading-relaxed">
                  Access courses, track your progress and learn at your own pace.
                </p>
              </div>

              {/* Feature Highlights */}
              <ul className="space-y-2.5 pt-2 text-sm text-[#263238]">
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#8FAF9A]/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#527564]" />
                  </div>
                  <span>Real-time Course Progress & Gradebook</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#8FAF9A]/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#527564]" />
                  </div>
                  <span>Online Assignment Submissions & Quizzes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#8FAF9A]/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#527564]" />
                  </div>
                  <span>Attendance Records & Fee Vouchers</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-8 space-y-3">
              <button
                onClick={onStudentLogin}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white font-semibold text-sm shadow-sm transition transform active:scale-98 cursor-pointer"
              >
                <span>Login as Student</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onStudentActivate}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#FAF7F0] hover:bg-[#F4EFE6] border border-[#DDD5F2] text-[#527564] font-semibold text-sm transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-[#8FAF9A]" />
                <span>Activate Student Account</span>
              </button>
            </div>
          </div>

          {/* TEACHER CARD */}
          <div className="relative rounded-3xl bg-white/95 border border-[#DDD5F2]/60 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-6">
              {/* Badge & Icon */}
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-[#F4F1FB] text-[#A99AD9] flex items-center justify-center transition-transform group-hover:scale-105">
                  <UserCheck className="w-7 h-7 text-[#7b69b8]" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#F4F1FB] text-[#7b69b8] text-xs font-bold uppercase tracking-wider">
                  Faculty Portal
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#263238] tracking-tight">
                  Teacher
                </h3>
                <p className="text-base text-[#687477] leading-relaxed">
                  Manage classes, students, attendance, assignments and course progress.
                </p>
              </div>

              {/* Feature Highlights */}
              <ul className="space-y-2.5 pt-2 text-sm text-[#263238]">
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#A99AD9]/25 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#7b69b8]" />
                  </div>
                  <span>Mark & Audit Daily Batch Attendance</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#A99AD9]/25 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#7b69b8]" />
                  </div>
                  <span>Create Quizzes with Timers & Passing Marks</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#A99AD9]/25 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#7b69b8]" />
                  </div>
                  <span>Grade Student Submissions & Provide Feedback</span>
                </li>
              </ul>
            </div>

            {/* Actions (NO "Register as Teacher", per strict mandate) */}
            <div className="pt-8 space-y-3">
              <button
                onClick={onTeacherLogin}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#263238] hover:bg-[#1a2327] text-white font-semibold text-sm shadow-sm transition transform active:scale-98 cursor-pointer"
              >
                <span>Login as Teacher</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center py-2 text-xs text-[#687477]">
                Teacher accounts are provisioned exclusively by Academic Administration.
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
