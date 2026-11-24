// Shape of mala's "notes" table in Supabase (one row = one saved highlight)
export interface Database {
  public: {
    Tables: {
      notes: {
        // what a select gives back
        Row: {
          id: string; // uuid
          user_id: string; // uuid → auth.users.id
          video_id: string;
          video_title: string;
          start_time: number; // float8: data-start of the line the highlight starts in
          end_time: number; // float8: when the highlight ends (end line's start + duration)
          end_segment_start: number; // float8: data-start of the line the highlight ends in
          start_offset: number; // int4: characters into the start line
          end_offset: number; // int4: characters into the end line
          preview: string; // the highlighted text (first 40 characters)
          created_at: number; // int8: Date.now() in milliseconds
          test_column: string | null; // optional, never filled in
        };
        // what an insert needs
        Insert: {
          id?: string; // left out: the database fills it in (default gen_random_uuid())
          user_id: string;
          video_id: string;
          video_title: string;
          start_time: number;
          end_time: number;
          end_segment_start: number;
          start_offset: number;
          end_offset: number;
          preview: string;
          created_at: number;
          test_column?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
