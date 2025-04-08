export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]; export type Database = { public: { Tables: { form_responses: { Row: { created_at: string; form_id: string; id: string; response_data: Json; }; Insert: { created_at?: string; form_id: string; id?: string; response_data: Json; }; Update: { created_at?: string; form_id?: string; id?: string; response_data?: Json; }; Relationships: [ { foreignKeyName: 'form_responses_form_id_fkey'; columns: ['form_id']; isOneToOne: false; referencedRelation: 'forms'; referencedColumns: ['id']; }, ]; }; forms: { Row: { created_at: string; fields: Json; id: string; image_url: string | null; name: string; updated_at: string; user_id: string; is_deleted: boolean; }; Insert: { created_at?: string; fields: Json; id?: string; image_url?: string | null; name: string; updated_at?: string; user_id: string; is_deleted?: boolean; }; Update: { created_at?: string; fields?: Json; id?: string; image_url?: string | null; name?: string; updated_at?: string; user_id?: string; is_deleted?: boolean; }; Relationships: []; }; profiles: { Row: { created_at: string; email: string | null; id: string; }; Insert: { created_at?: string; email?: string | null; id: string; }; Update: { created_at?: string; email?: string | null; id?: string; }; Relationships: []; }; }; Views: { [_ in never]: never; }; Functions: { [_ in never]: never; }; Enums: { [_ in never]: never; }; CompositeTypes: { [_ in never]: never; }; }; };
