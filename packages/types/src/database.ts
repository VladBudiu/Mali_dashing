export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          tax_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          tax_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          tax_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_rates: {
        Row: {
          collaborator_id: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          pricing_mode: string
          rate: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          collaborator_id: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          pricing_mode?: string
          rate: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          collaborator_id?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          pricing_mode?: string
          rate?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_rates_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborators: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extractions: {
        Row: {
          confidence: number | null
          created_at: string
          document_id: string
          engine: string
          id: string
          raw_json: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          document_id: string
          engine: string
          id?: string
          raw_json?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          document_id?: string
          engine?: string
          id?: string
          raw_json?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_fields: {
        Row: {
          confidence: number | null
          created_at: string
          extraction_id: string
          field_name: string
          field_value: string | null
          id: string
          is_validated: boolean
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          extraction_id: string
          field_name: string
          field_value?: string | null
          id?: string
          is_validated?: boolean
        }
        Update: {
          confidence?: number | null
          created_at?: string
          extraction_id?: string
          field_name?: string
          field_value?: string | null
          id?: string
          is_validated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "document_fields_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "document_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          event_id: string | null
          expense_claim_id: string | null
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: string
          mime_type: string
          ocr_status: string
          organization_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type?: string
          event_id?: string | null
          expense_claim_id?: string | null
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          mime_type: string
          ocr_status?: string
          organization_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          event_id?: string | null
          expense_claim_id?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string
          ocr_status?: string
          organization_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_expense_claim_id_fkey"
            columns: ["expense_claim_id"]
            isOneToOne: false
            referencedRelation: "expense_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_assignments: {
        Row: {
          collaborator_id: string
          created_at: string
          event_id: string
          fee: number | null
          fee_currency: string
          id: string
          notes: string | null
          role: string | null
        }
        Insert: {
          collaborator_id: string
          created_at?: string
          event_id: string
          fee?: number | null
          fee_currency?: string
          id?: string
          notes?: string | null
          role?: string | null
        }
        Update: {
          collaborator_id?: string
          created_at?: string
          event_id?: string
          fee?: number | null
          fee_currency?: string
          id?: string
          notes?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          city: string | null
          client_id: string | null
          country_code: string
          created_at: string
          created_by: string | null
          estimated_cost_total: number | null
          estimated_revenue_total: number | null
          event_date: string
          final_cost_total: number | null
          final_revenue_total: number | null
          id: string
          notes: string | null
          organization_id: string
          pricing_currency: string
          status: string
          title: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          city?: string | null
          client_id?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          estimated_cost_total?: number | null
          estimated_revenue_total?: number | null
          event_date: string
          final_cost_total?: number | null
          final_revenue_total?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          pricing_currency?: string
          status?: string
          title: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          city?: string | null
          client_id?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          estimated_cost_total?: number | null
          estimated_revenue_total?: number | null
          event_date?: string
          final_cost_total?: number | null
          final_revenue_total?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          pricing_currency?: string
          status?: string
          title?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base_currency: string
          fetched_at: string
          id: number
          inverse_rate: number | null
          is_final: boolean
          notes: string | null
          published_at: string | null
          quote_currency: string
          rate: number
          rate_date: string
          source: string
        }
        Insert: {
          base_currency: string
          fetched_at?: string
          id?: number
          inverse_rate?: number | null
          is_final?: boolean
          notes?: string | null
          published_at?: string | null
          quote_currency: string
          rate: number
          rate_date: string
          source: string
        }
        Update: {
          base_currency?: string
          fetched_at?: string
          id?: number
          inverse_rate?: number | null
          is_final?: boolean
          notes?: string | null
          published_at?: string | null
          quote_currency?: string
          rate?: number
          rate_date?: string
          source?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          organization_id: string
          parent_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_claims: {
        Row: {
          amount: number
          amount_ron: number | null
          category_id: string | null
          created_at: string
          currency: string
          description: string
          event_id: string | null
          exchange_rate: number | null
          id: string
          notes: string | null
          organization_id: string
          receipt_url: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          submitted_at: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          amount: number
          amount_ron?: number | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description: string
          event_id?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          receipt_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_ron?: number | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string
          event_id?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          receipt_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_claims_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_claims_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          amount_ron: number | null
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string
          event_id: string | null
          exchange_rate: number | null
          exchange_rate_date: string | null
          exchange_rate_source: string | null
          id: string
          notes: string | null
          organization_id: string
          reference_no: string | null
          transaction_date: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          amount_ron?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description: string
          event_id?: string | null
          exchange_rate?: number | null
          exchange_rate_date?: string | null
          exchange_rate_source?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          reference_no?: string | null
          transaction_date: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_ron?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          event_id?: string | null
          exchange_rate?: number | null
          exchange_rate_date?: string | null
          exchange_rate_source?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          reference_no?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          quantity: number
          reorder_threshold: number | null
          reserved_quantity: number
          sku: string | null
          unit: string
          unit_cost_ron: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          quantity?: number
          reorder_threshold?: number | null
          reserved_quantity?: number
          sku?: string | null
          unit?: string
          unit_cost_ron?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          quantity?: number
          reorder_threshold?: number | null
          reserved_quantity?: number
          sku?: string | null
          unit?: string
          unit_cost_ron?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: string | null
          id: string
          item_id: string
          movement_type: string
          note: string | null
          organization_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          item_id: string
          movement_type: string
          note?: string | null
          organization_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          note?: string | null
          organization_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string
          organization_id: string
          permissions: Json
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          permissions?: Json
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          permissions?: Json
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string | null
          updated_at: string
          vat_mode: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug?: string | null
          updated_at?: string
          vat_mode?: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string | null
          updated_at?: string
          vat_mode?: string
        }
        Relationships: []
      }
      quote_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          line_total_net: number | null
          quantity: number
          quote_id: string
          sort_order: number
          unit_cost_net: number | null
          unit_price_net: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          line_total_net?: number | null
          quantity?: number
          quote_id: string
          sort_order?: number
          unit_cost_net?: number | null
          unit_price_net: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          line_total_net?: number | null
          quantity?: number
          quote_id?: string
          sort_order?: number
          unit_cost_net?: number | null
          unit_price_net?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_lines_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          created_at: string
          currency: string
          discount_net: number
          discount_pct: number
          event_id: string
          fixed_discount_net: number
          id: string
          net_after_discount: number
          notes: string | null
          organization_id: string
          sent_at: string | null
          status: string
          subtotal_net: number
          total_gross: number
          updated_at: string
          vat_amount: number
          vat_rate: number
          version_no: number
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          currency?: string
          discount_net?: number
          discount_pct?: number
          event_id: string
          fixed_discount_net?: number
          id?: string
          net_after_discount?: number
          notes?: string | null
          organization_id: string
          sent_at?: string | null
          status?: string
          subtotal_net?: number
          total_gross?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
          version_no?: number
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          currency?: string
          discount_net?: number
          discount_pct?: number
          event_id?: string
          fixed_discount_net?: number
          id?: string
          net_after_discount?: number
          notes?: string | null
          organization_id?: string
          sent_at?: string | null
          status?: string
          subtotal_net?: number
          total_gross?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_org_role: {
        Args: { target_org: string; target_role: string }
        Returns: boolean
      }
      is_org_member: { Args: { target_org: string }; Returns: boolean }
      is_org_member_path: { Args: { path_org: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
