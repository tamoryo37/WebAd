import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import GanttChart from './GanttChart';
import { Store, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface Campaign {
  id: string;
  campaign_name: string;
  store_id: string;
  start_date: string;
  end_date: string;
  person_in_charge: string;
  media: string;
  set_total_budget: number;
  progress?: {
    creative_status: string;
    progress_status: string;
  };
  budget?: {
    consumed_amount: number;
  }[];
}

interface StoreData {
  id: string;
  store_name: string;
  campaigns: Campaign[];
}

export default function CampaignProgress() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const monthStart = new Date(selectedMonth + '-01');
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      const { data: storesData } = await supabase
        .from('stores')
        .select('*')
        .order('store_name');

      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .gte('start_date', monthStart.toISOString().split('T')[0])
        .lte('start_date', monthEnd.toISOString().split('T')[0]);

      const { data: progressData } = await supabase
        .from('campaign_progress')
        .select('*');

      const { data: budgetData } = await supabase
        .from('budget_tracking')
        .select('*');

      if (!storesData || !campaignsData) return;

      const storesWithCampaigns: StoreData[] = storesData
        .map(store => {
          const storeCampaigns = campaignsData
            .filter(c => c.store_id === store.id)
            .map(campaign => {
              const progress = progressData?.find(p => p.campaign_id === campaign.id);
              const budget = budgetData?.filter(b => b.campaign_id === campaign.id) || [];

              return {
                ...campaign,
                progress,
                budget
              };
            });

          return {
            id: store.id,
            store_name: store.store_name,
            campaigns: storeCampaigns
          };
        })
        .filter(s => s.campaigns.length > 0);

      setStores(storesWithCampaigns);

      const allStoreIds = new Set(storesWithCampaigns.map(s => s.id));
      setExpandedStores(allStoreIds);
    } catch (error) {
      console.error('Error fetching campaign progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStore = (storeId: string) => {
    setExpandedStores(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storeId)) {
        newSet.delete(storeId);
      } else {
        newSet.add(storeId);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (expandedStores.size === stores.length) {
      setExpandedStores(new Set());
    } else {
      setExpandedStores(new Set(stores.map(s => s.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">キャンペーン進捗</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {expandedStores.size === stores.length ? '全て閉じる' : '全て開く'}
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        {stores.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">選択した月にキャンペーンがありません</p>
          </div>
        ) : (
          stores.map((store) => {
            const isExpanded = expandedStores.has(store.id);

            return (
              <div
                key={store.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleStore(store.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{store.store_name}</h3>
                    <span className="text-sm text-gray-500">
                      ({store.campaigns.length}件のキャンペーン)
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <GanttChart campaigns={store.campaigns} month={selectedMonth} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">キャンペーン進捗について</p>
              <ul className="space-y-1 text-blue-800">
                <li>• 店舗ごとにキャンペーンのガントチャートを表示します</li>
                <li>• クリックで展開・折りたたみができます</li>
                <li>• 月を変更してキャンペーンスケジュールを確認できます</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
