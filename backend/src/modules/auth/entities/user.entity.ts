export interface UserEntity {
  id: string;
  email: string;
  password_hash: string | null;
  name: string;
  avatar_url: string | null;
  default_currency: string;
  created_at?: Date;
  updated_at?: Date;
}
