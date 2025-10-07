import { useState, useEffect } from 'react';
import { supabase, Campaign, CampaignProgress, Store, BudgetTracking, StoreMonthlyDocument } from '../lib/supabase';
import { CheckCircle, XCircle, Search } from 'lucide-react';
import AlertSection from './AlertSection';
import KPISummary from './KPISummary';

type DashboardData = {
  store: Store;
  campaignCount: number;
  totalBudget: number;
  consumedBudget: number;
  progressRate: number;
  campaigns: (Campaign & { progress?: CampaignProgress; budget?: BudgetTracking[] })[];
  collectionPending: number;
  order4DaysPending: number;
  order7DaysPending: number;
  unsavedCount: number;
  incompleteCount: number;
  hasQuote: boolean;
  hasProposal: boolean;
  hasReport: boolean;
  quoteUrl?: string;
  proposalUrl?: string;
  reportUrl?: string;
};

type Alert = {
  id: string;
  storeName: string;
  severity: 'urgent' | 'warning';
  message: string;
  count: number;
  daysLeft: number;
  storeId: string;
};

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const [selectedPersonInCharge, setSelectedPersonInCharge] = useState<string>('all');
  const [personInChargeList, setPersonInChargeList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedPersonInCharge]);

  useEffect(() => {
    fetchPersonInChargeList();
  }, []);

  const fetchPersonInChargeList = async () => {
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('person_in_charge');

    if (!campaigns) return;

    const uniquePersons = Array.from(
      new Set(campaigns.map(c => c.person_in_charge).filter(p => p && p.trim() !== ''))
    ).sort() as string[];

    setPersonInChargeList(uniquePersons);
  };

  const fetchDashboardData = async () => {
    const monthStart = new Date(selectedMonth + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    const { data: stores } = await supabase
      .from('stores')
      .select('*')
      .order('store_name');

    let campaignsQuery = supabase
      .from('campaigns')
      .select('*')
      .gte('start_date', monthStart.toISOString().split('T')[0])
      .lte('start_date', monthEnd.toISOString().split('T')[0]);

    if (selectedPersonInCharge !== 'all') {
      campaignsQuery = campaignsQuery.eq('person_in_charge', selectedPersonInCharge);
    }

    const { data: campaigns } = await campaignsQuery;

    const { data: progress } = await supabase
      .from('campaign_progress')
      .select('*');

    const { data: budgetTracking } = await supabase
      .from('budget_tracking')
      .select('*');

    const { data: monthlyDocuments } = await supabase
      .from('store_monthly_documents')
      .select('*')
      .eq('year_month', selectedMonth);

    if (!stores || !campaigns) return;

    const today = new Date();
    const data: DashboardData[] = stores.map(store => {
      const storeCampaigns = campaigns.filter(c => c.store_id === store.id);

      const enrichedCampaigns = storeCampaigns.map(campaign => ({
        ...campaign,
        progress: progress?.find(p => p.campaign_id === campaign.id),
        budget: budgetTracking?.filter(b => b.campaign_id === campaign.id) || []
      }));

      const totalBudget = storeCampaigns.reduce((sum, c) => sum + c.set_total_budget, 0);

      const consumedBudget = enrichedCampaigns.reduce((sum, c) => {
        const latestBudget = c.budget?.reduce((latest, b) => {
          return new Date(b.tracking_date) > new Date(latest.tracking_date) ? b : latest;
        }, c.budget[0]);
        return sum + (latestBudget?.consumed_amount || 0);
      }, 0);

      const progressRate = totalBudget > 0 ? (consumedBudget / totalBudget) * 100 : 0;

      const collectionPending = enrichedCampaigns.filter(c =>
        c.progress?.creative_status === 'ordered' &&
        new Date(c.start_date) <= new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)
      ).length;

      const order4DaysPending = enrichedCampaigns.filter(c =>
        c.progress?.creative_status === 'pending' &&
        new Date(c.start_date) <= new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)
      ).length;

      const order7DaysPending = enrichedCampaigns.filter(c =>
        c.progress?.creative_status === 'pending' &&
        new Date(c.start_date) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) &&
        new Date(c.start_date) > new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)
      ).length;

      const unsavedCount = enrichedCampaigns.filter(c => !c.stored).length;
      const incompleteCount = enrichedCampaigns.filter(c =>
        c.progress?.progress_status !== 'completed'
      ).length;

      const monthDoc = monthlyDocuments?.find(d => d.store_id === store.id);

      return {
        store,
        campaignCount: storeCampaigns.length,
        totalBudget,
        consumedBudget,
        progressRate,
        campaigns: enrichedCampaigns,
        collectionPending,
        order4DaysPending,
        order7DaysPending,
        unsavedCount,
        incompleteCount,
        hasQuote: !!(monthDoc?.quote_url && monthDoc.quote_url.trim()),
        hasProposal: !!(monthDoc?.proposal_url && monthDoc.proposal_url.trim()),
        hasReport: !!(monthDoc?.report_url && monthDoc.report_url.trim()),
        quoteUrl: monthDoc?.quote_url,
        proposalUrl: monthDoc?.proposal_url,
        reportUrl: monthDoc?.report_url
      };
    }).filter(d => d.campaignCount > 0);

    setDashboardData(data);
  };

  const generateAlerts = (): Alert[] => {
    const alerts: Alert[] = [];

    dashboardData.forEach(data => {
      const urgentCount = data.collectionPending + data.order4DaysPending;
      const warningCount = data.order7DaysPending;

      if (urgentCount > 0) {
        alerts.push({
          id: `${data.store.id}-urgent`,
          storeName: data.store.store_name,
          severity: 'urgent',
          message: '回収期限・発注期限まであと4日以内',
          count: urgentCount,
          daysLeft: 2,
          storeId: data.store.id
        });
      }

      if (warningCount > 0) {
        alerts.push({
          id: `${data.store.id}-warning`,
          storeName: data.store.store_name,
          severity: 'warning',
          message: '発注期限まであと7日以内',
          count: warningCount,
          daysLeft: 5,
          storeId: data.store.id
        });
      }
    });

    return alerts.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'urgent' ? -1 : 1;
      }
      return a.daysLeft - b.daysLeft;
    });
  };

  const generateKPIs = () => {
    const totalCampaigns = dashboardData.reduce((sum, d) => sum + d.campaignCount, 0);
    const totalBudget = dashboardData.reduce((sum, d) => sum + d.totalBudget, 0);
    const totalConsumed = dashboardData.reduce((sum, d) => sum + d.consumedBudget, 0);
    const consumptionRate = totalBudget > 0 ? (totalConsumed / totalBudget) * 100 : 0;
    const totalAlerts = generateAlerts().length;

    return [
      {
        label: '総キャンペーン数',
        value: `${totalCampaigns}件`,
        trend: 12,
        trendLabel: '前月比',
        color: 'blue' as const
      },
      {
        label: '総予算',
        value: `¥${(totalBudget / 1000000).toFixed(1)}M`,
        trend: 8,
        trendLabel: '前月比',
        color: 'green' as const
      },
      {
        label: '予算消化率',
        value: `${consumptionRate.toFixed(1)}%`,
        trend: 5,
        trendLabel: '前月比',
        color: 'orange' as const
      },
      {
        label: '要対応件数',
        value: `${totalAlerts}件`,
        trend: -20,
        trendLabel: '前月比',
        color: 'red' as const
      }
    ];
  };

  const filteredData = dashboardData.filter(data =>
    data.store.store_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedPersonInCharge}
                onChange={(e) => setSelectedPersonInCharge(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全担当者</option>
                {personInChargeList.map(person => (
                  <option key={person} value={person}>{person}</option>
                ))}
              </select>
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

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <AlertSection alerts={generateAlerts()} onStoreClick={() => {}} />

        <KPISummary kpis={generateKPIs()} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">店舗一覧</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="店舗名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">店舗名</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">CP数</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">総予算</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">消化額</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">進捗率</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">回収</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">発注</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">未完</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">見積</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">提案</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">報告</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((data) => (
                  <tr key={data.store.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{data.store.store_name}</td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">{data.campaignCount}件</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">¥{(data.totalBudget / 1000000).toFixed(1)}M</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">¥{(data.consumedBudget / 1000000).toFixed(1)}M</td>
                    <td className="px-4 py-2 text-sm text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {data.progressRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">{data.collectionPending}</td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">{data.order4DaysPending + data.order7DaysPending}</td>
                    <td className="px-4 py-2 text-sm text-center text-gray-900">{data.incompleteCount}</td>
                    <td className="px-4 py-2 text-center">
                      {data.hasQuote ? (
                        data.quoteUrl ? (
                          <a href={data.quoteUrl} target="_blank" rel="noopener noreferrer">
                            <CheckCircle className="w-4 h-4 text-green-600 inline-block hover:text-green-700" />
                          </a>
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600 inline-block" />
                        )
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {data.hasProposal ? (
                        data.proposalUrl ? (
                          <a href={data.proposalUrl} target="_blank" rel="noopener noreferrer">
                            <CheckCircle className="w-4 h-4 text-green-600 inline-block hover:text-green-700" />
                          </a>
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600 inline-block" />
                        )
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {data.hasReport ? (
                        data.reportUrl ? (
                          <a href={data.reportUrl} target="_blank" rel="noopener noreferrer">
                            <CheckCircle className="w-4 h-4 text-green-600 inline-block hover:text-green-700" />
                          </a>
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600 inline-block" />
                        )
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 inline-block" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredData.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>検索条件に一致する店舗が見つかりません</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
