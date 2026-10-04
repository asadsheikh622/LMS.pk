import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { BookOpen, LogOut, ShieldCheck, GraduationCap, UserCheck, ArrowRight, Bell, CheckCheck, Clock, Shield } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenGetStarted: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenGetStarted }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, openNotification, markAllAsRead } = useNotifications();
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowBellDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F0]/90 backdrop-blur-md border-b border-[#DDD5F2]/40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8FAF9A] to-[#527564] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#263238] flex items-center gap-1.5">
              Academy<span className="text-[#527564]">LMS</span>
            </span>
            <span className="block text-[11px] font-medium tracking-wide uppercase text-[#687477]">
              Enterprise Education
            </span>
          </div>
        </button>

        {/* Public Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#263238]">
          <button
            onClick={() => onNavigate('/')}
            className={`transition-colors hover:text-[#527564] cursor-pointer ${
              currentPath === '/' ? 'text-[#527564] font-semibold' : 'text-[#263238]'
            }`}
          >
            Home
          </button>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
              setTimeout(() => {
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="transition-colors hover:text-[#527564] text-[#687477]"
          >
            About
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
              setTimeout(() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="transition-colors hover:text-[#527564] text-[#687477]"
          >
            Features
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
              setTimeout(() => {
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="transition-colors hover:text-[#527564] text-[#687477]"
          >
            Contact
          </a>
        </nav>

        {/* CTA & User Status */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Student Notification Bell */}
              {user.role === 'STUDENT' && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowBellDropdown(prev => !prev)}
                    title="Campus Notifications"
                    className="relative p-2.5 rounded-xl border border-[#DDD5F2] text-[#263238] hover:bg-white hover:border-[#8FAF9A] transition cursor-pointer"
                  >
                    <Bell className="w-5 h-5 text-[#263238]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow ring-2 ring-white animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showBellDropdown && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white shadow-2xl border border-[#DDD5F2] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#DDD5F2]/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#263238]">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>

                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 text-[11px] text-[#527564] hover:text-[#3f5a4d] font-semibold cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      {/* Dropdown Items */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-[#DDD5F2]/40">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-[#687477]">
                            No notifications received yet
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((notif) => {
                            const isTeacher =
                              notif.senderRole?.toUpperCase().includes('TEACHER') ||
                              notif.senderRole?.toUpperCase().includes('FACULTY');
                            return (
                              <button
                                key={notif.id}
                                onClick={() => {
                                  openNotification(notif);
                                  setShowBellDropdown(false);
                                }}
                                className={`w-full text-left p-3.5 hover:bg-[#FAF7F0]/60 transition flex items-start gap-3 cursor-pointer ${
                                  !notif.isRead ? 'bg-emerald-50/30' : ''
                                }`}
                              >
                                <div className="mt-0.5 relative flex-shrink-0">
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                                      !notif.isRead
                                        ? 'bg-[#8FAF9A] text-white shadow-sm'
                                        : 'bg-[#DDD5F2]/40 text-[#687477]'
                                    }`}
                                  >
                                    <Bell className="w-4 h-4" />
                                  </div>
                                  {!notif.isRead && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] font-bold text-[#527564] uppercase tracking-wider">
                                      {notif.type}
                                    </span>
                                    <span className="text-[10px] text-[#687477]">
                                      {formatDate(notif.createdAt)}
                                    </span>
                                  </div>
                                  <h5
                                    className={`text-xs truncate ${
                                      !notif.isRead
                                        ? 'font-bold text-[#263238]'
                                        : 'font-medium text-[#455A64]'
                                    }`}
                                  >
                                    {notif.title}
                                  </h5>
                                  <p className="text-[11px] text-[#687477] line-clamp-1 mt-0.5">
                                    {notif.message}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1 text-[10px] text-[#687477]">
                                    {isTeacher ? (
                                      <GraduationCap className="w-3 h-3 text-amber-600" />
                                    ) : (
                                      <Shield className="w-3 h-3 text-[#527564]" />
                                    )}
                                    <span className="truncate">{notif.senderName}</span>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Dropdown Footer */}
                      <div className="bg-[#FAF7F0] p-2.5 text-center border-t border-[#DDD5F2]/60">
                        <button
                          onClick={() => {
                            setShowBellDropdown(false);
                            onNavigate('/student/notifications');
                          }}
                          className="w-full py-1.5 rounded-xl bg-white hover:bg-[#8FAF9A]/20 border border-[#DDD5F2] text-xs font-semibold text-[#527564] transition cursor-pointer"
                        >
                          View all notifications &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dashboard Direct Link */}
              <button
                onClick={() => {
                  if (user.role === 'STUDENT') onNavigate('/student/dashboard');
                  else if (user.role === 'TEACHER') onNavigate('/teacher/dashboard');
                  else onNavigate('/admin/dashboard');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8FAF9A]/15 border border-[#8FAF9A]/30 text-[#263238] text-sm font-semibold hover:bg-[#8FAF9A]/25 transition cursor-pointer"
              >
                {user.role === 'STUDENT' && <GraduationCap className="w-4 h-4 text-[#527564]" />}
                {user.role === 'TEACHER' && <UserCheck className="w-4 h-4 text-[#527564]" />}
                {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                  <ShieldCheck className="w-4 h-4 text-[#527564]" />
                )}
                <span>Dashboard</span>
              </button>

              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-xl border border-[#DDD5F2] text-[#687477] hover:text-[#263238] hover:bg-white transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('/student/login')}
                className="hidden sm:inline-flex text-sm font-semibold text-[#263238] hover:text-[#527564] px-3 py-2 transition cursor-pointer"
              >
                Log in
              </button>
              <button
                onClick={onOpenGetStarted}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-sm font-semibold shadow-sm hover:shadow transition transform active:scale-95 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
