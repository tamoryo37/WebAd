import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Calendar, Filter } from 'lucide-react';

type AdOperationData = {
  user_id: string;
  user_name: string;
  campaign_id: string;
  campaign_name: string;
  account_name: string;
  start_date: string;
  end_date: string;
  undelivered_budget: number;
  total_budget: number;
  progress_status: string;
};

type AdOperationsManagementProps = {
  onSelectCampaign?: (campaignId: string) => void;
};

export default function AdOperationsManagement({ onSelectCampaign }: AdOperationsManagementProps) {
  const [operations, setOperations] = useState<AdOperationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statusOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'waiting_submission', label: '入稿待ち' },
    { value: 'waiting_check', label: 'CHK待ち' },
    { value: 'waiting_delivery', label: '配信待ち' },
    { value: 'delivering', label: '配信中' },
    { value: 'completed', label: '完了' },
    { value: 'same_day', label: '当日対応' },
    { value: 'review_required', label: '再審査/要修正' },
    { value: 'stopped', label: '停止/中止' },
  ];

  useEffect(() => {
    fetchOperations();
  }, [selectedMonth]);

  const fetchOperations = async () => {
    try {
      setLoading(true);

      const [year, month] = selectedMonth.split('-');
      const startOfMonth = `${year}-${month}-01`;
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endOfMonthStr = `${year}-${month}-${endOfMonth}`;

      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          campaign_name,
          account_name,
          start_date,
          end_date,
          person_in_charge,
          total_budget,
          budget_tracking(
            consumed_amount,
            allocated_total_budget
          ),
          campaign_progress(
            progress_status
          )
        `)
        .gte('end_date', startOfMonth)
        .lte('start_date', endOfMonthStr);

      if (error) throw error;

      const operationsData: AdOperationData[] = [];

      campaigns?.forEach((campaign: any) => {
        const personEmail = campaign.person_in_charge || '未割当';
        const budgetData = campaign.budget_tracking?.[0];
        const totalBudget = campaign.total_budget || budgetData?.allocated_total_budget || 0;
        const consumedBudget = budgetData?.consumed_amount || 0;
        const undeliveredBudget = totalBudget - consumedBudget;
        const progressStatus = campaign.campaign_progress?.[0]?.progress_status || 'pending';

        if (totalBudget > 0) {
          operationsData.push({
            user_id: personEmail,
            user_name: personEmail.includes('@') ? personEmail.split('@')[0] : personEmail,
            campaign_id: campaign.id,
            campaign_name: campaign.campaign_name,
            account_name: campaign.account_name,
            start_date: campaign.start_date,
            end_date: campaign.end_date,
            undelivered_budget: undeliveredBudget,
            total_budget: totalBudget,
            progress_status: progressStatus,
          });
        }
      });

      operationsData.sort((a, b) => a.user_name.localeCompare(b.user_name));

      setOperations(operationsData);
    } catch (error) {
      console.error('Error fetching operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOperations = statusFilter === 'all'
    ? operations
    : operations.filter(op => op.progress_status === statusFilter);

  const groupedOperations = filteredOperations.reduce((acc, op) => {
    if (!acc[op.user_name]) {
      acc[op.user_name] = [];
    }
    acc[op.user_name].push(op);
    return acc;
  }, {} as Record<string, AdOperationData[]>);

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'delivering': return 'bg-blue-100 text-blue-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      case 'waiting_submission': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_check': return 'bg-orange-100 text-orange-800';
      case 'waiting_delivery': return 'bg-cyan-100 text-cyan-800';
      case 'same_day': return 'bg-purple-100 text-purple-800';
      case 'review_required': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">広告運用管理</h1>
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {Object.entries(groupedOperations).map(([userName, userOps]) => {
            const totalUndelivered = userOps.reduce((sum, op) => sum + op.undelivered_budget, 0);

            return (
              <div key={userName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{userName}</h3>
                        <p className="text-sm text-gray-600">{userOps.length}件のキャンペーン</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">未消化合計</div>
                      <div className="text-lg font-bold text-red-600">
                        ¥{(totalUndelivered / 1000000).toFixed(2)}M
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          アカウント
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          キャンペーン
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          開始日
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          終了日
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          未消化
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          進捗率
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {userOps.map((op, idx) => {
                        const progressRate = op.total_budget > 0
                          ? ((op.total_budget - op.undelivered_budget) / op.total_budget) * 100
                          : 0;

                        return (
                          <tr
                            key={`${op.campaign_id}-${idx}`}
                            onClick={() => onSelectCampaign?.(op.campaign_id)}
                            className="hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {op.account_name}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-blue-600">
                              {op.campaign_name}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(op.progress_status)}`}>
                                {getStatusLabel(op.progress_status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(op.start_date).toLocaleDateString('ja-JP')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(op.end_date).toLocaleDateString('ja-JP')}
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              <span className={`font-semibold ${
                                op.undelivered_budget > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                ¥{(op.undelivered_budget / 1000000).toFixed(2)}M
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-full rounded-full ${
                                      progressRate >= 90 ? 'bg-green-500' :
                                      progressRate >= 70 ? 'bg-blue-500' :
                                      progressRate >= 50 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(progressRate, 100)}%` }}
                                  />
                                </div>
                                <span className="font-semibold text-gray-900 w-12">
                                  {progressRate.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {Object.keys(groupedOperations).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>選択された期間に該当するデータがありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
