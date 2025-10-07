import { useState, lazy, Suspense } from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';

const Dashboard = lazy(() => import('./components/Dashboard'));
const StoreManagement = lazy(() => import('./components/StoreManagement'));
const CampaignManagement = lazy(() => import('./components/CampaignManagement'));
const CampaignProgress = lazy(() => import('./components/CampaignProgress'));
const UnderDeliveryTracking = lazy(() => import('./components/UnderDeliveryTracking'));
const AdOperationsManagement = lazy(() => import('./components/AdOperationsManagement'));
const ExternalUserCampaignView = lazy(() => import('./components/ExternalUserCampaignView'));
const Settings = lazy(() => import('./components/Settings'));

type View = 'dashboard' | 'stores' | 'campaigns' | 'campaign-progress' | 'delivery' | 'ad-operations' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, userRole, loading, signOut } = useAuth();

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      try {
        await signOut();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  const getPageTitle = () => {
    if (userRole === 'external') {
      return '入稿管理';
    }

    switch (currentView) {
      case 'dashboard':
        return 'ダッシュボード';
      case 'stores':
        return '店舗管理';
      case 'campaigns':
        return '入稿管理';
      case 'campaign-progress':
        return 'キャンペーン進捗';
      case 'delivery':
        return '未消化管理';
      case 'ad-operations':
        return '広告運用管理';
      case 'settings':
        return '設定';
      default:
        return '';
    }
  };

  const LoadingSpinner = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-gray-500">読み込み中...</div>
      </div>
    </div>
  );

  if (loading || (user && !userRole)) {
    return <LoadingSpinner />;
  }

  if (userRole === 'external') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.email?.split('@')[0] || 'ユーザー'}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="ログアウト"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="h-[calc(100vh-4rem)]">
          <Suspense fallback={<LoadingSpinner />}>
            <ExternalUserCampaignView />
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        activeTab={currentView}
        onTabChange={(tab) => setCurrentView(tab as View)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className={currentView === 'campaigns' ? 'px-4' : 'px-4 sm:px-6 lg:px-8'}>
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
              </div>

              <div className="flex items-center gap-4">
                <button className="relative text-gray-500 hover:text-gray-700">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    3
                  </span>
                </button>
                <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.email?.split('@')[0] || 'ユーザー'}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="ログアウト"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="sm:hidden p-2 text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className={currentView === 'campaigns' ? 'h-[calc(100vh-4rem)]' : 'min-h-[calc(100vh-4rem)]'}>
          <Suspense fallback={<LoadingSpinner />}>
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'stores' && <StoreManagement />}
            {currentView === 'campaigns' && (
              <CampaignManagement
                selectedCampaignId={selectedCampaignId}
                onClearSelection={() => setSelectedCampaignId(null)}
              />
            )}
            {currentView === 'campaign-progress' && <CampaignProgress />}
            {currentView === 'delivery' && (
              <UnderDeliveryTracking
                onSelectCampaign={(id) => {
                  setSelectedCampaignId(id);
                  setCurrentView('campaigns');
                }}
              />
            )}
            {currentView === 'ad-operations' && (
              <AdOperationsManagement
                onSelectCampaign={(id) => {
                  setSelectedCampaignId(id);
                  setCurrentView('campaigns');
                }}
              />
            )}
            {currentView === 'settings' && <Settings />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
