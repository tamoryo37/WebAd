import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase, Campaign, CampaignProgress, Store } from '../lib/supabase';
import { Plus, CreditCard as Edit2, Save, X, Filter, ChevronUp, ChevronDown, Copy, Search } from 'lucide-react';
import FilterDropdown from './FilterDropdown';
import EditableCell from './EditableCell';
import { useAuth } from '../contexts/AuthContext';

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

type ColumnFilters = {
  [key: string]: string[];
};

type NewCampaign = Partial<Campaign> & { tempId?: string };

type CampaignManagementProps = {
  selectedCampaignId?: string | null;
  onClearSelection?: () => void;
  restrictedView?: boolean;
};

export default function CampaignManagement({ selectedCampaignId, onClearSelection, restrictedView = false }: CampaignManagementProps = {}) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<(Campaign & { store?: Store; progress?: CampaignProgress })[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Campaign>>({});
  const [progressForm, setProgressForm] = useState<Partial<CampaignProgress>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [newCampaigns, setNewCampaigns] = useState<NewCampaign[]>([]);
  const [focusedCell, setFocusedCell] = useState<{ id: string; field: string } | null>(null);
  const [personSearch, setPersonSearch] = useState<string>('');
  const [userAssignments, setUserAssignments] = useState<{
    can_view_all: boolean;
    assigned_person_in_charge: string[];
    role: string;
    managed_users: string[];
    is_admin: boolean;
  }>({
    can_view_all: false,
    assigned_person_in_charge: [],
    role: 'member',
    managed_users: [],
    is_admin: false
  });
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
  const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<any>('');

  useEffect(() => {
    fetchStores();
    fetchUserAssignments();
  }, [user]);

  useEffect(() => {
    if (userAssignments) {
      fetchCampaigns();
    }
  }, [userAssignments]);

  const fetchUserAssignments = async () => {
    if (!user?.email) return;

    const { data, error } = await supabase
      .from('user_campaign_assignments')
      .select('*')
      .eq('user_email', user.email)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user assignments:', error);
      return;
    }

    if (data) {
      const assignments = {
        can_view_all: data.can_view_all || false,
        assigned_person_in_charge: data.assigned_person_in_charge || [],
        role: data.role || 'member',
        managed_users: data.managed_users || [],
        is_admin: data.is_admin || false
      };

      setUserAssignments(assignments);

      if (assignments.role === 'manager' && assignments.managed_users.length > 0) {
        const { data: managedAssignments } = await supabase
          .from('user_campaign_assignments')
          .select('assigned_person_in_charge')
          .in('user_email', assignments.managed_users);

        if (managedAssignments) {
          const allPersons = new Set<string>();
          assignments.assigned_person_in_charge.forEach(p => allPersons.add(p));
          managedAssignments.forEach(ma => {
            (ma.assigned_person_in_charge || []).forEach(p => allPersons.add(p));
          });

          setUserAssignments({
            ...assignments,
            assigned_person_in_charge: Array.from(allPersons)
          });
        }
      } else if (!assignments.can_view_all && assignments.assigned_person_in_charge.length === 0) {
        setPersonSearch(user.email.split('@')[0]);
      }
    } else {
      const username = user.email.split('@')[0];
      await supabase
        .from('user_campaign_assignments')
        .insert([{
          user_email: user.email,
          assigned_person_in_charge: [username],
          can_view_all: false,
          role: 'member',
          managed_users: [],
          is_admin: false
        }]);
      setUserAssignments({
        can_view_all: false,
        assigned_person_in_charge: [username],
        role: 'member',
        managed_users: [],
        is_admin: false
      });
      setPersonSearch(username);
    }
  };

  useEffect(() => {
    if (selectedCampaignId && campaigns.length > 0) {
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      if (campaign) {
        setSelectedCampaign(campaign);
        setEditForm(campaign);
        setProgressForm(campaign.progress || {});
        setIsEditing(true);
        if (onClearSelection) {
          onClearSelection();
        }
      }
    }
  }, [selectedCampaignId, campaigns]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [resizing.key]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing]);

  const startResize = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentWidth = columnWidths[key] || 150;
    setResizing({ key, startX: e.clientX, startWidth: currentWidth });
  };

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('store_name');

    if (error) {
      console.error('Error fetching stores:', error);
      return;
    }
    setStores(data || []);
  };

  const fetchCampaigns = async () => {
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return;
    }

    const { data: progressData } = await supabase
      .from('campaign_progress')
      .select('*');

    const { data: storesData } = await supabase
      .from('stores')
      .select('*');

    const enrichedCampaigns = (campaignsData || []).map(campaign => ({
      ...campaign,
      store: storesData?.find(s => s.id === campaign.store_id),
      progress: progressData?.find(p => p.campaign_id === campaign.id)
    }));

    setCampaigns(enrichedCampaigns);
  };

  const handleSave = async () => {
    if (!editForm.campaign_number || !editForm.platform || !editForm.account_name || !editForm.campaign_name) {
      alert('必須項目を入力してください');
      return;
    }

    const dataToSave = {
      ...editForm,
      updated_at: new Date().toISOString(),
    };

    let campaignId = selectedCampaign?.id;

    if (selectedCampaign) {
      const { error } = await supabase
        .from('campaigns')
        .update(dataToSave)
        .eq('id', selectedCampaign.id);

      if (error) {
        console.error('Error updating campaign:', error);
        alert('更新に失敗しました');
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([dataToSave])
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', error);
        alert('作成に失敗しました');
        return;
      }
      campaignId = data.id;
    }

    if (campaignId) {
      const { data: existingProgress } = await supabase
        .from('campaign_progress')
        .select('*')
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (existingProgress) {
        await supabase
          .from('campaign_progress')
          .update(progressForm)
          .eq('campaign_id', campaignId);
      } else {
        await supabase
          .from('campaign_progress')
          .insert([{ campaign_id: campaignId, ...progressForm }]);
      }
    }

    fetchCampaigns();
    setIsEditing(false);
    alert('保存しました');
  };

  const addNewRow = () => {
    const tempId = `temp_${Date.now()}`;
    setNewCampaigns([...newCampaigns, {
      tempId,
      campaign_number: '',
      platform: '',
      account_name: '',
      campaign_name: '',
      start_date: '',
      end_date: '',
      total_budget: 0,
      set_total_budget: 0,
      set_daily_budget: 0,
      delivery_days: 0,
      status: 'pending',
      stored: false
    }]);
    setTimeout(() => {
      setFocusedCell({ id: tempId, field: 'campaign_number' });
    }, 100);
  };


  const updateNewCampaign = (tempId: string, field: string, value: any) => {
    setNewCampaigns(newCampaigns.map(c =>
      c.tempId === tempId ? { ...c, [field]: value } : c
    ));
  };

  const saveNewCampaign = async (tempId: string) => {
    const campaign = newCampaigns.find(c => c.tempId === tempId);
    if (!campaign) return;

    if (!campaign.campaign_number || !campaign.platform || !campaign.account_name || !campaign.campaign_name) {
      return;
    }

    const { tempId: _, ...dataToSave } = campaign;
    const { data, error } = await supabase
      .from('campaigns')
      .insert([dataToSave])
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      alert('作成に失敗しました');
      return;
    }

    await supabase
      .from('campaign_progress')
      .insert([{
        campaign_id: data.id,
        has_proposal: false,
        has_quote: false,
        creative_status: 'pending',
        progress_status: 'waiting_submission'
      }]);

    setNewCampaigns(newCampaigns.filter(c => c.tempId !== tempId));
    fetchCampaigns();
  };

  const deleteNewCampaign = (tempId: string) => {
    setNewCampaigns(newCampaigns.filter(c => c.tempId !== tempId));
  };

  const copyCampaignAsNew = (campaign: Campaign) => {
    const tempId = `temp_${Date.now()}`;
    const { id, created_at, updated_at, ...campaignData } = campaign;
    setNewCampaigns([{
      tempId,
      ...campaignData,
      campaign_number: `${campaignData.campaign_number}_copy`,
      stored: false
    }, ...newCampaigns]);
    setTimeout(() => {
      setFocusedCell({ id: tempId, field: 'campaign_number' });
    }, 100);
  };

  const startEditingCell = (campaignId: string, field: string, currentValue: any) => {
    setEditingCell({ id: campaignId, field });
    setEditingValue(currentValue || '');
  };

  const cancelEditingCell = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;

    try {
      if (field === 'progress_status') {
        const { data: existingProgress } = await supabase
          .from('campaign_progress')
          .select('*')
          .eq('campaign_id', id)
          .maybeSingle();

        if (existingProgress) {
          await supabase
            .from('campaign_progress')
            .update({ progress_status: editingValue })
            .eq('campaign_id', id);
        } else {
          await supabase
            .from('campaign_progress')
            .insert([{
              campaign_id: id,
              progress_status: editingValue,
              has_proposal: false,
              has_quote: false,
              creative_status: 'pending'
            }]);
        }
      } else {
        const updateData: any = { [field]: editingValue };

        await supabase
          .from('campaigns')
          .update(updateData)
          .eq('id', id);
      }

      await fetchCampaigns();
      setEditingCell(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('更新に失敗しました');
    }
  };

  const handleNewCampaign = () => {
    setSelectedCampaign(null);
    setEditForm({
      campaign_number: '',
      platform: '',
      account_name: '',
      campaign_name: '',
      start_date: '',
      end_date: '',
      total_budget: 0,
      set_total_budget: 0,
      set_daily_budget: 0,
      delivery_days: 0,
      status: 'pending',
      stored: false
    });
    setProgressForm({
      has_proposal: false,
      has_quote: false,
      creative_status: 'pending',
      progress_status: 'waiting_submission'
    });
    setIsEditing(true);
  };

  const handleCloseDetail = () => {
    setSelectedCampaign(null);
    setIsEditing(false);
  };

  const progressStatuses = [
    { value: 'all', label: 'すべて' },
    { value: 'waiting_submission', label: '入稿待ち' },
    { value: 'waiting_check', label: 'CHK待ち' },
    { value: 'waiting_delivery', label: '配信待ち' },
    { value: 'delivering', label: '配信中' },
    { value: 'completed', label: '完了' },
    { value: 'same_day', label: '当日対応' },
    { value: 'review_required', label: '再審査/要修正' },
    { value: 'stopped', label: '停止/中止' }
  ];

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getUniqueValues = (key: string) => {
    const values = new Set<string>();
    campaigns.forEach(campaign => {
      let value = '';
      switch(key) {
        case 'store':
          value = campaign.store?.store_name || '-';
          break;
        case 'progress_status':
          value = progressStatuses.find(s => s.value === campaign.progress?.progress_status)?.label || '入稿待ち';
          break;
        case 'platform':
          value = campaign.platform;
          break;
        case 'setter':
          value = campaign.setter || '-';
          break;
        case 'account_name':
          value = campaign.account_name;
          break;
        case 'branch':
          value = campaign.branch || '-';
          break;
        case 'person_in_charge':
          value = campaign.person_in_charge || '-';
          break;
        case 'target_area':
          value = campaign.target_area || '-';
          break;
        case 'stored':
          value = campaign.stored ? '格納済み' : '未格納';
          break;
        default:
          value = (campaign as any)[key]?.toString() || '-';
      }
      values.add(value);
    });
    return Array.from(values).sort();
  };

  const toggleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => {
      const current = prev[column] || [];
      const newFilters = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];

      if (newFilters.length === 0) {
        const { [column]: removed, ...rest } = prev;
        return rest;
      }

      return { ...prev, [column]: newFilters };
    });
  };

  const clearColumnFilter = (column: string) => {
    setColumnFilters(prev => {
      const { [column]: removed, ...rest } = prev;
      return rest;
    });
  };

  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = filterStatus === 'all'
      ? campaigns
      : campaigns.filter(c => c.progress?.progress_status === filterStatus);

    if (personSearch.trim()) {
      filtered = filtered.filter(c =>
        c.person_in_charge?.toLowerCase().includes(personSearch.toLowerCase())
      );
    }

    Object.keys(columnFilters).forEach(column => {
      const filterValues = columnFilters[column];
      if (filterValues.length > 0) {
        filtered = filtered.filter(campaign => {
          let value = '';
          switch(column) {
            case 'store':
              value = campaign.store?.store_name || '-';
              break;
            case 'progress_status':
              value = progressStatuses.find(s => s.value === campaign.progress?.progress_status)?.label || '入稿待ち';
              break;
            case 'stored':
              value = campaign.stored ? '格納済み' : '未格納';
              break;
            default:
              value = (campaign as any)[column]?.toString() || '-';
          }
          return filterValues.includes(value);
        });
      }
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        switch(sortConfig.key) {
          case 'store':
            aValue = a.store?.store_name || '';
            bValue = b.store?.store_name || '';
            break;
          case 'progress_status':
            aValue = a.progress?.progress_status || '';
            bValue = b.progress?.progress_status || '';
            break;
          case 'stored':
            aValue = a.stored ? 1 : 0;
            bValue = b.stored ? 1 : 0;
            break;
          case 'total_budget':
          case 'set_total_budget':
          case 'set_daily_budget':
          case 'delivery_days':
            aValue = Number((a as any)[sortConfig.key]) || 0;
            bValue = Number((b as any)[sortConfig.key]) || 0;
            break;
          default:
            aValue = (a as any)[sortConfig.key] || '';
            bValue = (b as any)[sortConfig.key] || '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [campaigns, filterStatus, columnFilters, sortConfig, personSearch]);

  return (
    <div className="p-4 h-full overflow-auto flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="担当者名で検索..."
              value={personSearch}
              onChange={(e) => setPersonSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-4 items-center">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {progressStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {(selectedCampaign || isEditing) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex-shrink-0 max-h-[600px] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedCampaign ? `NO. ${editForm.campaign_number}` : '新規キャンペーン'}
            </h2>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 size={18} />
                    編集
                  </button>
                  <button
                    onClick={handleCloseDetail}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X size={18} />
                    閉じる
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save size={18} />
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      if (selectedCampaign) {
                        setEditForm(selectedCampaign);
                        setProgressForm(selectedCampaign.progress || {});
                      } else {
                        handleCloseDetail();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X size={18} />
                    キャンセル
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 border-b pb-2">基本情報</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NO. *</label>
                <input
                  type="text"
                  value={editForm.campaign_number || ''}
                  onChange={(e) => setEditForm({ ...editForm, campaign_number: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">店舗</label>
                <select
                  value={editForm.store_id || ''}
                  onChange={(e) => setEditForm({ ...editForm, store_id: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                >
                  <option value="">選択してください</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.store_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">設定者</label>
                <input
                  type="text"
                  value={editForm.setter || ''}
                  onChange={(e) => setEditForm({ ...editForm, setter: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">媒体 *</label>
                <select
                  value={editForm.platform || ''}
                  onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                >
                  <option value="">選択してください</option>
                  <option value="LINE">LINE</option>
                  <option value="YDA">YDA</option>
                  <option value="YSA">YSA</option>
                  <option value="GVN">GVN</option>
                  <option value="GDN">GDN</option>
                  <option value="GSN">GSN</option>
                  <option value="Logicad">Logicad</option>
                  <option value="META">META</option>
                  <option value="X">X</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">アカウント名 *</label>
                <input
                  type="text"
                  value={editForm.account_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, account_name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CP名 *</label>
                <input
                  type="text"
                  value={editForm.campaign_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, campaign_name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">コピー元</label>
                <input
                  type="text"
                  value={editForm.copy_source || ''}
                  onChange={(e) => setEditForm({ ...editForm, copy_source: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 border-b pb-2">配信情報</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配信開始日 *</label>
                <input
                  type="date"
                  value={editForm.start_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配信終了日 *</label>
                <input
                  type="date"
                  value={editForm.end_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配信時間</label>
                <input
                  type="text"
                  value={editForm.delivery_time || ''}
                  onChange={(e) => setEditForm({ ...editForm, delivery_time: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">全体予算</label>
                <input
                  type="number"
                  value={editForm.total_budget || 0}
                  onChange={(e) => setEditForm({ ...editForm, total_budget: Number(e.target.value) })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">設定総予算</label>
                <input
                  type="number"
                  value={editForm.set_total_budget || 0}
                  onChange={(e) => setEditForm({ ...editForm, set_total_budget: Number(e.target.value) })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">設定日予算</label>
                <input
                  type="number"
                  value={editForm.set_daily_budget || 0}
                  onChange={(e) => setEditForm({ ...editForm, set_daily_budget: Number(e.target.value) })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配信日数</label>
                <input
                  type="number"
                  value={editForm.delivery_days || 0}
                  onChange={(e) => setEditForm({ ...editForm, delivery_days: Number(e.target.value) })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                <input
                  type="text"
                  value={editForm.person_in_charge || ''}
                  onChange={(e) => setEditForm({ ...editForm, person_in_charge: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 border-b pb-2">詳細設定</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">広告情報URL</label>
                <input
                  type="text"
                  value={editForm.ad_info_url || ''}
                  onChange={(e) => setEditForm({ ...editForm, ad_info_url: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地域</label>
                <input
                  type="text"
                  value={editForm.target_area || ''}
                  onChange={(e) => setEditForm({ ...editForm, target_area: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LP</label>
                <input
                  type="text"
                  value={editForm.landing_page || ''}
                  onChange={(e) => setEditForm({ ...editForm, landing_page: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">その他設定</label>
                <textarea
                  value={editForm.other_settings || ''}
                  onChange={(e) => setEditForm({ ...editForm, other_settings: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">支社</label>
                <input
                  type="text"
                  value={editForm.branch || ''}
                  onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CHK</label>
                <input
                  type="text"
                  value={editForm.chk || ''}
                  onChange={(e) => setEditForm({ ...editForm, chk: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">前化CHK</label>
                <input
                  type="text"
                  value={editForm.completion_chk || ''}
                  onChange={(e) => setEditForm({ ...editForm, completion_chk: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                <input
                  type="text"
                  value={editForm.memo || ''}
                  onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">前日までの前化金額</label>
                <input
                  type="text"
                  value={editForm.before_start_completion_status || ''}
                  onChange={(e) => setEditForm({ ...editForm, before_start_completion_status: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">前日までの前化目標</label>
                <input
                  type="number"
                  value={editForm.before_start_completion_amount || 0}
                  onChange={(e) => setEditForm({ ...editForm, before_start_completion_amount: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">前日までの未消化</label>
                <input
                  type="number"
                  value={editForm.before_start_completion_target || 0}
                  onChange={(e) => setEditForm({ ...editForm, before_start_completion_target: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">アロケ金額</label>
                <input
                  type="text"
                  value={editForm.account || ''}
                  onChange={(e) => setEditForm({ ...editForm, account: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">アロケ都下予算</label>
                <input
                  type="text"
                  value={editForm.account_termination || ''}
                  onChange={(e) => setEditForm({ ...editForm, account_termination: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">アロケ日予算</label>
                <input
                  type="text"
                  value={editForm.account_day_forecast || ''}
                  onChange={(e) => setEditForm({ ...editForm, account_day_forecast: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">進捗状況</label>
                <select
                  value={progressForm.progress_status || 'waiting_submission'}
                  onChange={(e) => setProgressForm({ ...progressForm, progress_status: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                >
                  {progressStatuses.filter(s => s.value !== 'all').map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.stored || false}
                  onChange={(e) => setEditForm({ ...editForm, stored: e.target.checked })}
                  disabled={!isEditing}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">格納済み</span>
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <button
            onClick={addNewRow}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            行を追加
          </button>
        </div>
        <div className="overflow-auto flex-1">
            <table className="min-w-full w-full text-xs campaign-table" style={{ tableLayout: 'fixed' }}>
              <thead className="bg-gray-50 border-b">
                <tr>
                {[
                  { key: 'campaign_number', label: 'NO.' },
                  { key: 'store', label: '店舗', filterable: true },
                  { key: 'setter', label: '設定者', filterable: true },
                  { key: 'platform', label: '媒体', filterable: true },
                  { key: 'account_name', label: 'アカウント名', filterable: true },
                  { key: 'campaign_name', label: 'CP名' },
                  { key: 'copy_source', label: 'コピー元' },
                  { key: 'start_date', label: '配信開始日' },
                  { key: 'end_date', label: '配信終了日' },
                  { key: 'delivery_time', label: '配信時間' },
                  { key: 'total_budget', label: '全体予算' },
                  { key: 'set_total_budget', label: '設定総予算' },
                  { key: 'set_daily_budget', label: '設定日予算' },
                  { key: 'delivery_days', label: '配信日数' },
                  { key: 'ad_info_url', label: '広告情報URL' },
                  { key: 'target_area', label: '地域', filterable: true },
                  { key: 'landing_page', label: 'LP' },
                  { key: 'other_settings', label: 'その他設定' },
                  { key: 'notes', label: 'メモ' },
                  { key: 'branch', label: '支社', filterable: true },
                  { key: 'stored', label: '格納', filterable: true },
                  { key: 'person_in_charge', label: '担当者', filterable: true },
                  { key: 'progress_status', label: '進捗状況', filterable: true },
                  { key: 'chk', label: 'CHK' },
                  { key: 'completion_chk', label: '前化CHK' },
                  { key: 'memo', label: 'メモ' },
                  { key: 'before_start_completion_status', label: '前日までの前化金額' },
                  { key: 'before_start_completion_amount', label: '前日までの前化目標' },
                  { key: 'before_start_completion_target', label: '前日までの未消化' },
                  { key: 'account', label: 'アロケ金額' },
                  { key: 'account_termination', label: 'アロケ都下予算' },
                  { key: 'account_day_forecast', label: 'アロケ日予算' }
                ].map(column => (
                  <th
                    key={column.key}
                    className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase whitespace-nowrap relative"
                    style={{ width: columnWidths[column.key] || 150 }}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                      >
                        <span>{column.label}</span>
                        {sortConfig?.key === column.key && (
                          sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </button>
                      {column.filterable && (
                        <FilterDropdown
                          column={column.key}
                          values={getUniqueValues(column.key)}
                          selectedValues={columnFilters[column.key] || []}
                          onToggle={(value) => toggleColumnFilter(column.key, value)}
                          onClear={() => clearColumnFilter(column.key)}
                          isActive={activeFilterColumn === column.key}
                          onOpenChange={(isOpen) => setActiveFilterColumn(isOpen ? column.key : null)}
                        />
                      )}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
                      onMouseDown={(e) => startResize(column.key, e)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {newCampaigns.map((campaign) => (
                <tr key={campaign.tempId} className="bg-green-50 border-l-4 border-green-500">
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.campaign_number || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'campaign_number', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveNewCampaign(campaign.tempId!);
                        if (e.key === 'Escape') deleteNewCampaign(campaign.tempId!);
                      }}
                      onBlur={() => saveNewCampaign(campaign.tempId!)}
                      autoFocus={focusedCell?.id === campaign.tempId && focusedCell?.field === 'campaign_number'}
                      placeholder="NO."
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={campaign.store_id || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'store_id', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>{store.store_name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.setter || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'setter', e.target.value)}
                      placeholder="設定者"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={campaign.platform || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'platform', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-</option>
                      <option value="LINE">LINE</option>
                      <option value="YDA">YDA</option>
                      <option value="YSA">YSA</option>
                      <option value="GVN">GVN</option>
                      <option value="GDN">GDN</option>
                      <option value="GSN">GSN</option>
                      <option value="Logicad">Logicad</option>
                      <option value="META">META</option>
                      <option value="X">X</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.account_name || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'account_name', e.target.value)}
                      placeholder="アカウント名"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.campaign_name || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'campaign_name', e.target.value)}
                      placeholder="CP名"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.copy_source || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'copy_source', e.target.value)}
                      placeholder="コピー元"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={campaign.start_date || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'start_date', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={campaign.end_date || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'end_date', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.delivery_time || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'delivery_time', e.target.value)}
                      placeholder="配信時間"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={campaign.total_budget || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'total_budget', Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={campaign.set_total_budget || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'set_total_budget', Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={campaign.set_daily_budget || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'set_daily_budget', Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={campaign.delivery_days || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'delivery_days', Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.ad_info_url || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'ad_info_url', e.target.value)}
                      placeholder="URL"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.target_area || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'target_area', e.target.value)}
                      placeholder="地域"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.landing_page || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'landing_page', e.target.value)}
                      placeholder="LP"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.other_settings || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'other_settings', e.target.value)}
                      placeholder="その他設定"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.notes || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'notes', e.target.value)}
                      placeholder="メモ"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.branch || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'branch', e.target.value)}
                      placeholder="支社"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={campaign.stored || false}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'stored', e.target.checked)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.person_in_charge || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'person_in_charge', e.target.value)}
                      placeholder="担当者"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.chk || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'chk', e.target.value)}
                      placeholder="CHK"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.completion_chk || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'completion_chk', e.target.value)}
                      placeholder="前化CHK"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.memo || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'memo', e.target.value)}
                      placeholder="メモ"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.before_start_completion_status || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'before_start_completion_status', e.target.value)}
                      placeholder="前日までの前化金額"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={campaign.before_start_completion_amount || 0}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'before_start_completion_amount', parseFloat(e.target.value) || 0)}
                      placeholder="前日までの前化目標"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={campaign.before_start_completion_target || 0}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'before_start_completion_target', parseFloat(e.target.value) || 0)}
                      placeholder="前日までの未消化"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.account || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'account', e.target.value)}
                      placeholder="アロケ金額"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.account_termination || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'account_termination', e.target.value)}
                      placeholder="アロケ都下予算"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={campaign.account_day_forecast || ''}
                      onChange={(e) => updateNewCampaign(campaign.tempId!, 'account_day_forecast', e.target.value)}
                      placeholder="アロケ日予算"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveNewCampaign(campaign.tempId!)}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        title="保存 (Enter)"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => deleteNewCampaign(campaign.tempId!)}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        title="削除 (Esc)"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAndSortedCampaigns.map((campaign) => {
                const isEditingThisRow = editingCell?.id === campaign.id;

                return (
                <tr
                  key={campaign.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setEditForm(campaign);
                      setProgressForm(campaign.progress || {});
                      setIsEditing(false);
                    }}
                    style={{ width: columnWidths['campaign_number'] || 150 }}
                  >
                    <div className="flex items-center gap-2 px-3 py-3">
                      <span className="truncate text-sm text-gray-900">{campaign.campaign_number}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCampaignAsNew(campaign);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded flex-shrink-0"
                        title="このキャンペーンをコピー"
                      >
                        <Copy size={14} className="text-blue-600" />
                      </button>
                    </div>
                  </td>
                  <td
                    className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap cursor-pointer"
                    style={{ width: columnWidths['store'] || 150 }}
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setEditForm(campaign);
                      setProgressForm(campaign.progress || {});
                      setIsEditing(false);
                    }}
                  >{campaign.store?.store_name || '-'}</td>
                  <EditableCell
                    value={campaign.setter}
                    campaignId={campaign.id}
                    field="setter"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'setter'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                    columnWidth={columnWidths['setter'] || 150}
                  />
                  <EditableCell
                    value={campaign.platform}
                    campaignId={campaign.id}
                    field="platform"
                    type="select"
                    options={[
                      { value: 'LINE', label: 'LINE' },
                      { value: 'YDA', label: 'YDA' },
                      { value: 'YSA', label: 'YSA' },
                      { value: 'GVN', label: 'GVN' },
                      { value: 'GDN', label: 'GDN' },
                      { value: 'GSN', label: 'GSN' },
                      { value: 'Logicad', label: 'Logicad' },
                      { value: 'META', label: 'META' },
                      { value: 'X', label: 'X' }
                    ]}
                    isEditing={isEditingThisRow && editingCell?.field === 'platform'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.account_name}
                    campaignId={campaign.id}
                    field="account_name"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'account_name'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.campaign_name}
                    campaignId={campaign.id}
                    field="campaign_name"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'campaign_name'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.copy_source}
                    campaignId={campaign.id}
                    field="copy_source"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'copy_source'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.start_date}
                    campaignId={campaign.id}
                    field="start_date"
                    type="date"
                    isEditing={isEditingThisRow && editingCell?.field === 'start_date'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.end_date}
                    campaignId={campaign.id}
                    field="end_date"
                    type="date"
                    isEditing={isEditingThisRow && editingCell?.field === 'end_date'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.delivery_time}
                    campaignId={campaign.id}
                    field="delivery_time"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'delivery_time'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.total_budget}
                    campaignId={campaign.id}
                    field="total_budget"
                    type="number"
                    isEditing={isEditingThisRow && editingCell?.field === 'total_budget'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                    displayValue={`¥${campaign.total_budget.toLocaleString()}`}
                  />
                  <EditableCell
                    value={campaign.set_total_budget}
                    campaignId={campaign.id}
                    field="set_total_budget"
                    type="number"
                    isEditing={isEditingThisRow && editingCell?.field === 'set_total_budget'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                    displayValue={`¥${campaign.set_total_budget.toLocaleString()}`}
                  />
                  <EditableCell
                    value={campaign.set_daily_budget}
                    campaignId={campaign.id}
                    field="set_daily_budget"
                    type="number"
                    isEditing={isEditingThisRow && editingCell?.field === 'set_daily_budget'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                    displayValue={`¥${campaign.set_daily_budget.toLocaleString()}`}
                  />
                  <EditableCell
                    value={campaign.delivery_days}
                    campaignId={campaign.id}
                    field="delivery_days"
                    type="number"
                    isEditing={isEditingThisRow && editingCell?.field === 'delivery_days'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                    displayValue={`${campaign.delivery_days}日`}
                  />
                  <EditableCell
                    value={campaign.ad_info_url}
                    campaignId={campaign.id}
                    field="ad_info_url"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'ad_info_url'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.target_area}
                    campaignId={campaign.id}
                    field="target_area"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'target_area'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.landing_page}
                    campaignId={campaign.id}
                    field="landing_page"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'landing_page'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.other_settings}
                    campaignId={campaign.id}
                    field="other_settings"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'other_settings'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.notes}
                    campaignId={campaign.id}
                    field="notes"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'notes'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.branch}
                    campaignId={campaign.id}
                    field="branch"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'branch'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <td
                    className="px-3 py-3 text-center cursor-pointer"
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setEditForm(campaign);
                      setProgressForm(campaign.progress || {});
                      setIsEditing(false);
                    }}
                  >
                    {campaign.stored ? (
                      <span className="text-green-600 font-medium text-lg">✓</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <EditableCell
                    value={campaign.person_in_charge}
                    campaignId={campaign.id}
                    field="person_in_charge"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'person_in_charge'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  {(isEditingThisRow && editingCell?.field === 'progress_status') ? (
                    <EditableCell
                      value={campaign.progress?.progress_status || 'waiting_submission'}
                      campaignId={campaign.id}
                      field="progress_status"
                      type="select"
                      options={progressStatuses.filter(s => s.value !== 'all').map(s => ({ value: s.value, label: s.label }))}
                      isEditing={true}
                      editingValue={editingValue}
                      onStartEdit={startEditingCell}
                      onValueChange={setEditingValue}
                      onSave={saveCellEdit}
                      onCancel={cancelEditingCell}
                    />
                  ) : (
                    <td
                      className="px-3 py-3 whitespace-nowrap cursor-pointer hover:bg-blue-50 transition-colors"
                      onDoubleClick={() => startEditingCell(campaign.id, 'progress_status', campaign.progress?.progress_status || 'waiting_submission')}
                      title="ダブルクリックで編集"
                    >
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.progress?.progress_status === 'completed' ? 'bg-green-100 text-green-800' :
                        campaign.progress?.progress_status === 'delivering' ? 'bg-blue-100 text-blue-800' :
                        campaign.progress?.progress_status === 'stopped' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {progressStatuses.find(s => s.value === campaign.progress?.progress_status)?.label || '入稿待ち'}
                      </span>
                    </td>
                  )}
                  <EditableCell
                    value={campaign.chk}
                    campaignId={campaign.id}
                    field="chk"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'chk'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.completion_chk}
                    campaignId={campaign.id}
                    field="completion_chk"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'completion_chk'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.memo}
                    campaignId={campaign.id}
                    field="memo"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'memo'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.before_start_completion_status}
                    campaignId={campaign.id}
                    field="before_start_completion_status"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'before_start_completion_status'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.before_start_completion_amount}
                    campaignId={campaign.id}
                    field="before_start_completion_amount"
                    type="number"
                    isEditing={isEditingThisRow && editingCell?.field === 'before_start_completion_amount'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.before_start_completion_target}
                    campaignId={campaign.id}
                    field="before_start_completion_target"
                    type="number"
                    isEditing={isEditingThisRow && editingCell?.field === 'before_start_completion_target'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.account}
                    campaignId={campaign.id}
                    field="account"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'account'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.account_termination}
                    campaignId={campaign.id}
                    field="account_termination"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'account_termination'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                  <EditableCell
                    value={campaign.account_day_forecast}
                    campaignId={campaign.id}
                    field="account_day_forecast"
                    type="text"
                    isEditing={isEditingThisRow && editingCell?.field === 'account_day_forecast'}
                    editingValue={editingValue}
                    onStartEdit={startEditingCell}
                    onValueChange={setEditingValue}
                    onSave={saveCellEdit}
                    onCancel={cancelEditingCell}
                  />
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        {filteredAndSortedCampaigns.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            キャンペーンが見つかりません
          </div>
        )}
      </div>
    </div>
  );
}
