export type Visibility = 'public' | 'unlisted' | 'private';
export type ItemType = 'link' | 'video' | 'note' | 'file';
export type MemberStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type Permission = 'view' | 'download' | 'share';

export interface VaultItem {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  type: ItemType;
  visibility: Visibility;
  url?: string | null;
  content?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  thumbnail_url?: string | null;
  favicon_url?: string | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShareLink {
  id: string;
  item_id: string;
  token: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_by: string;
  created_at: string;
}

export interface Member {
  id: string;
  email: string;
  name: string;
  status: MemberStatus;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  actor_user_id?: string | null;
  action: string;
  item_id?: string | null;
  target_user_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}
