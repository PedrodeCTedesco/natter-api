export interface UserDB {
  user_id: string;
  permissions: string;
  pw_hash: string;
}

export interface SavedUser {
  username: string,
  created: boolean
}

export interface Permission {
  space_id: number | null;
  perms: string | null;
}

export interface User {
  user_id: string;
  permissions: Permission[];
}