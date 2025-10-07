import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, AlertCircle, CheckCircle } from 'lucide-react';

type NotificationSettings = {
  id?: string;
  chatwork_room_id: string;
  chatwork_api_token: string;
  is_enabled: boolean;
  notify_creative_order: boolean;
  notify_creative_order_completed: boolean;
  notify_creative_collection: boolean;
  notify_creative_person_in_charge: boolean;
  notify_creative_submission: boolean;
  notify_progress_pickup: boolean;
  notify_progress_chk_wait: boolean;
  notify_progress_configuration_wait: boolean;
  notify_progress_delivery_start: boolean;
  notify_progress_completion: boolean;
  notify_chk_day_before_amount: boolean;
  notify_chk_day_before_target: boolean;
  notify_chk_day_before_underdelivery: boolean;
  notify_chk_allocated_amount: boolean;
};

export default function ChatWorkNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>({
    chatwork_room_id: '',
    chatwork_api_token: '',
    is_enabled: false,
    notify_creative_order: false,
    notify_creative_order_completed: false,
    notify_creative_collection: false,
    notify_creative_person_in_charge: false,
    notify_creative_submission: false,
    notify_progress_pickup: false,
    notify_progress_chk_wait: false,
    notify_progress_configuration_wait: false,
    notify_progress_delivery_start: false,
    notify_progress_completion: false,
    notify_chk_day_before_amount: false,
    notify_chk_day_before_target: false,
    notify_chk_day_before_underdelivery: false,
    notify_chk_allocated_amount: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('chatwork_notification_settings')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('設定の読み込みに失敗しました:', error);
      return;
    }

    if (data) {
      setSettings(data);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { error: saveError } = settings.id
      ? await supabase
          .from('chatwork_notification_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id)
      : await supabase
          .from('chatwork_notification_settings')
          .insert([settings]);

    setLoading(false);

    if (saveError) {
      setError('設定の保存に失敗しました');
    } else {
      setSuccess('設定を保存しました');
      await loadSettings();
    }
  };

  const handleCheckboxChange = (field: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">ChatWork通知設定</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="chatwork_room_id" className="block text-sm font-medium text-gray-700 mb-2">
              ChatWorkルームID
            </label>
            <input
              id="chatwork_room_id"
              type="text"
              value={settings.chatwork_room_id}
              onChange={(e) => setSettings({ ...settings, chatwork_room_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="ルームIDを入力"
            />
          </div>

          <div>
            <label htmlFor="chatwork_api_token" className="block text-sm font-medium text-gray-700 mb-2">
              ChatWork APIトークン
            </label>
            <input
              id="chatwork_api_token"
              type="password"
              value={settings.chatwork_api_token}
              onChange={(e) => setSettings({ ...settings, chatwork_api_token: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="APIトークンを入力"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="is_enabled"
              checked={settings.is_enabled}
              onChange={() => handleCheckboxChange('is_enabled')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="is_enabled" className="text-sm font-medium text-gray-900">
              通知機能を有効にする
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">クリエイティブ</h3>
            <div className="space-y-2 pl-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_creative_order"
                  checked={settings.notify_creative_order}
                  onChange={() => handleCheckboxChange('notify_creative_order')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_creative_order" className="text-sm text-gray-700">
                  発注時
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_creative_order_completed"
                  checked={settings.notify_creative_order_completed}
                  onChange={() => handleCheckboxChange('notify_creative_order_completed')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_creative_order_completed" className="text-sm text-gray-700">
                  発注済み時
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_creative_collection"
                  checked={settings.notify_creative_collection}
                  onChange={() => handleCheckboxChange('notify_creative_collection')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_creative_collection" className="text-sm text-gray-700">
                  回収時
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_creative_person_in_charge"
                  checked={settings.notify_creative_person_in_charge}
                  onChange={() => handleCheckboxChange('notify_creative_person_in_charge')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_creative_person_in_charge" className="text-sm text-gray-700">
                  担当者決定時
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_creative_submission"
                  checked={settings.notify_creative_submission}
                  onChange={() => handleCheckboxChange('notify_creative_submission')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_creative_submission" className="text-sm text-gray-700">
                  入稿待ち時
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">進捗</h3>
            <div className="space-y-2 pl-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_progress_pickup"
                  checked={settings.notify_progress_pickup}
                  onChange={() => handleCheckboxChange('notify_progress_pickup')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_progress_pickup" className="text-sm text-gray-700">
                  入稿待ち時
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_progress_chk_wait"
                  checked={settings.notify_progress_chk_wait}
                  onChange={() => handleCheckboxChange('notify_progress_chk_wait')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_progress_chk_wait" className="text-sm text-gray-700">
                  CHK待ち時
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_progress_configuration_wait"
                  checked={settings.notify_progress_configuration_wait}
                  onChange={() => handleCheckboxChange('notify_progress_configuration_wait')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_progress_configuration_wait" className="text-sm text-gray-700">
                  設定待ち時
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_progress_delivery_start"
                  checked={settings.notify_progress_delivery_start}
                  onChange={() => handleCheckboxChange('notify_progress_delivery_start')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_progress_delivery_start" className="text-sm text-gray-700">
                  配信中時
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_progress_completion"
                  checked={settings.notify_progress_completion}
                  onChange={() => handleCheckboxChange('notify_progress_completion')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_progress_completion" className="text-sm text-gray-700">
                  完了時
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">CHK</h3>
            <div className="space-y-2 pl-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_chk_day_before_amount"
                  checked={settings.notify_chk_day_before_amount}
                  onChange={() => handleCheckboxChange('notify_chk_day_before_amount')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_chk_day_before_amount" className="text-sm text-gray-700">
                  前日までの消化金額
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_chk_day_before_target"
                  checked={settings.notify_chk_day_before_target}
                  onChange={() => handleCheckboxChange('notify_chk_day_before_target')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_chk_day_before_target" className="text-sm text-gray-700">
                  前日までの消化目標
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_chk_day_before_underdelivery"
                  checked={settings.notify_chk_day_before_underdelivery}
                  onChange={() => handleCheckboxChange('notify_chk_day_before_underdelivery')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_chk_day_before_underdelivery" className="text-sm text-gray-700">
                  前日までの未達
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify_chk_allocated_amount"
                  checked={settings.notify_chk_allocated_amount}
                  onChange={() => handleCheckboxChange('notify_chk_allocated_amount')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="notify_chk_allocated_amount" className="text-sm text-gray-700">
                  配信金額
                </label>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : '設定を保存'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">設定について</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• ChatWorkのAPIトークンは、ChatWorkの設定画面から取得できます</li>
          <li>• ルームIDは、通知を送信したいルームのURLから確認できます</li>
          <li>• 通知機能を有効にすると、選択したタイミングでChatWorkに通知が送信されます</li>
        </ul>
      </div>
    </div>
  );
}
