import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CampaignManagement from './CampaignManagement';

export default function ExternalUserCampaignView() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAssignedCampaigns();
  }, [user]);

  const fetchAssignedCampaigns = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, campaign_name, account_name, start_date, end_date')
        .eq('person_in_charge', user.email)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);

      if (data && data.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            担当キャンペーンがありません
          </h2>
          <p className="text-gray-600">
            現在、あなたに割り当てられているキャンペーンはありません。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <CampaignManagement
        selectedCampaignId={selectedCampaignId}
        onClearSelection={() => {}}
        restrictedView={true}
      />
    </div>
  );
}
