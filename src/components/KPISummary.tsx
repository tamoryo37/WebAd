import { TrendingUp, TrendingDown } from 'lucide-react';

type KPICard = {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  color: 'blue' | 'green' | 'orange' | 'red';
};

type KPISummaryProps = {
  kpis: KPICard[];
};

export default function KPISummary({ kpis }: KPISummaryProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200';
      case 'green':
        return 'bg-green-50 border-green-200';
      case 'orange':
        return 'bg-orange-50 border-orange-200';
      case 'red':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-900';
      case 'green':
        return 'text-green-900';
      case 'orange':
        return 'text-orange-900';
      case 'red':
        return 'text-red-900';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className={`rounded-xl border p-6 ${getColorClasses(kpi.color)}`}
        >
          <div className="text-sm font-medium text-gray-600 mb-2">{kpi.label}</div>
          <div className={`text-3xl font-bold mb-2 ${getTextColorClasses(kpi.color)}`}>
            {kpi.value}
          </div>
          <div className="flex items-center gap-1">
            {kpi.trend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${
                kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {kpi.trend >= 0 ? '+' : ''}
              {kpi.trend}%
            </span>
            <span className="text-sm text-gray-500 ml-1">{kpi.trendLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
