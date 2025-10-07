import { Campaign, CampaignProgress } from '../lib/supabase';

type GanttChartProps = {
  campaigns: (Campaign & { progress?: CampaignProgress })[];
  month: string;
};

export default function GanttChart({ campaigns, month }: GanttChartProps) {
  const monthStart = new Date(month + '-01');
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const today = new Date();

  const getProgressColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'delivering':
        return 'bg-blue-500';
      case 'stopped':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const calculatePosition = (date: string, isEnd: boolean = false) => {
    const targetDate = new Date(date);
    const dayOfMonth = targetDate.getDate();

    if (targetDate < monthStart) return 0;
    if (targetDate > monthEnd) return 100;

    const position = ((dayOfMonth - (isEnd ? 0 : 1)) / daysInMonth) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const calculateWidth = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const effectiveStart = start < monthStart ? monthStart : start;
    const effectiveEnd = end > monthEnd ? monthEnd : end;

    if (effectiveStart > monthEnd || effectiveEnd < monthStart) return 0;

    const startDay = effectiveStart.getDate();
    const endDay = effectiveEnd.getDate();
    const duration = endDay - startDay + 1;

    return (duration / daysInMonth) * 100;
  };

  const getTodayPosition = () => {
    if (today < monthStart || today > monthEnd) return null;
    return ((today.getDate() - 1) / daysInMonth) * 100;
  };

  const todayPosition = getTodayPosition();

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1);
    return {
      day: i + 1,
      weekDay: weekDays[date.getDay()],
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">キャンペーン進捗（ガントチャート）</h2>

      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          <div className="flex border-b-2 border-gray-300 mb-4">
            <div className="w-64 flex-shrink-0 pr-4">
              <div className="font-semibold text-sm text-gray-700 pb-2">キャンペーン</div>
            </div>
            <div className="flex-1">
              <div className="flex">
                {days.map((d) => (
                  <div
                    key={d.day}
                    className={`flex-1 text-center text-xs pb-2 ${
                      d.isWeekend ? 'text-red-500' : 'text-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{d.day}</div>
                    <div className="text-[10px]">{d.weekDay}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                選択された月のキャンペーンはありません
              </div>
            ) : (
              campaigns.map((campaign) => {
                const startPos = calculatePosition(campaign.start_date);
                const width = calculateWidth(campaign.start_date, campaign.end_date);

                return (
                  <div key={campaign.id} className="flex items-center">
                    <div className="w-64 flex-shrink-0 pr-4">
                      <div className="text-sm font-medium text-gray-900 truncate" title={campaign.campaign_name}>
                        {campaign.campaign_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {campaign.platform} | {campaign.start_date} - {campaign.end_date}
                      </div>
                    </div>
                    <div className="flex-1 relative h-10">
                      <div className="absolute inset-0 flex items-center">
                        {days.map((d, i) => (
                          <div
                            key={i}
                            className={`flex-1 h-full border-r border-gray-200 ${
                              d.isWeekend ? 'bg-gray-50' : ''
                            }`}
                          />
                        ))}
                      </div>

                      {width > 0 && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-8 rounded flex items-center justify-center text-white text-xs font-medium shadow-sm"
                          style={{
                            left: `${startPos}%`,
                            width: `${width}%`
                          }}
                        >
                          <div className={`w-full h-full rounded ${getProgressColor(campaign.progress?.progress_status)}`} />
                        </div>
                      )}

                      {todayPosition !== null && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                          style={{ left: `${todayPosition}%` }}
                        >
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded" />
              <span className="text-gray-700">入稿待ち</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="text-gray-700">配信中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-gray-700">完了</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span className="text-gray-700">停止</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-red-500" />
              <span className="text-gray-700">今日</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
