export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          ayah_number: number;
          created_at: string;
          id: string;
          surah_number: number;
          user_id: string;
        };
        Insert: {
          ayah_number: number;
          created_at?: string;
          id?: string;
          surah_number: number;
          user_id?: string;
        };
        Update: {
          ayah_number?: number;
          created_at?: string;
          id?: string;
          surah_number?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      dedications: {
        Row: {
          created_at: string;
          created_by: string;
          giver_name: string;
          id: string;
          is_active: boolean;
          message: string;
          recipient_name: string;
          recipient_status: string;
          slug: string;
          theme_key: string;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          giver_name: string;
          id?: string;
          is_active?: boolean;
          message: string;
          recipient_name: string;
          recipient_status: string;
          slug?: string;
          theme_key: string;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          giver_name?: string;
          id?: string;
          is_active?: boolean;
          message?: string;
          recipient_name?: string;
          recipient_status?: string;
          slug?: string;
          theme_key?: string;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dedications_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      reading_progress: {
        Row: {
          completed_sections: Json;
          created_at: string;
          dedication_id: string | null;
          id: string;
          last_ayah_number: number | null;
          last_juz_number: number | null;
          last_surah_number: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_sections?: Json;
          created_at?: string;
          dedication_id?: string | null;
          id?: string;
          last_ayah_number?: number | null;
          last_juz_number?: number | null;
          last_surah_number?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          completed_sections?: Json;
          created_at?: string;
          dedication_id?: string | null;
          id?: string;
          last_ayah_number?: number | null;
          last_juz_number?: number | null;
          last_surah_number?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reading_progress_dedication_id_fkey';
            columns: ['dedication_id'];
            isOneToOne: false;
            referencedRelation: 'dedications';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_dedication: {
        Args: { p_slug: string };
        Returns: {
          created_at: string;
          giver_name: string;
          message: string;
          recipient_name: string;
          recipient_status: string;
          slug: string;
          theme_key: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type DedicationRow = Database['public']['Tables']['dedications']['Row'];
export type ReadingProgressRow = Database['public']['Tables']['reading_progress']['Row'];
export type BookmarkRow = Database['public']['Tables']['bookmarks']['Row'];
export type PublicDedicationRow =
  Database['public']['Functions']['get_public_dedication']['Returns'][number];
