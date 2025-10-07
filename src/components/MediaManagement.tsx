import { useState, useEffect } from 'react';
import { Plus, Radio, Wifi, WifiOff, CreditCard as Edit2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MediaPlatform {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function MediaManagement() {
  const [platforms, setPlatforms] = useState<MediaPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_tenant_media_platforms');

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error) {
      console.error('Error fetching media platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('メディア名とコードは必須です');
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: userRecord } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', userData.user?.id)
        .single();

      const { error } = await supabase
        .from('media_platforms')
        .insert({
          tenant_id: userRecord?.tenant_id,
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim() || null,
          is_active: true,
          created_by: userData.user?.id,
        });

      if (error) throw error;

      setFormData({ name: '', code: '', description: '' });
      setShowAddForm(false);
      fetchPlatforms();
    } catch (error: any) {
      console.error('Error adding media platform:', error);
      if (error.code === '23505') {
        alert('このメディアコードは既に登録されています');
      } else {
        alert('メディアの追加に失敗しました');
      }
    }
  };

  const handleUpdate = async (id: string, updates: Partial<MediaPlatform>) => {
    try {
      const { error } = await supabase
        .from('media_platforms')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      fetchPlatforms();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating media platform:', error);
      alert('更新に失敗しました');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await handleUpdate(id, { is_active: !currentStatus });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">メディア管理</h2>
          <p className="text-sm text-gray-600 mt-1">広告メディアの追加・非アクティブ化を管理します</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showAddForm ? 'キャンセル' : 'メディアを追加'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">新しいメディアを追加</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メディア名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: Google広告"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メディアコード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="例: GDN"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="メディアの説明（任意）"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({ name: '', code: '', description: '' });
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              追加
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  状態
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  メディア名
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  コード
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  説明
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  登録日時
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {platforms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    メディアが登録されていません
                  </td>
                </tr>
              ) : (
                platforms.map((platform) => (
                  <tr key={platform.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {platform.is_active ? (
                          <>
                            <Wifi className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-700">アクティブ</span>
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-500">非アクティブ</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">{platform.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {platform.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {platform.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(platform.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleActive(platform.id, platform.is_active)}
                        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                          platform.is_active
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {platform.is_active ? '非アクティブ化' : 'アクティブ化'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Radio className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">メディア管理について</p>
            <ul className="space-y-1 text-blue-800">
              <li>• メディアを追加すると、ユーザーごとにアクセス権限を設定できます</li>
              <li>• 非アクティブ化したメディアは新規キャンペーンで選択できなくなります</li>
              <li>• 既存のデータには影響しません</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
