import React from 'react';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Bell, X, Calendar, User, Shield, GraduationCap, CheckCircle2 } from 'lucide-react';

export const NotificationDetailModal: React.FC = () => {
  const { activeNotification, closeNotification } = useNotifications();

  if (!activeNotification) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const isTeacher =
    activeNotification.senderRole?.toUpperCase().includes('TEACHER') ||
    activeNotification.senderRole?.toUpperCase().includes('FACULTY');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={closeNotification}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#DDD5F2] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#FAF7F0] border-b border-[#DDD5F2]/60 px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${
                isTeacher
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-[#8FAF9A]/25 text-[#3f5a4d]'
              }`}
            >
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white border border-[#DDD5F2] text-[#527564]">
                  {activeNotification.type || 'ANNOUNCEMENT'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#687477]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#527564]" />
                  Marked as Read
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#263238] mt-1 leading-snug">
                {activeNotification.title}
              </h3>
            </div>
          </div>
          <button
            onClick={closeNotification}
            className="p-1.5 rounded-xl text-[#687477] hover:text-[#263238] hover:bg-white border border-transparent hover:border-[#DDD5F2] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender & Timestamp Metadata */}
        <div className="px-6 py-3 bg-[#FAF7F0]/50 border-b border-[#DDD5F2]/40 flex flex-wrap items-center justify-between text-xs text-[#687477] gap-3">
          <div className="flex items-center gap-2">
            {isTeacher ? (
              <GraduationCap className="w-4 h-4 text-amber-600" />
            ) : (
              <Shield className="w-4 h-4 text-[#527564]" />
            )}
            <span className="font-semibold text-[#263238]">
              {activeNotification.senderName || 'Academic Administration'}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#DDD5F2]/30 text-[#263238] font-medium">
              {isTeacher ? 'Faculty Instructor' : 'Academy Administration'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-[#687477]" />
            <span>{formatDate(activeNotification.createdAt)}</span>
          </div>
        </div>

        {/* Message Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div className="text-sm text-[#263238] leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            {activeNotification.message}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#FAF7F0] border-t border-[#DDD5F2]/60 flex items-center justify-end">
          <button
            onClick={closeNotification}
            className="px-5 py-2.5 rounded-xl bg-[#527564] hover:bg-[#3f5a4d] text-white text-xs font-semibold shadow-sm transition transform active:scale-95 cursor-pointer"
          >
            Close Announcement
          </button>
        </div>
      </div>
    </div>
  );
};
