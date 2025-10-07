import { useState, useEffect } from 'react';
import { supabase, Campaign, BudgetTracking, Store } from '../lib/supabase';
import { TrendingDown, Calendar, DollarSign } from 'lucide-react';

type UnderDeliveryData = {
  campaign: Campaign & { store?: Store };
  latestTracking?: BudgetTracking;
  underDeliveryAmount: number;
  underDeliveryRate: number;
};

type UnderDeliveryTrackingProps = {
  onSelectCampaign?: (campaignId: string) => void;
};

export default function UnderDeliveryTracking({ onSelectCampaign }: UnderDeliveryTrackingProps = {}) {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [underDeliveryData, setUnderDeliveryData] = useState<UnderDeliveryData[]>([]);
  const [groupedByStore, setGroupedByStore] = useState<Map<string, UnderDeliveryData[]>>(new Map());
  const [totalStats, setTotalStats] = useState({
    totalBudget: 0,
    totalUnderDelivery: 0,
    totalRate: 0,
    stoppedBudget: 0
  });

  useEffect(() => {
    fetchUnderDeliveryData();
  }, [selectedMonth]);

  const fetchUnderDeliveryData = async () => {
    const monthStart = new Date(selectedMonth + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .lte('start_date', monthEnd.toISOString().split('T')[0])
      .gte('end_date', monthStart.toISOString().split('T')[0]);

    const { data: stores } = await supabase
      .from('stores')
      .select('*');

    const { data: budgetTracking } = await supabase
      .from('budget_tracking')
      .select('*');

    const { data: progress } = await supabase
      .from('campaign_progress')
      .select('*');

    if (!campaigns) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const underDeliveryList: UnderDeliveryData[] = campaigns
      .map(campaign => {
        const campaignTracking = budgetTracking?.filter(b => b.campaign_id === campaign.id) || [];
        const latestTracking = campaignTracking.reduce((latest, current) => {
          if (!latest) return current;
          return new Date(current.tracking_date) > new Date(latest.tracking_date) ? current : latest;
        }, campaignTracking[0]);

        const campaignProgress = progress?.find(p => p.campaign_id === campaign.id);
        const store = stores?.find(s => s.id === campaign.store_id);

        const totalBudget = latestTracking?.allocated_total_budget || campaign.set_total_budget || 0;
        const consumedAmount = latestTracking?.consumed_amount || 0;
        const underDeliveryAmount = totalBudget - consumedAmount;
        const underDeliveryRate = totalBudget > 0
          ? (underDeliveryAmount / totalBudget) * 100
          : 0;

        return {
          campaign: { ...campaign, store },
          latestTracking,
          underDeliveryAmount,
          underDeliveryRate,
          status: campaignProgress?.progress_status
        };
      })
      .filter(data => {
        if (data.status === 'stopped') return true;
        return data.underDeliveryAmount > 0 && data.underDeliveryRate >= 10;
      });

    setUnderDeliveryData(underDeliveryList);

    const grouped = new Map<string, UnderDeliveryData[]>();
    underDeliveryList.forEach(data => {
      const storeName = data.campaign.store?.store_name || '未設定';
      if (!grouped.has(storeName)) {
        grouped.set(storeName, []);
      }
      grouped.get(storeName)!.push(data);
    });
    setGroupedByStore(grouped);

    const totalBudget = underDeliveryList
      .filter(d => d.status !== 'stopped')
      .reduce((sum, d) => sum + d.campaign.set_total_budget, 0);

    const totalUnderDelivery = underDeliveryList
      .filter(d => d.status !== 'stopped')
      .reduce((sum, d) => sum + d.underDeliveryAmount, 0);

    const stoppedBudget = underDeliveryList
      .filter(d => d.status === 'stopped')
      .reduce((sum, d) => sum + d.campaign.set_total_budget, 0);

    setTotalStats({
      totalBudget,
      totalUnderDelivery,
      totalRate: totalBudget > 0 ? (totalUnderDelivery / totalBudget) * 100 : 0,
      stoppedBudget
    });
  };

  const getUnderDeliveryColor = (rate: number) => {
    if (rate === 0) return 'text-gray-500';
    if (rate < 3) return 'text-yellow-600';
    if (rate < 5) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">未消化管理</h1>
        <div className="flex items-center gap-4">
          <Calendar size={20} className="text-gray-600" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">設定予算合計</h3>
            <DollarSign size={20} className="opacity-80" />
          </div>
          <p className="text-2xl font-bold">¥{totalStats.totalBudget.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">未消化合計</h3>
            <TrendingDown size={20} className="opacity-80" />
          </div>
          <p className="text-2xl font-bold">¥{totalStats.totalUnderDelivery.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">未消化率</h3>
            <TrendingDown size={20} className="opacity-80" />
          </div>
          <p className="text-2xl font-bold">{totalStats.totalRate.toFixed(2)}%</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">停止/中止予算</h3>
            <TrendingDown size={20} className="opacity-80" />
          </div>
          <p className="text-2xl font-bold">¥{totalStats.stoppedBudget.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-6">
        {Array.from(groupedByStore.entries()).map(([storeName, storeData]) => {
          const storeTotalBudget = storeData
            .filter(d => d.status !== 'stopped')
            .reduce((sum, d) => sum + d.campaign.set_total_budget, 0);

          const storeTotalUnderDelivery = storeData
            .filter(d => d.status !== 'stopped')
            .reduce((sum, d) => sum + d.underDeliveryAmount, 0);

          const storeRate = storeTotalBudget > 0
            ? (storeTotalUnderDelivery / storeTotalBudget) * 100
            : 0;

          return (
            <div key={storeName} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">{storeName}</h3>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">設定予算: </span>
                      <span className="font-semibold">¥{storeTotalBudget.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">未消化: </span>
                      <span className={`font-semibold ${getUnderDeliveryColor(storeRate)}`}>
                        ¥{storeTotalUnderDelivery.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">未消化率: </span>
                      <span className={`font-semibold ${getUnderDeliveryColor(storeRate)}`}>
                        {storeRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">NO.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">媒体</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">CP名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">配信期間</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">設定総予算</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">消化額<br/>(前日まで)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">未消化<br/>(前日まで)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">割合</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">進捗</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {storeData.map((data) => (
                      <tr
                        key={data.campaign.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onSelectCampaign?.(data.campaign.id)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">{data.campaign.campaign_number}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{data.campaign.platform}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{data.campaign.campaign_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {data.campaign.start_date} - {data.campaign.end_date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ¥{data.campaign.set_total_budget.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ¥{(data.latestTracking?.consumed_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${getUnderDeliveryColor(data.underDeliveryRate)}`}>
                            ¥{data.underDeliveryAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${getUnderDeliveryColor(data.underDeliveryRate)}`}>
                            {data.underDeliveryRate.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            data.status === 'completed' ? 'bg-green-100 text-green-800' :
                            data.status === 'delivering' ? 'bg-blue-100 text-blue-800' :
                            data.status === 'stopped' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {data.status === 'stopped' ? '停止/中止' :
                             data.status === 'completed' ? '完了' :
                             data.status === 'delivering' ? '配信中' : '入稿待ち'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {underDeliveryData.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <TrendingDown size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">未消化データがありません</h3>
          <p className="text-gray-500">選択された月の未消化キャンペーンはありません</p>
        </div>
      )}
    </div>
  );
}
