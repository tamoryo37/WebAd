import { useState, useEffect } from 'react';
import { supabase, OperationHistory as OperationHistoryType } from '../lib/supabase';
import { Clock, Filter, FileText, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

export default function OperationHistory() {
  const [operations, setOperations] = useState<OperationHistoryType[]>([]);
  const [filterTable, setFilterTable] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedOperation, setSelectedOperation] = useState<OperationHistoryType | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    const { data, error } = await supabase
      .from('operation_history')
      .select('*')
      .order('operation_date', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Error fetching operations:', error);
      return;
    }
    setOperations(data || []);
  };

  const filteredOperations = operations.filter(op => {
    if (filterTable !== 'all' && op.table_name !== filterTable) return false;
    if (filterType !== 'all' && op.operation_type !== filterType) return false;
    return true;
  });

  const getOperationTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'insert': '新規作成',
      'update': '更新',
      'delete': '削除',
      'backup': 'バックアップ',
      'restore': '復元'
    };
    return labels[type] || type;
  };

  const getTableNameLabel = (name: string) => {
    const labels: { [key: string]: string } = {
      'stores': '店舗基本情報',
      'campaigns': 'キャンペーン',
      'campaign_progress': 'キャンペーン進捗',
      'budget_tracking': '予算追跡',
      'campaign_alerts': 'アラート',
      'monthly_dashboard': '月次ダッシュボード',
      'all_tables': '全テーブル'
    };
    return labels[name] || name;
  };

  const getOperationTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'insert': 'bg-green-100 text-green-800',
      'update': 'bg-blue-100 text-blue-800',
      'delete': 'bg-red-100 text-red-800',
      'backup': 'bg-purple-100 text-purple-800',
      'restore': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const canRestore = (operation: OperationHistoryType) => {
    return ['insert', 'update', 'delete'].includes(operation.operation_type) &&
           operation.operation_data &&
           operation.table_name !== 'all_tables';
  };

  const restoreOperation = async (operation: OperationHistoryType) => {
    if (!canRestore(operation)) {
      setMessage({ type: 'error', text: 'この操作は復元できません' });
      return;
    }

    const confirmMessage = `この操作を復元しますか？\n操作: ${getOperationTypeLabel(operation.operation_type)}\nテーブル: ${getTableNameLabel(operation.table_name)}`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsRestoring(true);
    setMessage(null);

    try {
      const data = operation.operation_data;

      if (operation.operation_type === 'delete') {
        const { error } = await supabase
          .from(operation.table_name)
          .insert([data]);

        if (error) throw error;
        setMessage({ type: 'success', text: '削除されたデータを復元しました' });
      } else if (operation.operation_type === 'insert') {
        if (!operation.record_id) {
          throw new Error('レコードIDが見つかりません');
        }

        const { error } = await supabase
          .from(operation.table_name)
          .delete()
          .eq('id', operation.record_id);

        if (error) throw error;
        setMessage({ type: 'success', text: '追加されたデータを削除しました' });
      } else if (operation.operation_type === 'update') {
        if (!operation.record_id) {
          throw new Error('レコードIDが見つかりません');
        }

        const previousData: any = {};
        Object.keys(data).forEach(key => {
          if (key.startsWith('previous_')) {
            const originalKey = key.replace('previous_', '');
            previousData[originalKey] = data[key];
          }
        });

        if (Object.keys(previousData).length === 0) {
          throw new Error('以前の値が見つかりません');
        }

        const { error } = await supabase
          .from(operation.table_name)
          .update(previousData)
          .eq('id', operation.record_id);

        if (error) throw error;
        setMessage({ type: 'success', text: '以前の値に復元しました' });
      }

      await supabase.from('operation_history').insert([{
        operation_type: 'restore',
        table_name: operation.table_name,
        record_id: operation.record_id,
        operation_data: {
          restored_from: operation.id,
          original_operation: operation.operation_type,
          original_date: operation.operation_date
        }
      }]);

      setTimeout(() => {
        fetchOperations();
      }, 1000);
    } catch (error) {
      console.error('Error restoring operation:', error);
      setMessage({ type: 'error', text: '復元に失敗しました: ' + (error as Error).message });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">操作履歴</h1>
        <button
          onClick={fetchOperations}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Clock size={18} />
          更新
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">すべてのテーブル</option>
            <option value="stores">店舗基本情報</option>
            <option value="campaigns">キャンペーン</option>
            <option value="campaign_progress">キャンペーン進捗</option>
            <option value="budget_tracking">予算追跡</option>
            <option value="campaign_alerts">アラート</option>
            <option value="monthly_dashboard">月次ダッシュボード</option>
            <option value="all_tables">バックアップ/復元</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">すべての操作</option>
            <option value="insert">新規作成</option>
            <option value="update">更新</option>
            <option value="delete">削除</option>
            <option value="backup">バックアップ</option>
            <option value="restore">復元</option>
          </select>
          <div className="text-sm text-gray-600">
            {filteredOperations.length}件の操作
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    日時
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    テーブル
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOperations.map((op) => (
                  <tr
                    key={op.id}
                    onClick={() => setSelectedOperation(op)}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedOperation?.id === op.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {new Date(op.operation_date).toLocaleString('ja-JP', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getOperationTypeColor(op.operation_type)}`}>
                        {getOperationTypeLabel(op.operation_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {getTableNameLabel(op.table_name)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOperations.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                操作履歴がありません
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">操作詳細</h2>
            </div>
            {selectedOperation && canRestore(selectedOperation) && (
              <button
                onClick={() => restoreOperation(selectedOperation)}
                disabled={isRestoring}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400"
              >
                <RotateCcw size={16} />
                {isRestoring ? '復元中...' : 'この操作を復元'}
              </button>
            )}
          </div>
          {selectedOperation ? (
            <div className="space-y-4">
              {canRestore(selectedOperation) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <div className="font-medium mb-1">復元可能な操作</div>
                  <div className="text-xs">
                    {selectedOperation.operation_type === 'delete' && '削除されたデータを復元できます'}
                    {selectedOperation.operation_type === 'insert' && '追加されたデータを削除できます'}
                    {selectedOperation.operation_type === 'update' && '更新前の値に戻すことができます'}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">日時</label>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(selectedOperation.operation_date).toLocaleString('ja-JP')}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">操作タイプ</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 text-sm font-medium rounded ${getOperationTypeColor(selectedOperation.operation_type)}`}>
                    {getOperationTypeLabel(selectedOperation.operation_type)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">対象テーブル</label>
                <div className="mt-1 text-sm text-gray-900">
                  {getTableNameLabel(selectedOperation.table_name)}
                </div>
              </div>
              {selectedOperation.record_id && (
                <div>
                  <label className="text-sm font-medium text-gray-600">レコードID</label>
                  <div className="mt-1 text-sm text-gray-900 font-mono">
                    {selectedOperation.record_id}
                  </div>
                </div>
              )}

              {selectedOperation.operation_type === 'update' && selectedOperation.operation_data && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">変更内容</label>
                  <div className="space-y-2">
                    {Object.keys(selectedOperation.operation_data).map((key) => {
                      if (key.startsWith('previous_')) {
                        const fieldName = key.replace('previous_', '');
                        const oldValue = selectedOperation.operation_data[key];
                        const newValue = selectedOperation.operation_data[fieldName];

                        if (newValue !== undefined) {
                          return (
                            <div key={key} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                              <div className="text-xs font-medium text-gray-700 mb-1">{fieldName}</div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">変更前</div>
                                  <div className="bg-red-100 px-2 py-1 rounded text-red-800 font-mono text-xs">
                                    {oldValue === null ? 'null' : oldValue === '' ? '(空)' : String(oldValue)}
                                  </div>
                                </div>
                                <div className="text-gray-400">→</div>
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">変更後</div>
                                  <div className="bg-green-100 px-2 py-1 rounded text-green-800 font-mono text-xs">
                                    {newValue === null ? 'null' : newValue === '' ? '(空)' : String(newValue)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {selectedOperation.operation_type === 'insert' && selectedOperation.operation_data && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">追加されたデータ</label>
                  <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                    {Object.entries(selectedOperation.operation_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded">
                          {value === null ? 'null' : value === '' ? '(空)' : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOperation.operation_type === 'delete' && selectedOperation.operation_data && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">削除されたデータ</label>
                  <div className="bg-red-50 border border-red-200 rounded p-3 space-y-2">
                    {Object.entries(selectedOperation.operation_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded">
                          {value === null ? 'null' : value === '' ? '(空)' : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {['backup', 'restore'].includes(selectedOperation.operation_type) && selectedOperation.operation_data && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">詳細情報</label>
                  <div className="bg-purple-50 border border-purple-200 rounded p-3 space-y-2">
                    {Object.entries(selectedOperation.operation_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">生データ（JSON）</label>
                <div className="mt-1 bg-gray-50 rounded p-3 text-xs text-gray-900 font-mono overflow-x-auto max-h-96 overflow-y-auto">
                  <pre>{JSON.stringify(selectedOperation.operation_data, null, 2)}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              左の一覧から操作を選択してください
            </div>
          )}
        </div>
      </div>
    </div>
  );
}