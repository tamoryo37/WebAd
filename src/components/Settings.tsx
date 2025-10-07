import { useState } from 'react';
import { Users, Database, History, Lock, Bell, Radio } from 'lucide-react';
import UserManagement from './UserManagement';
import DataBackup from './DataBackup';
import OperationHistory from './OperationHistory';
import PasswordChange from './PasswordChange';
import ChatWorkNotifications from './ChatWorkNotifications';
import MediaManagement from './MediaManagement';

type SettingsView = 'users' | 'backup' | 'history' | 'password' | 'notifications' | 'media';

export default function Settings() {
  const [activeView, setActiveView] = useState<SettingsView>('users');

  const tabs = [
    { id: 'users' as SettingsView, label: 'ユーザー管理', icon: Users },
    { id: 'media' as SettingsView, label: 'メディア管理', icon: Radio },
    { id: 'backup' as SettingsView, label: 'バックアップ', icon: Database },
    { id: 'history' as SettingsView, label: '操作履歴', icon: History },
    { id: 'password' as SettingsView, label: 'パスワード変更', icon: Lock },
    { id: 'notifications' as SettingsView, label: 'ChatWork通知', icon: Bell },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div>
        {activeView === 'users' && <UserManagement />}
        {activeView === 'media' && <MediaManagement />}
        {activeView === 'backup' && <DataBackup />}
        {activeView === 'history' && <OperationHistory />}
        {activeView === 'password' && <PasswordChange />}
        {activeView === 'notifications' && <ChatWorkNotifications />}
      </div>
    </div>
  );
}
