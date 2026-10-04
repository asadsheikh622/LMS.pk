import React, { useState, useMemo } from 'react';
import { useNotifications, NotificationItem } from '../../context/NotificationContext.tsx';
import {
  Bell,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  CheckCheck,
  Shield,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface StudentNotificationsViewProps {
  onBackToDashboard: () => void;
}

export const StudentNotificationsView: React.FC<StudentNotificationsViewProps> = ({
  onBackToDashboard,
}) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    openNotification,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'UNREAD' && item.isRead) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesMessage = item.message.toLowerCase().includes(query);
        const matchesSender = (item.senderName || '').toLowerCase().includes(query);
        return matchesTitle || matchesMessage || matchesSender;
      }
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

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

  return (
    <div className="min-h-screen bg-[#FAF7F0] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-3xl p-6 border border-[#DDD5F2] shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToDashboard}
              className="p-2.5 rounded-2xl border border-[#DDD5F2] text-[#687477] hover:text-[#263238] hover:bg-[#FAF7F0] transition cursor-pointer"
              title="Return to Student Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#527564]">
                  Official LMS Communications
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-[#263238]">
                Notifications & Broadcasts
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#687477] hover:text-[#263238] hover:bg-[#FAF7F0] transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8FAF9A]/20 hover:bg-[#8FAF9A]/30 border border-[#8FAF9A]/40 text-[#263238] text-xs font-semibold transition cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-[#527564]" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#DDD5F2] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-[#FAF7F0] p-1.5 rounded-2xl border border-[#DDD5F2]/50">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'ALL'
                  ? 'bg-white text-[#263238] shadow-sm'
                  : 'text-[#687477] hover:text-[#263238]'
              }`}
            >
              <span>All Announcements</span>
              <span className="px-2 py-0.5 rounded-full bg-[#DDD5F2]/40 text-[10px] text-[#263238]">
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('UNREAD')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'UNREAD'
                  ? 'bg-white text-[#263238] shadow-sm'
                  : 'text-[#687477] hover:text-[#263238]'
              }`}
            >
              <span>Unread Only</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#DDD5F2]/40 text-[10px] text-[#687477]">
                  0
                </span>
              )}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#687477] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements, instructors, or titles..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDD5F2] bg-[#FAF7F0]/40 text-xs text-[#263238] placeholder:text-[#687477] focus:outline-none focus:ring-2 focus:ring-[#8FAF9A]"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading && notifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#DDD5F2] text-[#687477] space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#8FAF9A]" />
              <p className="text-sm font-medium">Fetching your official broadcasts...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#DDD5F2] space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#8FAF9A]/15 text-[#527564] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#263238]">
                {activeTab === 'UNREAD' ? 'No Unread Broadcasts' : 'No Notifications Found'}
              </h3>
              <p className="text-xs text-[#687477] max-w-sm mx-auto">
                {activeTab === 'UNREAD'
                  ? "You are completely caught up! New announcements from your faculty instructors or administration will appear right here."
                  : searchQuery
                  ? "No announcements matched your search query. Try clearing the filter."
                  : "You do not have any notifications at this moment."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isTeacher =
                notif.senderRole?.toUpperCase().includes('TEACHER') ||
                notif.senderRole?.toUpperCase().includes('FACULTY');

              return (
                <div
                  key={notif.id}
                  onClick={() => openNotification(notif)}
                  className={`group bg-white rounded-3xl p-5 border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                    !notif.isRead
                      ? 'border-[#8FAF9A] bg-gradient-to-r from-emerald-50/40 via-white to-white ring-1 ring-[#8FAF9A]/30'
                      : 'border-[#DDD5F2]/70 hover:border-[#8FAF9A]/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon / Unread Indicator */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                          !notif.isRead
                            ? 'bg-[#8FAF9A] text-white shadow-sm'
                            : 'bg-[#DDD5F2]/30 text-[#687477]'
                        }`}
                      >
                        <Bell className="w-5 h-5" />
                      </div>
                      {!notif.isRead && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white ring-1 ring-red-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                              !notif.isRead
                                ? 'bg-[#527564] text-white'
                                : 'bg-[#DDD5F2]/40 text-[#687477]'
                            }`}
                          >
                            {notif.type || 'ANNOUNCEMENT'}
                          </span>

                          <div className="flex items-center gap-1.5 text-xs text-[#263238] font-semibold">
                            {isTeacher ? (
                              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Shield className="w-3.5 h-3.5 text-[#527564]" />
                            )}
                            <span>{notif.senderName || 'Academic Administration'}</span>
                            <span className="text-[11px] font-normal text-[#687477]">
                              ({isTeacher ? 'Faculty' : 'Admin'})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#687477]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(notif.createdAt)}</span>
                        </div>
                      </div>

                      <div>
                        <h4
                          className={`text-base leading-snug ${
                            !notif.isRead
                              ? 'font-bold text-[#263238]'
                              : 'font-semibold text-[#455A64]'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <p className="text-xs text-[#687477] line-clamp-2 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {/* Action Row */}
                      <div className="pt-1 flex items-center justify-between text-xs">
                        <span className="text-[#527564] font-medium group-hover:underline flex items-center gap-1">
                          Click to view full message &rarr;
                        </span>

                        {!notif.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] border border-[#DDD5F2] hover:bg-[#8FAF9A]/20 text-[11px] font-semibold text-[#527564] transition cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
