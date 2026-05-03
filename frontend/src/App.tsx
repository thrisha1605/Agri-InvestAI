import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AIChat } from '@/components/AIChat';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { authService } from '@/lib/auth';
import { bootstrapSessionData } from '@/lib/sessionBootstrap';
import { About } from '@/pages/About';
import { FAQ } from '@/pages/FAQ';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { NotificationPreferences } from '@/pages/NotificationPreferences';
import { Notifications } from '@/pages/Notifications';
import { ProjectDetail } from '@/pages/ProjectDetail';
import { Projects } from '@/pages/Projects';
import { Register } from '@/pages/Register';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { AdminPartnerRequests } from '@/pages/admin/AdminPartnerRequests';
import { AdminProfile } from '@/pages/admin/AdminProfile';
import { AdminProjects } from '@/pages/admin/AdminProjects';
import { AdminWithdrawalRequests } from '@/pages/admin/AdminWithdrawalRequests';
import { CompletionVerification } from '@/pages/admin/CompletionVerification';
import { ProjectMilestoneTimeline } from '@/pages/common/ProjectMilestoneTimeline';
import { AITools } from '@/pages/farmer/AITools';
import { CreateProject } from '@/pages/farmer/CreateProject';
import CropAnalysis from '@/pages/farmer/CropAnalysis';
import { DiseaseAnalysis } from '@/pages/farmer/DiseaseAnalysis';
import { FarmerDashboard } from '@/pages/farmer/FarmerDashboard';
import { FarmerProfile } from '@/pages/farmer/FarmerProfile';
import { FarmerProjects } from '@/pages/farmer/FarmerProjects';
import { FarmerWallet } from '@/pages/farmer/FarmerWallet';
import { ProjectTracking } from '@/pages/farmer/ProjectTracking';
import { SoilPHGuide } from '@/pages/farmer/SoilPHGuide';
import { InvestorDashboard } from '@/pages/investor/InvestorDashboard';
import { InvestorMyProjects } from '@/pages/investor/InvestorMyProjects';
import { InvestorPayments } from '@/pages/investor/InvestorPayments';
import { InvestorPortfolio } from '@/pages/investor/InvestorPortfolio';
import { InvestorProfile } from '@/pages/investor/InvestorProfile';
import { InvestorReturns } from '@/pages/investor/InvestorReturns';
import { Wallet } from '@/pages/investor/Wallet';
import { AssignedWork } from '@/pages/partner/AssignedWork';
import { AvailableProjects } from '@/pages/partner/AvailableProjects';
import { PartnerDashboard } from '@/pages/partner/PartnerDashboard';
import { PartnerProfile } from '@/pages/partner/PartnerProfile';
import { PartnerWallet } from '@/pages/partner/PartnerWallet';

const AI_CHAT_HIDDEN_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/farmer/dashboard',
  '/investor/dashboard',
  '/partner/dashboard',
]);

function shouldShowAIChat(pathname: string) {
  const normalizedPath = pathname || '/';

  if (normalizedPath.startsWith('/admin')) {
    return false;
  }

  return !AI_CHAT_HIDDEN_PATHS.has(normalizedPath);
}

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const user = authService.getCurrentUser();

  if (!authService.isAuthenticated() || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppShell() {
  const location = useLocation();
  const showAIChat = shouldShowAIChat(location.pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />

          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/partner-requests"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPartnerRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/withdrawal-requests"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminWithdrawalRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/completion-requests"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CompletionVerification />
              </ProtectedRoute>
            }
          />

          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/create-project"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <CreateProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/projects"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/projects/:id/progress"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <ProjectTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/profile"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/wallet"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <FarmerWallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/soil-ph"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <SoilPHGuide />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/ai-tools"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <AITools />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/crop-analysis"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <CropAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/disease-analysis"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <DiseaseAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/project/:projectId"
            element={
              <ProtectedRoute allowedRoles={['FARMER']}>
                <ProjectTracking />
              </ProtectedRoute>
            }
          />

          <Route
            path="/project/milestones/:id"
            element={
              <ProtectedRoute>
                <ProjectMilestoneTimeline />
              </ProtectedRoute>
            }
          />

          <Route
            path="/investor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['INVESTOR']}>
                <InvestorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investor/portfolio"
            element={
              <ProtectedRoute allowedRoles={['INVESTOR']}>
                <InvestorPortfolio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investor/profile"
            element={
              <ProtectedRoute allowedRoles={['INVESTOR']}>
                <InvestorProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investor/my-projects"
            element={
              <ProtectedRoute allowedRoles={['INVESTOR']}>
                <InvestorMyProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investor/payments"
            element={
              <ProtectedRoute allowedRoles={['INVESTOR']}>
                <InvestorPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investor/returns"
            element={
              <ProtectedRoute allowedRoles={['INVESTOR']}>
                <InvestorReturns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investor/wallet"
            element={
              <ProtectedRoute allowedRoles={['INVESTOR']}>
                <Wallet />
              </ProtectedRoute>
            }
          />

          <Route
            path="/partner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['AGRI_PARTNER']}>
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/available-projects"
            element={
              <ProtectedRoute allowedRoles={['AGRI_PARTNER']}>
                <AvailableProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/assigned-work"
            element={
              <ProtectedRoute allowedRoles={['AGRI_PARTNER']}>
                <AssignedWork />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/profile"
            element={
              <ProtectedRoute allowedRoles={['AGRI_PARTNER']}>
                <PartnerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/wallet"
            element={
              <ProtectedRoute allowedRoles={['AGRI_PARTNER']}>
                <PartnerWallet />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications/preferences"
            element={
              <ProtectedRoute>
                <NotificationPreferences />
              </ProtectedRoute>
            }
          />

          <Route path="/investor" element={<Navigate to="/investor/dashboard" replace />} />
          <Route path="/farmer" element={<Navigate to="/farmer/dashboard" replace />} />
          <Route path="/partner" element={<Navigate to="/partner/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="*"
            element={
              <div className="flex min-h-screen items-center justify-center">
                <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />
      {showAIChat ? <AIChat /> : null}
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  const shouldBootstrap = authService.isAuthenticated() && Boolean(authService.getCurrentUser());
  const [bootstrapping, setBootstrapping] = useState(shouldBootstrap);

  useEffect(() => {
    if (!shouldBootstrap) {
      setBootstrapping(false);
      return;
    }

    let mounted = true;
    const loaderDeadline = window.setTimeout(() => {
      if (mounted) {
        setBootstrapping(false);
      }
    }, 2500);

    void bootstrapSessionData().finally(() => {
      window.clearTimeout(loaderDeadline);
      if (mounted) {
        setBootstrapping(false);
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(loaderDeadline);
    };
  }, [shouldBootstrap]);

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">Loading your AgriInvest workspace</p>
          <p className="mt-2 text-sm text-slate-500">Syncing projects, wallet, and profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <NotificationProvider>
        <AppShell />
      </NotificationProvider>
    </HashRouter>
  );
}

export default App;
