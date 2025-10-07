import { useState, useEffect } from 'react';
import { supabase, User, Campaign, UserPermission } from '../lib/supabase';
import { Shield, Eye, Users, CheckCircle, XCircle, Search, Key, Filter } from 'lucide-react';

const RESOURCES = [
  { value: 'dashboard', label: 'ダッシュボード', description: '担当フィルター必要 - 自分のキャンペーンのみ表示', needsFilter: true },
  { value: 'stores', label: '店舗管理', description: '担当フィルター不要 - 全データアクセス可能', needsFilter: false },
  { value: 'campaigns', label: '入稿管理', description: '担当フィルター必要 - 自分のキャンペーンのみ表示', needsFilter: true },
  { value: 'campaign_management', label: 'キャンペーン管理', description: '担当フィルター必要 - 自分のキャンペーンのみ表示', needsFilter: true },
  { value: 'underdelivery', label: '未消化管理', description: '担当フィルター必要 - 自分のキャンペーンのみ表示', needsFilter: true },
  { value: 'ad_operations', label: '広告運用管理', description: '担当フィルター不要 - 全データアクセス可能', needsFilter: false },
  { value: 'backup', label: 'バックアップ', description: 'システム管理機能', needsFilter: false },
  { value: 'history', label: '操作履歴', description: 'システム管理機能', needsFilter: false },
  { value: 'users', label: 'ユーザー管理', description: 'システム管理機能', needsFilter: false },
];

const MEDIA_PLATFORMS = [
  { value: 'LINE', label: 'LINE' },
  { value: 'YDA', label: 'YDA' },
  { value: 'YSA', label: 'YSA' },
  { value: 'GVN', label: 'GVN' },
  { value: 'GDN', label: 'GDN' },
  { value: 'GSN', label: 'GSN' },
  { value: 'Logicad', label: 'Logicad' },
  { value: 'META', label: 'META' },
  { value: 'X', label: 'X' },
];

type PermissionSettingsProps = {
  user: User;
  onClose: () => void;
  onSave: () => void;
};

