export interface Database {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          video_title: string;
          start_time: number;
          end_time: number;
          start_segment_start: number;
          end_segment_start: number;
          start_offset: number;
          end_offset: number;
          preview: string;
          created_at: number;
        };
        Insert: {
          id: string;
          user_id: string;
          video_id: string;
          video_title: string;
          start_time: number;
          end_time: number;
          start_segment_start: number;
          end_segment_start: number;
          start_offset: number;
          end_offset: number;
          preview: string;
          created_at: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          video_title?: string;
          start_time?: number;
          end_time?: number;
          start_segment_start?: number;
          end_segment_start?: number;
          start_offset?: number;
          end_offset?: number;
          preview?: string;
          created_at?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
