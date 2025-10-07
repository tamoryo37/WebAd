import { useState, useEffect } from 'react';
import { supabase, User } from '../lib/supabase';
import { Plus, CreditCard as Edit2, Save, X, Trash2, Shield, CircleUser as UserCircle } from 'lucide-react';
import UserPermissionSettings from './UserPermissionSettings';

const ROLES = [
  { value: 'admin', label: '管理者', description: 'すべての権限', color: 'bg-red-100 text-red-800' },
  { value: 'manager', label: 'マネージャー', description: '閲覧・作成・編集権限', color: 'bg-blue-100 text-blue-800' },
  { value: 'editor', label: '編集者', description: '閲覧・編集権限', color: 'bg-green-100 text-green-800' },
  { value: 'viewer', label: '閲覧者', description: '閲覧権限のみ', color: 'bg-gray-100 text-gray-800' },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [showPermissionSettings, setShowPermissionSettings] = useState(false);
  const [permissionSettingsUser, setPermissionSettingsUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);


  const fetchUsers = async () => {
    const { data, error } = await supabase.rpc('get_tenant_users');

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    setUsers(data || []);
  };


  const handleSave = async () => {
    if (!editForm.username || !editForm.full_name || !editForm.email || !editForm.role) {
      alert('ユーザー名、フルネーム、メールアドレス、権限は必須です');
      return;
    }

    const dataToSave = {
      ...editForm,
      updated_at: new Date().toISOString(),
    };

    if (selectedUser) {
      const { error } = await supabase
        .from('users')
        .update(dataToSave)
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Error updating user:', error);
        alert('更新に失敗しました');
        return;
      }
    } else {
      if (!editForm.password_hash) {
        alert('パスワードは必須です');
        return;
      }

      const { error } = await supabase
        .from('users')
        .insert([dataToSave]);

      if (error) {
        console.error('Error creating user:', error);
        alert('作成に失敗しました');
        return;
      }
    }

    fetchUsers();
    setIsEditing(false);
    alert('保存しました');
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('このユーザーを削除しますか？')) return;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      alert('削除に失敗しました');
      return;
    }

    fetchUsers();
    if (selectedUser?.id === userId) {
      setSelectedUser(null);
    }
    alert('削除しました');
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setEditForm({
      username: '',
      full_name: '',
      email: '',
      role: 'viewer',
      is_active: true,
    });
    setIsEditing(true);
  };

  const handleCloseDetail = () => {
    setSelectedUser(null);
    setEditForm({});
    setIsEditing(false);
  };

  const getRoleInfo = (role: string) => {
    return ROLES.find(r => r.value === role) || ROLES[3];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ユーザー管理</h1>
        <button
          onClick={handleNewUser}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          新規ユーザー
        </button>
      </div>

      {(selectedUser || isEditing) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedUser ? editForm.full_name || selectedUser.full_name : '新規ユーザー'}
            </h2>
            <div className="flex gap-2">
              {selectedUser && !isEditing && (
                <button
                  onClick={() => {
                    setPermissionSettingsUser(selectedUser);
                    setShowPermissionSettings(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Shield size={18} />
                  権限設定
                </button>
              )}
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
                      if (selectedUser) {
                        setEditForm(selectedUser);
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
                <h3 className="font-semibold text-gray-700 border-b pb-2">基本情報</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名 *</label>
                  <input
                    type="text"
                    value={editForm.username || ''}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">フルネーム *</label>
                  <input
                    type="text"
                    value={editForm.full_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス *</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>

                {isEditing && !selectedUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">パスワード *</label>
                    <input
                      type="password"
                      value={editForm.password_hash || ''}
                      onChange={(e) => setEditForm({ ...editForm, password_hash: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="パスワードを入力"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">権限設定</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">権限レベル *</label>
                  <select
                    value={editForm.role || 'viewer'}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User['role'] })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  >
                    {ROLES.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">権限レベルの説明</label>
                  <div className="space-y-2">
                    {ROLES.map(role => (
                      <div key={role.value} className={`p-3 rounded-lg ${role.color}`}>
                        <p className="font-semibold">{role.label}</p>
                        <p className="text-sm">{role.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.is_active ?? true}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">アクティブ</span>
                  </label>
                </div>

                {selectedUser && selectedUser.last_login && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">最終ログイン</label>
                    <input
                      type="text"
                      value={new Date(selectedUser.last_login).toLocaleString('ja-JP')}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                )}
              </div>
            </div>
        </div>
      )}

      {!selectedUser && !isEditing && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">ユーザー名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">フルネーム</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">メール</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">権限</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">表示範囲</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">状態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">最終ログイン</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedUser(user);
                        setEditForm(user);
                        setIsEditing(false);
                      }}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 flex items-center gap-2">
                        <UserCircle size={20} className="text-gray-400" />
                        {user.username}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.full_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.view_scope === 'all' ? 'bg-blue-100 text-blue-800' :
                          user.view_scope === 'assigned' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.view_scope === 'all' ? '全て' :
                           user.view_scope === 'assigned' ? '個別指定' :
                           '自分のみ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            アクティブ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            無効
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.last_login ? new Date(user.last_login).toLocaleString('ja-JP') : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(user.id);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPermissionSettings && permissionSettingsUser && (
        <UserPermissionSettings
          user={permissionSettingsUser}
          onClose={() => {
            setShowPermissionSettings(false);
            setPermissionSettingsUser(null);
          }}
          onSave={() => {
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
