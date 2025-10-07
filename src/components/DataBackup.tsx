import { useState, useEffect } from 'react';
import { supabase, DataBackup as DataBackupType, BackupSettings, DummyDataSet } from '../lib/supabase';
import { Download, Upload, Database, AlertCircle, CheckCircle, Settings, FileText } from 'lucide-react';

export default function DataBackup() {
  const [backups, setBackups] = useState<DataBackupType[]>([]);
  const [dummyDataSets, setDummyDataSets] = useState<DummyDataSet[]>([]);
  const [backupSettings, setBackupSettings] = useState<BackupSettings | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchBackups();
    fetchDummyDataSets();
    fetchBackupSettings();
  }, []);

  const fetchBackups = async () => {
    const { data, error } = await supabase
      .from('data_backups')
      .select('*')
      .order('backup_date', { ascending: false });

    if (error) {
      console.error('Error fetching backups:', error);
      return;
    }
    setBackups(data || []);
  };

  const fetchDummyDataSets = async () => {
    const { data, error } = await supabase
      .from('dummy_data_sets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dummy data sets:', error);
      return;
    }
    setDummyDataSets(data || []);
  };

  const fetchBackupSettings = async () => {
    const { data, error } = await supabase
      .from('backup_settings')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching backup settings:', error);
      return;
    }
    setBackupSettings(data);
  };

  const saveBackupSettings = async () => {
    if (!backupSettings) return;

    const { error } = await supabase
      .from('backup_settings')
      .update({
        auto_backup_enabled: backupSettings.auto_backup_enabled,
        backup_frequency: backupSettings.backup_frequency,
        backup_time: backupSettings.backup_time,
        retention_days: backupSettings.retention_days,
        updated_at: new Date().toISOString()
      })
      .eq('id', backupSettings.id);

    if (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: '設定の保存に失敗しました' });
      return;
    }

    setMessage({ type: 'success', text: '設定を保存しました' });
    setShowSettings(false);
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    setMessage(null);

    try {
      const [storesRes, campaignsRes, progressRes, budgetRes, alertsRes, dashboardRes] = await Promise.all([
        supabase.from('stores').select('*'),
        supabase.from('campaigns').select('*'),
        supabase.from('campaign_progress').select('*'),
        supabase.from('budget_tracking').select('*'),
        supabase.from('campaign_alerts').select('*'),
        supabase.from('monthly_dashboard').select('*')
      ]);

      const backupData = {
        stores: storesRes.data || [],
        campaigns: campaignsRes.data || [],
        campaign_progress: progressRes.data || [],
        budget_tracking: budgetRes.data || [],
        campaign_alerts: alertsRes.data || [],
        monthly_dashboard: dashboardRes.data || []
      };

      const tableCounts = {
        stores: storesRes.data?.length || 0,
        campaigns: campaignsRes.data?.length || 0,
        campaign_progress: progressRes.data?.length || 0,
        budget_tracking: budgetRes.data?.length || 0,
        campaign_alerts: alertsRes.data?.length || 0,
        monthly_dashboard: dashboardRes.data?.length || 0
      };

      const backupName = `バックアップ_${new Date().toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/[\/:\s]/g, '_')}`;

      const { error } = await supabase
        .from('data_backups')
        .insert([{
          backup_name: backupName,
          backup_data: backupData,
          table_counts: tableCounts
        }]);

      if (error) throw error;

      await supabase.from('operation_history').insert([{
        operation_type: 'backup',
        table_name: 'all_tables',
        operation_data: { table_counts: tableCounts }
      }]);

      setMessage({ type: 'success', text: 'バックアップを作成しました' });
      fetchBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      setMessage({ type: 'error', text: 'バックアップの作成に失敗しました' });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = (backup: DataBackupType) => {
    const dataStr = JSON.stringify(backup.backup_data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${backup.backup_name}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restoreBackup = async (backup: DataBackupType) => {
    if (!confirm(`「${backup.backup_name}」からデータを復元しますか？\n現在のデータは上書きされます。`)) {
      return;
    }

    setIsRestoring(true);
    setMessage(null);

    try {
      const data = backup.backup_data;

      if (data.stores?.length) {
        await supabase.from('stores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('stores').insert(data.stores);
      }

      if (data.campaigns?.length) {
        await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('campaigns').insert(data.campaigns);
      }

      if (data.campaign_progress?.length) {
        await supabase.from('campaign_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('campaign_progress').insert(data.campaign_progress);
      }

      if (data.budget_tracking?.length) {
        await supabase.from('budget_tracking').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('budget_tracking').insert(data.budget_tracking);
      }

      if (data.campaign_alerts?.length) {
        await supabase.from('campaign_alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('campaign_alerts').insert(data.campaign_alerts);
      }

      if (data.monthly_dashboard?.length) {
        await supabase.from('monthly_dashboard').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('monthly_dashboard').insert(data.monthly_dashboard);
      }

      await supabase.from('operation_history').insert([{
        operation_type: 'restore',
        table_name: 'all_tables',
        operation_data: { backup_id: backup.id, backup_name: backup.backup_name }
      }]);

      setMessage({ type: 'success', text: 'データを復元しました。ページを再読み込みしてください。' });
    } catch (error) {
      console.error('Error restoring backup:', error);
      setMessage({ type: 'error', text: 'データの復元に失敗しました' });
    } finally {
      setIsRestoring(false);
    }
  };

  const uploadBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage(null);

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const tableCounts = {
        stores: backupData.stores?.length || 0,
        campaigns: backupData.campaigns?.length || 0,
        campaign_progress: backupData.campaign_progress?.length || 0,
        budget_tracking: backupData.budget_tracking?.length || 0,
        campaign_alerts: backupData.campaign_alerts?.length || 0,
        monthly_dashboard: backupData.monthly_dashboard?.length || 0
      };

      const backupName = `アップロード_${file.name.replace('.json', '')}`;

      const { error } = await supabase
        .from('data_backups')
        .insert([{
          backup_name: backupName,
          backup_data: backupData,
          table_counts: tableCounts
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'バックアップファイルをアップロードしました' });
      fetchBackups();
    } catch (error) {
      console.error('Error uploading backup:', error);
      setMessage({ type: 'error', text: 'バックアップファイルの読み込みに失敗しました' });
    }

    event.target.value = '';
  };

  const restoreDummyData = async (dummySet: DummyDataSet) => {
    if (!confirm(`「${dummySet.set_name}」のダミーデータを復元しますか？\n現在のデータは上書きされます。`)) {
      return;
    }

    setIsRestoring(true);
    setMessage(null);

    try {
      const data = dummySet.data_content;

      if (data.stores?.length) {
        await supabase.from('stores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('stores').insert(data.stores);
      }

      if (data.campaigns?.length) {
        await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('campaigns').insert(data.campaigns);
      }

      await supabase.from('operation_history').insert([{
        operation_type: 'restore',
        table_name: 'all_tables',
        operation_data: { dummy_set_id: dummySet.id, dummy_set_name: dummySet.set_name }
      }]);

      setMessage({ type: 'success', text: 'ダミーデータを復元しました。ページを再読み込みしてください。' });
    } catch (error) {
      console.error('Error restoring dummy data:', error);
      setMessage({ type: 'error', text: 'ダミーデータの復元に失敗しました' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">データバックアップ</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings size={18} />
            自動バックアップ設定
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload size={18} />
            バックアップをアップロード
            <input
              type="file"
              accept=".json"
              onChange={uploadBackup}
              className="hidden"
            />
          </label>
          <button
            onClick={createBackup}
            disabled={isCreatingBackup}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <Database size={18} />
            {isCreatingBackup ? '作成中...' : '新規バックアップ作成'}
          </button>
        </div>
      </div>

      {showSettings && backupSettings && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">自動バックアップ設定</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={backupSettings.auto_backup_enabled}
                onChange={(e) => setBackupSettings({ ...backupSettings, auto_backup_enabled: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className="text-sm font-medium text-gray-700">自動バックアップを有効にする</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">バックアップ頻度</label>
                <select
                  value={backupSettings.backup_frequency}
                  onChange={(e) => setBackupSettings({ ...backupSettings, backup_frequency: e.target.value })}
                  disabled={!backupSettings.auto_backup_enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                >
                  <option value="daily">毎日</option>
                  <option value="weekly">毎週</option>
                  <option value="monthly">毎月</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">実行時刻</label>
                <input
                  type="time"
                  value={backupSettings.backup_time}
                  onChange={(e) => setBackupSettings({ ...backupSettings, backup_time: e.target.value })}
                  disabled={!backupSettings.auto_backup_enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">保持期間（日）</label>
                <input
                  type="number"
                  value={backupSettings.retention_days}
                  onChange={(e) => setBackupSettings({ ...backupSettings, retention_days: Number(e.target.value) })}
                  disabled={!backupSettings.auto_backup_enabled}
                  min="1"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>
            </div>

            {backupSettings.last_backup_date && (
              <div className="text-sm text-gray-600">
                最終バックアップ日時: {new Date(backupSettings.last_backup_date).toLocaleString('ja-JP')}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={saveBackupSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                設定を保存
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {dummyDataSets.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">ダミーデータセット</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dummyDataSets.map((dummySet) => (
              <div key={dummySet.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                <h3 className="font-semibold text-gray-800 mb-2">{dummySet.set_name}</h3>
                {dummySet.description && (
                  <p className="text-sm text-gray-600 mb-3">{dummySet.description}</p>
                )}
                {dummySet.record_counts && (
                  <div className="text-sm text-gray-500 mb-3 space-y-1">
                    <div>店舗: {dummySet.record_counts.stores || 0}件</div>
                    <div>キャンペーン: {dummySet.record_counts.campaigns || 0}件</div>
                  </div>
                )}
                <button
                  onClick={() => restoreDummyData(dummySet)}
                  disabled={isRestoring}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  <Upload size={16} />
                  このデータを復元
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">バックアップ履歴</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                バックアップ名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作成日時
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                データ件数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {backups.map((backup) => (
              <tr key={backup.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {backup.backup_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(backup.backup_date).toLocaleString('ja-JP')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {backup.table_counts && (
                    <div className="space-y-1">
                      <div>店舗: {backup.table_counts.stores || 0}件</div>
                      <div>キャンペーン: {backup.table_counts.campaigns || 0}件</div>
                      <div>進捗: {backup.table_counts.campaign_progress || 0}件</div>
                      <div>予算: {backup.table_counts.budget_tracking || 0}件</div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadBackup(backup)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Download size={16} />
                      ダウンロード
                    </button>
                    <button
                      onClick={() => restoreBackup(backup)}
                      disabled={isRestoring}
                      className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:bg-gray-400"
                    >
                      <Upload size={16} />
                      復元
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {backups.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            バックアップがありません
          </div>
        )}
      </div>
    </div>
  );
}
