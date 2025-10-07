import { useState, useEffect } from 'react';
import { supabase, StoreImage } from '../lib/supabase';
import { Upload, Download, Trash2, FileImage, X } from 'lucide-react';

type StoreImageManagementProps = {
  storeId: string;
  storeName: string;
};

const IMAGE_TYPES = [
  { value: 'quote', label: '見積書' },
  { value: 'proposal', label: '提案書' },
  { value: 'report', label: 'レポート' },
];

export default function StoreImageManagement({ storeId, storeName }: StoreImageManagementProps) {
  const [images, setImages] = useState<StoreImage[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedType, setSelectedType] = useState<string>('quote');
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, [storeId]);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('store_images')
      .select('*')
      .eq('store_id', storeId)
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching images:', error);
      return;
    }
    setImages(data || []);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const { data, error } = await supabase
          .from('store_images')
          .insert([{
            store_id: storeId,
            image_type: selectedType,
            month: selectedMonth + '-01',
            image_url: base64String,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          }])
          .select()
          .single();

        if (error) {
          console.error('Error uploading image:', error);
          alert('画像のアップロードに失敗しました');
          return;
        }

        fetchImages();
        alert('画像をアップロードしました');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('ファイル処理中にエラーが発生しました');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('この画像を削除しますか?')) return;

    const { error } = await supabase
      .from('store_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Error deleting image:', error);
      alert('削除に失敗しました');
      return;
    }

    fetchImages();
    alert('削除しました');
  };

  const handleDownload = (image: StoreImage) => {
    const link = document.createElement('a');
    link.href = image.image_url;
    link.download = image.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const groupedImages = images.reduce((acc, image) => {
    const monthKey = image.month.slice(0, 7);
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(image);
    return acc;
  }, {} as Record<string, StoreImage[]>);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {storeName} の画像管理
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              対象月
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              種類
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {IMAGE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              画像をアップロード
            </label>
            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <Upload size={18} />
              {uploading ? 'アップロード中...' : '画像を選択'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="space-y-6">
          {Object.keys(groupedImages).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileImage size={48} className="mx-auto mb-4 text-gray-400" />
              <p>画像がまだありません</p>
            </div>
          ) : (
            Object.entries(groupedImages)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, monthImages]) => (
                <div key={month} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h4 className="font-semibold text-gray-800">
                      {new Date(month + '-01').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                    </h4>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {monthImages.map((image) => (
                        <div key={image.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div
                            className="relative h-48 bg-gray-100 cursor-pointer"
                            onClick={() => setPreviewImage(image.image_url)}
                          >
                            <img
                              src={image.image_url}
                              alt={image.file_name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {IMAGE_TYPES.find(t => t.value === image.image_type)?.label || image.image_type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatFileSize(image.file_size)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 truncate" title={image.file_name}>
                              {image.file_name}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDownload(image)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                              >
                                <Download size={14} />
                                ダウンロード
                              </button>
                              <button
                                onClick={() => handleDelete(image.id)}
                                className="flex items-center justify-center px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
