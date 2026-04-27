// Este archivo se genera automáticamente con:
//   npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
// No editar manualmente.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          verified: boolean;
          expo_push_token: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          verified?: boolean;
          expo_push_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          verified?: boolean;
          expo_push_token?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          name: string;
          date: string;
          venue: string;
          address: string;
          lat: number;
          lng: number;
          image_url: string | null;
          category: string;
          scraped_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          date: string;
          venue: string;
          address: string;
          lat: number;
          lng: number;
          image_url?: string | null;
          category: string;
          scraped_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          date?: string;
          venue?: string;
          address?: string;
          lat?: number;
          lng?: number;
          image_url?: string | null;
          category?: string;
          scraped_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string | null;
          max_members: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description?: string | null;
          max_members?: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          description?: string | null;
          max_members?: number;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_event_id_fkey';
            columns: ['event_id'];
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'groups_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: 'owner' | 'member';
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      meetup_proposals: {
        Row: {
          id: string;
          group_id: string;
          proposed_by: string;
          location_name: string;
          lat: number;
          lng: number;
          proposed_time: string;
          selected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          proposed_by: string;
          location_name: string;
          lat: number;
          lng: number;
          proposed_time: string;
          selected?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          proposed_by?: string;
          location_name?: string;
          lat?: number;
          lng?: number;
          proposed_time?: string;
          selected?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meetup_proposals_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      meetup_votes: {
        Row: {
          proposal_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          proposal_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          proposal_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meetup_votes_proposal_id_fkey';
            columns: ['proposal_id'];
            referencedRelation: 'meetup_proposals';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      meetup_proposals_with_votes: {
        Row: {
          id: string;
          group_id: string;
          proposed_by: string;
          location_name: string;
          lat: number;
          lng: number;
          proposed_time: string;
          selected: boolean;
          created_at: string;
          vote_count: number;
        };
      };
    };
    Functions: {
      join_group: {
        Args: { group_id: string };
        Returns: void;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}
