import { useState, useEffect } from 'react';
import { supabase, StoreMonthlyDocument } from '../lib/supabase';
import { Upload, FileText, CheckCircle, XCircle, Calendar } from 'lucide-react';

type MonthlyDocumentsProps = {
  storeId: string;
  storeName: string;
};

export default function MonthlyDocuments({ storeId, storeName }: MonthlyDocumentsProps) {
  const [documents, setDocuments] = useState<StoreMonthlyDocument[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [editingDoc, setEditingDoc] = useState<StoreMonthlyDocument | null>(null);
  const [formData, setFormData] = useState({
    quote_url: '',
    proposal_url: '',
    report_url: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, [storeId]);

  useEffect(() => {
    const doc = documents.find(d => d.year_month === selectedMonth);
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        quote_url: doc.quote_url || '',
        proposal_url: doc.proposal_url || '',
        report_url: doc.report_url || ''
      });
    } else {
      setEditingDoc(null);
      setFormData({
        quote_url: '',
        proposal_url: '',
        report_url: ''
      });
    }
  }, [selectedMonth, documents]);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('store_monthly_documents')
      .select('*')
      .eq('store_id', storeId)
      .order('year_month', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }

    setDocuments(data || []);
  };

  const handleSave = async () => {
    const dataToSave = {
      store_id: storeId,
      year_month: selectedMonth,
      quote_url: formData.quote_url.trim() || null,
      proposal_url: formData.proposal_url.trim() || null,
      report_url: formData.report_url.trim() || null,
    };

    if (editingDoc) {
      const { error } = await supabase
        .from('store_monthly_documents')
        .update(dataToSave)
        .eq('id', editingDoc.id);

      if (error) {
        console.error('Error updating document:', error);
        alert('更新に失敗しました');
        return;
      }
    } else {
      const { error } = await supabase
        .from('store_monthly_documents')
        .insert([dataToSave]);

      if (error) {
        console.error('Error creating document:', error);
        alert('作成に失敗しました');
        return;
      }
    }

    alert('保存しました');
    fetchDocuments();
  };

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = -12; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const yearMonth = date.toISOString().slice(0, 7);
      options.push(yearMonth);
    }
    return options;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">月次ドキュメント管理</h3>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {generateMonthOptions().map(month => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              見積書URL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={formData.quote_url}
                  onChange={(e) => setFormData({ ...formData, quote_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {formData.quote_url ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              提案書URL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={formData.proposal_url}
                  onChange={(e) => setFormData({ ...formData, proposal_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {formData.proposal_url ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              レポートURL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={formData.report_url}
                  onChange={(e) => setFormData({ ...formData, report_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {formData.report_url ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300" />
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">過去のドキュメント</h4>
        <div className="space-y-2">
          {documents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              ドキュメントがまだ登録されていません
            </p>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  doc.year_month === selectedMonth
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-900">{doc.year_month}</span>
                </div>
                <div className="flex items-center gap-2">
                  {doc.quote_url && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600">見積</span>
                    </div>
                  )}
                  {doc.proposal_url && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600">提案</span>
                    </div>
                  )}
                  {doc.report_url && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600">報告</span>
                    </div>
                  )}
                  {!doc.quote_url && !doc.proposal_url && !doc.report_url && (
                    <span className="text-xs text-gray-400">未登録</span>
                  )}
                  <button
                    onClick={() => setSelectedMonth(doc.year_month)}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-700"
                  >
                    編集
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
