import { AlertCircle } from 'lucide-react';

type Alert = {
  id: string;
  storeName: string;
  severity: 'urgent' | 'warning';
  message: string;
  count: number;
  daysLeft: number;
  storeId: string;
};

type AlertSectionProps = {
  alerts: Alert[];
  onStoreClick: (storeId: string) => void;
};

export default function AlertSection({ alerts, onStoreClick }: AlertSectionProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">要対応アラート</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {alerts.length}件
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            onClick={() => onStoreClick(alert.storeId)}
            className={`w-full flex items-center justify-between p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
              alert.severity === 'urgent'
                ? 'bg-red-50 border-red-500 hover:bg-red-100'
                : 'bg-orange-50 border-orange-500 hover:bg-orange-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  alert.severity === 'urgent' ? 'bg-red-100' : 'bg-orange-100'
                }`}
              >
                <span
                  className={`text-sm font-bold ${
                    alert.severity === 'urgent' ? 'text-red-700' : 'text-orange-700'
                  }`}
                >
                  {alert.daysLeft}日
                </span>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">{alert.storeName}</div>
                <div className="text-sm text-gray-600">{alert.message}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  alert.severity === 'urgent'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {alert.count}件
              </span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
