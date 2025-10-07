import { useState, useEffect } from 'react';
import { supabase, Store } from '../lib/supabase';
import { Search, Plus, CreditCard as Edit2, Save, X, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';
import MonthlyDocuments from './MonthlyDocuments';

export default function StoreManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Store>>({});

  useEffect(() => {
    fetchStores();
  }, []);

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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term && stores.length > 0) {
      const found = stores.find(s => s.store_name.toLowerCase().includes(term.toLowerCase()));
      if (found) {
        setSelectedStore(found);
        setEditForm(found);
      }
    }
  };

  const handleSave = async () => {
    if (!editForm.store_name) {
      alert('店舗名は必須です');
      return;
    }

    const dataToSave = {
      ...editForm,
      updated_at: new Date().toISOString(),
    };

    if (selectedStore) {
      const { error } = await supabase
        .from('stores')
        .update(dataToSave)
        .eq('id', selectedStore.id);

      if (error) {
        console.error('Error updating store:', error);
        alert('更新に失敗しました');
        return;
      }
    } else {
      const { error } = await supabase
        .from('stores')
        .insert([dataToSave]);

      if (error) {
        console.error('Error creating store:', error);
        alert('作成に失敗しました');
        return;
      }
    }

    fetchStores();
    setIsEditing(false);
    alert('保存しました');
  };

  const handleNewStore = () => {
    setSelectedStore(null);
    setEditForm({ store_name: '' });
    setIsEditing(true);
  };

  const handleCloseDetail = () => {
    setSelectedStore(null);
    setIsEditing(false);
  };

  const downloadCSVTemplate = () => {
    const headers = [
      '店舗名', '郵便番号', '店舗住所', '電話番号',
      'ランディングページ1', 'ランディングページ2', 'ランディングページ3', 'ランディングページ4',
      'LINE公式アカウントID①', 'LINE公式アカウントID②',
      'Xアカウント①名前', 'Xアカウント①ID', 'Xアカウント①パスワード',
      'Xアカウント②名前', 'Xアカウント②ID', 'Xアカウント②パスワード',
      'Google', 'Yahoo!', 'TVer', 'META',
      'LINE広告①', 'LINE広告②',
      'X広告アカウント①', 'X広告アカウントID①', 'TBM申請①', 'ギャンブル申請①', 'IO申請①', 'プレミアム①',
      'X広告アカウント②', 'X広告アカウントID②', 'TBM申請②', 'ギャンブル申請②', 'IO申請②', 'プレミアム②'
    ];

    const csv = Papa.unparse({
      fields: headers,
      data: [[]]
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '店舗基本情報_テンプレート.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      encoding: 'UTF-8',
      complete: async (results) => {
        try {
          const storesToInsert = results.data
            .filter((row: any) => row['店舗名'] && row['店舗名'].trim())
            .map((row: any) => ({
              store_name: row['店舗名'] || '',
              postal_code: row['郵便番号'] || '',
              address: row['店舗住所'] || '',
              phone: row['電話番号'] || '',
              landing_page_1: row['ランディングページ1'] || '',
              landing_page_2: row['ランディングページ2'] || '',
              landing_page_3: row['ランディングページ3'] || '',
              landing_page_4: row['ランディングページ4'] || '',
              line_account_1: row['LINE公式アカウントID①'] || '',
              line_account_2: row['LINE公式アカウントID②'] || '',
              x_account_1_name: row['Xアカウント①名前'] || '',
              x_account_1_id: row['Xアカウント①ID'] || '',
              x_account_1_pass: row['Xアカウント①パスワード'] || '',
              x_account_2_name: row['Xアカウント②名前'] || '',
              x_account_2_id: row['Xアカウント②ID'] || '',
              x_account_2_pass: row['Xアカウント②パスワード'] || '',
              google_account: row['Google'] || '',
              yahoo_account: row['Yahoo!'] || '',
              tver_account: row['TVer'] || '',
              meta_account: row['META'] || '',
              line_ad_account_1: row['LINE広告①'] || '',
              line_ad_account_2: row['LINE広告②'] || '',
              x_ad_account_1: row['X広告アカウント①'] || '',
              x_ad_account_1_id: row['X広告アカウントID①'] || '',
              x_ad_account_1_tbm: row['TBM申請①'] === 'TRUE' || row['TBM申請①'] === '1',
              x_ad_account_1_gambling: row['ギャンブル申請①'] === 'TRUE' || row['ギャンブル申請①'] === '1',
              x_ad_account_1_io: row['IO申請①'] === 'TRUE' || row['IO申請①'] === '1',
              x_ad_account_1_premium: row['プレミアム①'] === 'TRUE' || row['プレミアム①'] === '1',
              x_ad_account_2: row['X広告アカウント②'] || '',
              x_ad_account_2_id: row['X広告アカウントID②'] || '',
              x_ad_account_2_tbm: row['TBM申請②'] === 'TRUE' || row['TBM申請②'] === '1',
              x_ad_account_2_gambling: row['ギャンブル申請②'] === 'TRUE' || row['ギャンブル申請②'] === '1',
              x_ad_account_2_io: row['IO申請②'] === 'TRUE' || row['IO申請②'] === '1',
              x_ad_account_2_premium: row['プレミアム②'] === 'TRUE' || row['プレミアム②'] === '1',
            }));

          if (storesToInsert.length === 0) {
            alert('有効なデータが見つかりませんでした');
            return;
          }

          const { error } = await supabase
            .from('stores')
            .insert(storesToInsert);

          if (error) {
            console.error('Error uploading stores:', error);
            alert('CSVアップロードに失敗しました');
            return;
          }

          await supabase.from('operation_history').insert([{
            operation_type: 'insert',
            table_name: 'stores',
            operation_data: { count: storesToInsert.length, source: 'csv_upload' }
          }]);

          alert(`${storesToInsert.length}件の店舗情報を登録しました`);
          fetchStores();
        } catch (error) {
          console.error('Error processing CSV:', error);
          alert('CSVファイルの処理中にエラーが発生しました');
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        alert('CSVファイルの読み込みに失敗しました');
      }
    });

    event.target.value = '';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">店舗基本情報管理</h1>
        <div className="flex gap-2">
          <button
            onClick={downloadCSVTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            CSVテンプレート
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer">
            <Upload size={18} />
            CSVアップロード
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={handleNewStore}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            新規店舗
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="店舗名で検索..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {(selectedStore || isEditing) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedStore ? editForm.store_name : '新規店舗情報'}
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
                      if (selectedStore) {
                        setEditForm(selectedStore);
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 border-b pb-2">店舗情報</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">店舗名 *</label>
                <input
                  type="text"
                  value={editForm.store_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, store_name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">郵便番号</label>
                <input
                  type="text"
                  value={editForm.postal_code || ''}
                  onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">店舗住所</label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                <input
                  type="text"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              {[1, 2, 3, 4].map((num) => (
                <div key={num}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ランディングページ{num}
                  </label>
                  <input
                    type="text"
                    value={(editForm as any)[`landing_page_${num}`] || ''}
                    onChange={(e) => setEditForm({ ...editForm, [`landing_page_${num}`]: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LINE公式アカウントID①</label>
                <input
                  type="text"
                  value={editForm.line_account_1 || ''}
                  onChange={(e) => setEditForm({ ...editForm, line_account_1: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LINE公式アカウントID②</label>
                <input
                  type="text"
                  value={editForm.line_account_2 || ''}
                  onChange={(e) => setEditForm({ ...editForm, line_account_2: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 border-b pb-2">広告アカウント</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google</label>
                <input
                  type="text"
                  value={editForm.google_account || ''}
                  onChange={(e) => setEditForm({ ...editForm, google_account: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yahoo!</label>
                <input
                  type="text"
                  value={editForm.yahoo_account || ''}
                  onChange={(e) => setEditForm({ ...editForm, yahoo_account: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TVer</label>
                <input
                  type="text"
                  value={editForm.tver_account || ''}
                  onChange={(e) => setEditForm({ ...editForm, tver_account: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">META</label>
                <input
                  type="text"
                  value={editForm.meta_account || ''}
                  onChange={(e) => setEditForm({ ...editForm, meta_account: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LINE広告①</label>
                <input
                  type="text"
                  value={editForm.line_ad_account_1 || ''}
                  onChange={(e) => setEditForm({ ...editForm, line_ad_account_1: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LINE広告②</label>
                <input
                  type="text"
                  value={editForm.line_ad_account_2 || ''}
                  onChange={(e) => setEditForm({ ...editForm, line_ad_account_2: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">X広告アカウント①</label>
                <input
                  type="text"
                  placeholder="アカウント名"
                  value={editForm.x_ad_account_1 || ''}
                  onChange={(e) => setEditForm({ ...editForm, x_ad_account_1: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 mb-2"
                />
                <input
                  type="text"
                  placeholder="X広告アカウントID"
                  value={editForm.x_ad_account_1_id || ''}
                  onChange={(e) => setEditForm({ ...editForm, x_ad_account_1_id: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 mb-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.x_ad_account_1_tbm || false}
                      onChange={(e) => setEditForm({ ...editForm, x_ad_account_1_tbm: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">TBM申請</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.x_ad_account_1_gambling || false}
                      onChange={(e) => setEditForm({ ...editForm, x_ad_account_1_gambling: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">ギャンブル申請</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.x_ad_account_1_io || false}
                      onChange={(e) => setEditForm({ ...editForm, x_ad_account_1_io: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">IO申請</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.x_ad_account_1_premium || false}
                      onChange={(e) => setEditForm({ ...editForm, x_ad_account_1_premium: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm">プレミアム</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {selectedStore && !isEditing && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <MonthlyDocuments
                storeId={selectedStore.id}
                storeName={selectedStore.store_name}
              />
            </div>
          )}
        </div>
      )}

      {!selectedStore && !isEditing && stores.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">登録店舗一覧</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">店舗名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">郵便番号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">住所</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電話番号</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stores.map((store) => (
                  <tr
                    key={store.id}
                    onClick={() => {
                      setSelectedStore(store);
                      setEditForm(store);
                      setIsEditing(false);
                    }}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{store.store_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{store.postal_code || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{store.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{store.phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
