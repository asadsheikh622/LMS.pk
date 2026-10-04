import React from 'react';
import { BookOpen, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#FAF7F0] border-t border-[#DDD5F2]/60 pt-16 pb-12 text-[#687477] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Purpose */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#527564] text-white flex items-center justify-center font-bold text-sm">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-[#263238]">Academy LMS</span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-[#687477]">
              A complete, enterprise-grade Learning Management System with role-based access control, attendance tracking, verified student activation, online assessments, and relational database integrity.
            </p>
            <div className="text-[11px] text-[#687477]">
              Campus: Zaitoon Ashraf IT Park &bull; Karachi
            </div>
          </div>

          {/* Academy Portals */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-[#263238] text-[11px]">
              Portals
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('/student/login')}
                  className="hover:text-[#527564] transition cursor-pointer"
                >
                  Student Portal Sign In
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/student/activate')}
                  className="hover:text-[#527564] transition cursor-pointer"
                >
                  Student Account Activation
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/teacher/login')}
                  className="hover:text-[#527564] transition cursor-pointer"
                >
                  Faculty Portal Sign In
                </button>
              </li>
            </ul>
          </div>

          {/* Secure Administrative Access */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-[#263238] text-[11px]">
              Institutional Governance
            </h4>
            <p className="text-[11px] text-[#687477]">
              Restricted to authorized academy directors, registrars, and super administrators.
            </p>
            <button
              onClick={() => onNavigate('/admin/login')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DDD5F2] text-[#263238] font-semibold text-[11px] hover:border-[#263238] transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#527564]" />
              <span>Admin Console</span>
            </button>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-[#DDD5F2]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} Academy LMS &bull; All Rights Reserved &bull; Cloud SQL PostgreSQL Engine
          </div>
          <div className="flex items-center gap-1 text-[#687477]">
            <span>Crafted with modern React, Tailwind CSS, GSAP & Drizzle ORM</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
