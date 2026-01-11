import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import ReportsPage from './app/reports/page.tsx';
import JournalPage from './app/journal/page.tsx';
import DmoSetupPage from './app/dmo/setup/page.tsx';
import VisionBoardPage from './app/vision-board/page.tsx';
import BucketlistPage from './app/bucketlist/page.tsx';
import DashboardPage from './app/dashboard/page.tsx';
import LoginPage from './app/login/page.tsx';
import SharedTopicPage from './components/SharedTopicPage.tsx';
import { MainLayout } from './components/MainLayout.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { getSupabaseClient } from './lib/supabase/client.ts';

function OAuthHandler({ children }: { children?: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handleOAuth = async () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token=') || hash.includes('type=recovery'))) {
        try {
          // Chuẩn hóa hash để URLSearchParams đọc được
          let hashContent = hash.startsWith('#') ? hash.substring(1) : hash;
          if (hashContent.startsWith('/')) hashContent = hashContent.substring(1);
          
          const params = new URLSearchParams(hashContent);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken) {
            console.log('[OAuth] Setting session from URL...');
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (!error) {
              console.log('[OAuth] Session set, cleaning URL and reloading...');
              // Xóa hash và reload để Supabase Client khởi tạo sạch sẽ
              window.history.replaceState(null, '', window.location.pathname + '#/');
              window.location.reload();
              return; // Dừng luồng xử lý vì trang sẽ reload
            }
          }
        } catch (e) {
          console.error('[OAuth] Critical error processing token');
        }
      }
      setReady(true);
    };

    handleOAuth();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#171717]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Đang xác thực bảo mật...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#171717]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Đang khởi động hệ thống...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RootRouter = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/dmo/setup" element={<DmoSetupPage />} />
        <Route path="/vision-board" element={<VisionBoardPage />} />
        <Route path="/bucketlist" element={<BucketlistPage />} />
      </Route>
      <Route path="/share/:token" element={<SharedTopicPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Router>
);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <OAuthHandler>
      <AuthProvider>
        <RootRouter />
      </AuthProvider>
    </OAuthHandler>
  </React.StrictMode>
);