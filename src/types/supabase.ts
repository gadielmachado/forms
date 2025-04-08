import { Database as DatabaseGenerated } from '@/types/supabase-generated';

export type Database = DatabaseGenerated & {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          logo_url?: string;
          created_by: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      user_tenants: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          role: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string;
          role?: string;
          created_at?: string;
        };
      };
    };
  };
}; 