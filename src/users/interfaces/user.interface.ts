export interface User {
  user_id: string;
  permissions: string;
  pw_hash: string;
}

export interface SavedUser {
  username: string,
  created: boolean
}