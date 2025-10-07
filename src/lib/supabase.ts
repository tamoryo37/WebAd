import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Store = {
  id: string;
  store_name: string;
  postal_code?: string;
  address?: string;
  phone?: string;
  landing_page_1?: string;
  landing_page_2?: string;
  landing_page_3?: string;
  landing_page_4?: string;
  line_account_1?: string;
  line_account_2?: string;
  x_account_1_name?: string;
  x_account_1_id?: string;
  x_account_1_pass?: string;
  x_account_2_name?: string;
  x_account_2_id?: string;
  x_account_2_pass?: string;
  google_account?: string;
  yahoo_account?: string;
  tver_account?: string;
  meta_account?: string;
  line_ad_account_1?: string;
  line_ad_account_2?: string;
  x_ad_account_1?: string;
  x_ad_account_1_id?: string;
  x_ad_account_1_tbm?: boolean;
  x_ad_account_1_gambling?: boolean;
  x_ad_account_1_io?: boolean;
  x_ad_account_1_premium?: boolean;
  x_ad_account_2?: string;
  x_ad_account_2_id?: string;
  x_ad_account_2_tbm?: boolean;
  x_ad_account_2_gambling?: boolean;
  x_ad_account_2_io?: boolean;
  x_ad_account_2_premium?: boolean;
  quote_url?: string;
  proposal_url?: string;
  report_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type Campaign = {
  id: string;
  campaign_number: string;
  store_id?: string;
  setter?: string;
  platform: string;
  account_name: string;
  campaign_name: string;
  copy_source?: string;
  start_date: string;
  end_date: string;
  delivery_time?: string;
  total_budget: number;
  set_total_budget: number;
  set_daily_budget: number;
  delivery_days: number;
  ad_info_url?: string;
  target_area?: string;
  landing_page?: string;
  other_settings?: string;
  notes?: string;
  branch?: string;
  stored?: boolean;
  status?: string;
  person_in_charge?: string;
  chk?: string;
  completion_chk?: string;
  memo?: string;
  before_start_completion_status?: string;
  before_start_completion_amount?: number;
  before_start_completion_target?: number;
  account?: string;
  account_termination?: string;
  account_day_forecast?: string;
  created_at?: string;
  updated_at?: string;
};

export type CampaignProgress = {
  id: string;
  campaign_id: string;
  has_proposal?: boolean;
  has_quote?: boolean;
  creative_status?: string;
  start_check_1?: string;
  start_check_2?: string;
  end_check_1?: string;
  end_check_2?: string;
  progress_status?: string;
  check_status?: string;
  consumption_check?: string;
  memo?: string;
  created_at?: string;
  updated_at?: string;
};

export type BudgetTracking = {
  id: string;
  campaign_id: string;
  tracking_date: string;
  consumed_amount: number;
  target_amount: number;
  under_delivery: number;
  allocated_amount: number;
  allocated_total_budget: number;
  allocated_daily_budget: number;
  created_at?: string;
  updated_at?: string;
};

export type DataBackup = {
  id: string;
  backup_name: string;
  backup_date: string;
  backup_data: any;
  table_counts: any;
  created_at?: string;
};

export type OperationHistory = {
  id: string;
  operation_type: string;
  table_name: string;
  record_id?: string;
  operation_data: any;
  operation_date: string;
  created_at?: string;
};

export type BackupSettings = {
  id: string;
  auto_backup_enabled: boolean;
  backup_frequency: string;
  backup_time: string;
  retention_days: number;
  last_backup_date?: string;
  created_at?: string;
  updated_at?: string;
};

export type DummyDataSet = {
  id: string;
  set_name: string;
  description?: string;
  data_content: any;
  record_counts: any;
  created_at?: string;
};

export type StoreImage = {
  id: string;
  store_id: string;
  image_type: string;
  month: string;
  image_url: string;
  file_name: string;
  file_size: number;
  mime_type?: string;
  created_at?: string;
  updated_at?: string;
};

export type User = {
  id: string;
  username: string;
  password_hash?: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  view_scope?: 'all' | 'own' | 'assigned';
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
};

export type UserCampaignAccess = {
  id: string;
  user_id: string;
  campaign_id: string;
  created_at?: string;
};

export type UserPermission = {
  id: string;
  user_id: string;
  resource: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UserMediaAccess = {
  id: string;
  user_id: string;
  media: string;
  has_access: boolean;
  created_at?: string;
  updated_at?: string;
};

export type StoreMonthlyDocument = {
  id: string;
  store_id: string;
  year_month: string;
  quote_url?: string;
  proposal_url?: string;
  report_url?: string;
  created_at?: string;
  updated_at?: string;
};