export default function UserPermissionSettings({ user, onClose, onSave }: PermissionSettingsProps) {
  const [activeTab, setActiveTab] = useState<'scope' | 'resources'>('scope');
  const [viewScope, setViewScope] = useState<'all' | 'own' | 'assigned'>(user.view_scope || 'own');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPerson, setFilterPerson] = useState<string>('');
  const [filterMedia, setFilterMedia] = useState<string>('');
  const [persons, setPersons] = useState<string[]>([]);
  const [showCampaignSelection, setShowCampaignSelection] = useState(false);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions();
    if (viewScope === 'assigned') {
      fetchCampaigns();
      fetchUserCampaignAccess();
    }
  }, []);

  useEffect(() => {
    if (viewScope === 'assigned' && campaigns.length === 0) {
      fetchCampaigns();
      fetchUserCampaignAccess();
    }
  }, [viewScope]);

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, campaign_name, account_name, start_date, end_date, platform, person_in_charge')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return;
    }
    setCampaigns(data || []);

    const uniquePersons = [...new Set(data?.map(c => c.person_in_charge).filter(Boolean) as string[])];
    setPersons(uniquePersons);
  };

  const fetchUserCampaignAccess = async () => {
    const { data, error } = await supabase
      .from('user_campaign_access')
      .select('campaign_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user campaign access:', error);
      return;
    }
    setSelectedCampaigns(data?.map(d => d.campaign_id) || []);
  };

  const fetchPermissions = async () => {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching permissions:', error);
      return;
    }
    setPermissions(data || []);
  };

  const updatePermission = (resource: string, field: keyof Omit<UserPermission, 'id' | 'user_id' | 'resource' | 'created_at' | 'updated_at'>, value: boolean) => {
    const existingPermission = permissions.find(p => p.resource === resource);

    if (existingPermission) {
      const updated = permissions.map(p =>
        p.resource === resource ? { ...p, [field]: value } : p
      );
      setPermissions(updated);
    } else {
      const newPermission: any = {
        id: crypto.randomUUID(),
        user_id: user.id,
        resource,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
        [field]: value,
      };
      setPermissions([...permissions, newPermission]);
    }
  };

  const getPermissionForResource = (resource: string) => {
    return permissions.find(p => p.resource === resource) || {
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: userError } = await supabase
        .from('users')
        .update({ view_scope: viewScope })
        .eq('id', user.id);

      if (userError) throw userError;

      if (viewScope === 'assigned') {
        const { error: deleteError } = await supabase
          .from('user_campaign_access')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        if (selectedCampaigns.length > 0) {
          const accessRecords = selectedCampaigns.map(campaignId => ({
            user_id: user.id,
            campaign_id: campaignId
          }));

          const { error: insertError } = await supabase
            .from('user_campaign_access')
            .insert(accessRecords);

          if (insertError) throw insertError;
        }
      }

      const { error: deletePermError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', user.id);

      if (deletePermError) throw deletePermError;

      if (permissions.length > 0) {
        const permRecords = permissions.map(p => ({
          user_id: user.id,
          resource: p.resource,
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
        }));

        const { error: insertPermError } = await supabase
          .from('user_permissions')
          .insert(permRecords);

        if (insertPermError) throw insertPermError;
      }

      alert('権限設定を保存しました');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('権限設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const toggleCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev =>
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.account_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPerson = !filterPerson || c.person_in_charge === filterPerson;
    const matchesMedia = !filterMedia || c.platform === filterMedia;
    return matchesSearch && matchesPerson && matchesMedia;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">権限設定</h2>
              <p className="text-sm text-gray-600">{user.full_name} ({user.email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('scope')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'scope'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Eye className="w-4 h-4" />
              権限設定
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'resources'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Key className="w-4 h-4" />
              機能別権限（CRUD）
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'scope' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">データ表示範囲</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      ユーザーが各画面で閲覧できるデータの範囲を設定します。<br />
                      <strong>担当フィルター対象:</strong> ダッシュボード、入稿管理、キャンペーン管理、未消化管理<br />
                      <strong>全データ表示:</strong> 店舗管理、広告運用管理
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 p-3 bg-white border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                        <input
                          type="radio"
                          name="viewScope"
                          value="all"
                          checked={viewScope === 'all'}
                          onChange={(e) => setViewScope(e.target.value as 'all' | 'own' | 'assigned')}
                          className="w-4 h-4 text-blue-600 mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">全てのデータ（管理者・マネージャー向け）</div>
                          <div className="text-sm text-gray-600">すべての店舗・キャンペーンのデータを閲覧可能</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 p-3 bg-white border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                        <input
                          type="radio"
                          name="viewScope"
                          value="own"
                          checked={viewScope === 'own'}
                          onChange={(e) => setViewScope(e.target.value as 'all' | 'own' | 'assigned')}
                          className="w-4 h-4 text-blue-600 mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">自分が担当のデータのみ（営業担当者向け）</div>
                          <div className="text-sm text-gray-600">
                            担当フィルター対象の画面では、自分が担当者として設定されているキャンペーンのみ閲覧可能。<br />
                            店舗管理・広告運用管理は全データにアクセス可能。
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 p-3 bg-white border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                        <input
                          type="radio"
                          name="viewScope"
                          value="assigned"
                          checked={viewScope === 'assigned'}
                          onChange={(e) => setViewScope(e.target.value as 'all' | 'own' | 'assigned')}
                          className="w-4 h-4 text-blue-600 mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">個別指定したキャンペーンのみ（外部ユーザー向け）</div>
                          <div className="text-sm text-gray-600">
                            入稿管理のみで、指定されたキャンペーン×メディアの組み合わせのみアクセス可能。<br />
                            他の機能へのアクセスは基本的に制限されます。
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {viewScope === 'assigned' && (
                <>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">アクセス可能なキャンペーン</h3>
                        <span className="text-sm text-gray-500">({selectedCampaigns.length}件選択中)</span>
                      </div>
                      <button
                        onClick={() => setShowCampaignSelection(!showCampaignSelection)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showCampaignSelection ? '閉じる' : 'キャンペーンを選択'}
                      </button>
                    </div>

                    {showCampaignSelection && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="キャンペーン名・アカウント名で検索..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                              value={filterPerson}
                              onChange={(e) => setFilterPerson(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                              <option value="">全ての担当者</option>
                              {persons.map(person => (
                                <option key={person} value={person}>{person}</option>
                              ))}
                            </select>
                          </div>
                          <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                              value={filterMedia}
                              onChange={(e) => setFilterMedia(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                              <option value="">全てのメディア</option>
                              {MEDIA_PLATFORMS.map(platform => (
                                <option key={platform.value} value={platform.value}>{platform.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                          {filteredCampaigns.map(campaign => (
                            <label
                              key={campaign.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCampaigns.includes(campaign.id)}
                                onChange={() => toggleCampaign(campaign.id)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{campaign.campaign_name}</div>
                                <div className="text-sm text-gray-600 truncate">{campaign.account_name}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(campaign.start_date).toLocaleDateString('ja-JP')} - {new Date(campaign.end_date).toLocaleDateString('ja-JP')}
                                  {campaign.platform && ` • ${campaign.platform}`}
                                </div>
                              </div>
                              {selectedCampaigns.includes(campaign.id) && (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                              )}
                            </label>
                          ))}
                        </div>

                        {filteredCampaigns.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p>該当するキャンペーンが見つかりません</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>注意:</strong> 外部ユーザー向けの設定です。選択したキャンペーンのみアクセス可能になります。担当者とメディアのフィルターを使って、必要なキャンペーンを絞り込んで選択してください。
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">機能別CRUD権限設定</h3>
                    <p className="text-sm text-blue-700">
                      各機能に対する操作権限（作成・閲覧・編集・削除）を個別に設定できます。<br />
                      これらの権限は、表示範囲設定で許可されたデータに対してのみ適用されます。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">リソース</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">閲覧<br />(Read)</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">作成<br />(Create)</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">編集<br />(Update)</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">削除<br />(Delete)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {RESOURCES.map(resource => {
                      const perm = getPermissionForResource(resource.value);
                      return (
                        <tr key={resource.value} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{resource.label}</div>
                            <div className="text-xs text-gray-500">{resource.description}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_view}
                              onChange={(e) => updatePermission(resource.value, 'can_view', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_create}
                              onChange={(e) => updatePermission(resource.value, 'can_create', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_edit}
                              onChange={(e) => updatePermission(resource.value, 'can_edit', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.can_delete}
                              onChange={(e) => updatePermission(resource.value, 'can_delete', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
