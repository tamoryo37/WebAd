import { LayoutGrid, Table as TableIcon, BarChart3 } from 'lucide-react';

export type ViewType = 'overview' | 'table' | 'gantt';

type ViewTabsProps = {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
};

export default function ViewTabs({ activeView, onViewChange }: ViewTabsProps) {
  const tabs = [
    { id: 'overview' as ViewType, label: '概要', icon: LayoutGrid },
    { id: 'table' as ViewType, label: 'テーブル', icon: TableIcon },
    { id: 'gantt' as ViewType, label: 'ガントチャート', icon: BarChart3 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
