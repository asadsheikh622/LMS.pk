import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Hero } from './components/landing/Hero.tsx';
import { RoleCards } from './components/landing/RoleCards.tsx';
import { FeaturesSection } from './components/landing/FeaturesSection.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { StudentLoginForm } from './components/auth/StudentLoginForm.tsx';
import { StudentActivationModal } from './components/auth/StudentActivationModal.tsx';
import { TeacherLoginForm } from './components/auth/TeacherLoginForm.tsx';
import { AdminLoginForm } from './components/auth/AdminLoginForm.tsx';
import { StudentDashboardView } from './components/student/StudentDashboardView.tsx';
import { StudentNotificationsView } from './components/student/StudentNotificationsView.tsx';
import { NotificationDetailModal } from './components/student/NotificationDetailModal.tsx';
import { TeacherDashboardView } from './components/teacher/TeacherDashboardView.tsx';
import { AdminDashboardView } from './components/admin/AdminDashboardView.tsx';
import { AdminLayout } from './components/admin/AdminLayout.tsx';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/');

  // If user is already logged in and navigates to root or login, give option to view dashboard
  useEffect(() => {
    // Sync browser back/forward buttons
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route Guard: Access Denied Component
  const renderAccessDenied = (requiredRole: string) => (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full rounded-3xl bg-white border border-red-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-[#263238]">Access Prohibited</h2>
        <p className="text-sm text-[#687477]">
          This portal requires <strong>{requiredRole}</strong> authorization. Your current verified role is <strong>{user?.role || 'GUEST'}</strong>.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          {user && (
            <button
              onClick={() => {
                if (user.role === 'STUDENT') navigateTo('/student/dashboard');
                else if (user.role === 'TEACHER') navigateTo('/teacher/dashboard');
                else navigateTo('/admin/dashboard');
              }}
              className="py-3 px-4 rounded-xl bg-[#527564] text-white text-xs font-semibold"
            >
              Go to Your Designated Dashboard
            </button>
          )}
          <button
            onClick={() => navigateTo('/')}
            className="py-2.5 px-4 rounded-xl border border-[#DDD5F2] text-xs font-semibold text-[#687477] hover:bg-[#FAF7F0]"
          >
            Return to Academy Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#263238] font-sans antialiased selection:bg-[#DDD5F2] selection:text-[#263238]">
      {/* Top Navigation */}
      <Navbar
        currentPath={currentPath}
        onNavigate={navigateTo}
        onOpenGetStarted={() => {
          if (currentPath !== '/') {
            navigateTo('/');
          }
          setTimeout(() => {
            document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {/* LANDING PAGE (/) */}
        {currentPath === '/' && (
          <div>
            <Hero
              onExploreRoleCards={() => {
                document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onActivateAccount={() => navigateTo('/student/activate')}
            />
            
            <RoleCards
              onStudentLogin={() => navigateTo('/student/login')}
              onStudentActivate={() => navigateTo('/student/activate')}
              onTeacherLogin={() => navigateTo('/teacher/login')}
            />

            <FeaturesSection
              onSelectRole={(role) => {
                if (role === 'STUDENT') navigateTo('/student/login');
                else if (role === 'TEACHER') navigateTo('/teacher/login');
                else navigateTo('/admin/login');
              }}
              onActivate={() => navigateTo('/student/activate')}
            />
          </div>
        )}

        {/* STUDENT LOGIN (/student/login) */}
        {currentPath === '/student/login' && (
          <StudentLoginForm
            onSuccess={() => navigateTo('/student/dashboard')}
            onGoToActivate={() => navigateTo('/student/activate')}
            onBackToHome={() => navigateTo('/')}
          />
        )}

        {/* STUDENT ACCOUNT ACTIVATION (/student/activate) */}
        {currentPath === '/student/activate' && (
          <StudentActivationModal
            onSuccess={() => navigateTo('/student/dashboard')}
            onBackToLogin={() => navigateTo('/student/login')}
          />
        )}

        {/* TEACHER LOGIN (/teacher/login) */}
        {currentPath === '/teacher/login' && (
          <TeacherLoginForm
            onSuccess={() => navigateTo('/teacher/dashboard')}
            onBackToHome={() => navigateTo('/')}
          />
        )}

        {/* ADMIN LOGIN (/admin/login) */}
        {currentPath === '/admin/login' && (
          <AdminLoginForm
            onSuccess={() => navigateTo('/admin/dashboard')}
            onBackToHome={() => navigateTo('/')}
          />
        )}

        {/* STUDENT DASHBOARD (/student/dashboard) */}
        {currentPath === '/student/dashboard' && (
          <>
            {!user ? (
              <StudentLoginForm
                onSuccess={() => navigateTo('/student/dashboard')}
                onGoToActivate={() => navigateTo('/student/activate')}
                onBackToHome={() => navigateTo('/')}
              />
            ) : user.role === 'STUDENT' ? (
              <StudentDashboardView
                onLogout={() => {
                  logout();
                  navigateTo('/');
                }}
              />
            ) : (
              renderAccessDenied('STUDENT')
            )}
          </>
        )}

        {/* STUDENT NOTIFICATIONS (/student/notifications) */}
        {currentPath === '/student/notifications' && (
          <>
            {!user ? (
              <StudentLoginForm
                onSuccess={() => navigateTo('/student/notifications')}
                onGoToActivate={() => navigateTo('/student/activate')}
                onBackToHome={() => navigateTo('/')}
              />
            ) : user.role === 'STUDENT' ? (
              <StudentNotificationsView
                onBackToDashboard={() => navigateTo('/student/dashboard')}
              />
            ) : (
              renderAccessDenied('STUDENT')
            )}
          </>
        )}

        {/* TEACHER DASHBOARD (/teacher/dashboard) */}
        {currentPath === '/teacher/dashboard' && (
          <>
            {!user ? (
              <TeacherLoginForm
                onSuccess={() => navigateTo('/teacher/dashboard')}
                onBackToHome={() => navigateTo('/')}
              />
            ) : user.role === 'TEACHER' ? (
              <TeacherDashboardView
                onLogout={() => {
                  logout();
                  navigateTo('/');
                }}
              />
            ) : (
              renderAccessDenied('TEACHER')
            )}
          </>
        )}

        {/* ADMIN PORTAL (/admin/dashboard, /admin/students, /admin/*) */}
        {currentPath.startsWith('/admin') && currentPath !== '/admin/login' && (
          <>
            {!user ? (
              <AdminLoginForm
                onSuccess={() => navigateTo(currentPath)}
                onBackToHome={() => navigateTo('/')}
              />
            ) : user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? (
              <AdminLayout
                onLogout={() => {
                  logout();
                  navigateTo('/');
                }}
                initialTab={
                  currentPath === '/admin/students'
                    ? 'students'
                    : currentPath.split('/')[2] || 'dashboard'
                }
              />
            ) : (
              renderAccessDenied('ADMINISTRATOR')
            )}
          </>
        )}
      </main>

      {/* Global Footer (only for public marketing & login views) */}
      {!currentPath.startsWith('/admin') &&
        !currentPath.startsWith('/teacher/dashboard') &&
        !currentPath.startsWith('/student/dashboard') &&
        !currentPath.startsWith('/student/notifications') && (
          <Footer onNavigate={navigateTo} />
        )}

      {/* Global Notification Detail Modal */}
      <NotificationDetailModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
