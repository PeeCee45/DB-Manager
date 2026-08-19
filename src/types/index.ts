export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface Connection {
  id: number;
  user_id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  encrypted_password: string;
  database_name: string;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export interface ConnectionInput {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database_name: string;
}

export interface ConnectionSafe {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  database_name: string;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export interface DatabaseInfo {
  name: string;
  isSystem: boolean;
}

export interface TableInfo {
  name: string;
  engine: string | null;
  rows: number | null;
  size: number | null;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: string;
  key: string;
  default: string | null;
  extra: string;
}

export interface IndexInfo {
  name: string;
  column: string;
  unique: boolean;
  type: string;
}

export interface RowData {
  [key: string]: unknown;
}

export interface QueryResult {
  columns: string[];
  rows: RowData[];
  affectedRows?: number;
  insertId?: number;
  warning?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
