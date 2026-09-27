export type Background = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_path: string;
  is_active: boolean;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type UserBackground = {
  id: string;
  owner_id: string;
  name: string;
  image_path: string;
  created_at: string;
};
