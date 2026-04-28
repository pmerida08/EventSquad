export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      events: {
        Row: { address: string; category: string; date: string; id: string; image_url: string | null; lat: number; lng: number; name: string; scraped_at: string; source_id: string | null; venue: string }
        Insert: { address: string; category?: string; date: string; id?: string; image_url?: string | null; lat: number; lng: number; name: string; scraped_at?: string; source_id?: string | null; venue: string }
        Update: { address?: string; category?: string; date?: string; id?: string; image_url?: string | null; lat?: number; lng?: number; name?: string; scraped_at?: string; source_id?: string | null; venue?: string }
        Relationships: []
      }
      group_members: {
        Row: { group_id: string; joined_at: string; role: string; user_id: string }
        Insert: { group_id: string; joined_at?: string; role?: string; user_id: string }
        Update: { group_id?: string; joined_at?: string; role?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "group_members_group_id_fkey"; columns: ["group_id"]; isOneToOne: false; referencedRelation: "groups"; referencedColumns: ["id"] },
          { foreignKeyName: "group_members_group_id_fkey"; columns: ["group_id"]; isOneToOne: false; referencedRelation: "groups_with_member_count"; referencedColumns: ["id"] },
          { foreignKeyName: "group_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      groups: {
        Row: { created_at: string; created_by: string; description: string | null; event_id: string; id: string; max_members: number; name: string }
        Insert: { created_at?: string; created_by: string; description?: string | null; event_id: string; id?: string; max_members?: number; name: string }
        Update: { created_at?: string; created_by?: string; description?: string | null; event_id?: string; id?: string; max_members?: number; name?: string }
        Relationships: [
          { foreignKeyName: "groups_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "groups_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] },
        ]
      }
      profiles: {
        Row: { avatar_url: string | null; bio: string | null; created_at: string; display_name: string; expo_push_token: string | null; id: string; verified: boolean }
        Insert: { avatar_url?: string | null; bio?: string | null; created_at?: string; display_name: string; expo_push_token?: string | null; id: string; verified?: boolean }
        Update: { avatar_url?: string | null; bio?: string | null; created_at?: string; display_name?: string; expo_push_token?: string | null; id?: string; verified?: boolean }
        Relationships: []
      }
    }
    Views: {
      groups_with_member_count: {
        Row: { created_at: string | null; created_by: string | null; description: string | null; event_id: string | null; id: string | null; max_members: number | null; member_count: number | null; name: string | null }
        Relationships: [
          { foreignKeyName: "groups_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "groups_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] },
        ]
      }
    }
    Functions: {
      events_near: {
        Args: { cat?: string; radius_km?: number; user_lat: number; user_lng: number }
        Returns: { address: string; category: string; date: string; distance_km: number; id: string; image_url: string; lat: number; lng: number; name: string; scraped_at: string; source_id: string; venue: string }[]
      }
      create_group: { Args: { p_event_id: string; p_name: string; p_description?: string | null; p_max_members?: number }; Returns: string }
      join_group: { Args: { p_group_id: string }; Returns: undefined }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U } ? U : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = { public: { Enums: {} } } as const
