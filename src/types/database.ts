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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line: string
          city: string
          country_code: string
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          latitude: number | null
          longitude: number | null
          phone: string
          recipient_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line: string
          city: string
          country_code?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          phone: string
          recipient_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string
          country_code?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string
          recipient_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json
          reason: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sections: {
        Row: {
          enabled: boolean
          icon_key: string | null
          key: string
          label: string
          required_permission: string | null
          route: string
          sort_order: number
        }
        Insert: {
          enabled?: boolean
          icon_key?: string | null
          key: string
          label: string
          required_permission?: string | null
          route: string
          sort_order?: number
        }
        Update: {
          enabled?: boolean
          icon_key?: string | null
          key?: string
          label?: string
          required_permission?: string | null
          route?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_sections_required_permission_fkey"
            columns: ["required_permission"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_hash: string | null
          metadata: Json
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          official_url: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          official_url?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          official_url?: string | null
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          badge_color: string | null
          badge_label: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          shop_id: string
          status: Database["public"]["Enums"]["certification_status"]
          type: Database["public"]["Enums"]["certification_type"]
        }
        Insert: {
          badge_color?: string | null
          badge_label?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_id: string
          status?: Database["public"]["Enums"]["certification_status"]
          type: Database["public"]["Enums"]["certification_type"]
        }
        Update: {
          badge_color?: string | null
          badge_label?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_id?: string
          status?: Database["public"]["Enums"]["certification_status"]
          type?: Database["public"]["Enums"]["certification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "certifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          seller_id: string
          shop_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          seller_id: string
          shop_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          seller_id?: string
          shop_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          assigned_at: string | null
          claim_expires_at: string | null
          company_id: string | null
          created_at: string
          delivered_at: string | null
          delivery_address: string | null
          driver_id: string | null
          failure_reason: string | null
          id: string
          order_id: string
          picked_up_at: string | null
          pickup_address: string | null
          proof_photo_url: string | null
          requested_at: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          claim_expires_at?: string | null
          company_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          driver_id?: string | null
          failure_reason?: string | null
          id?: string
          order_id: string
          picked_up_at?: string | null
          pickup_address?: string | null
          proof_photo_url?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          claim_expires_at?: string | null
          company_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          driver_id?: string | null
          failure_reason?: string | null
          id?: string
          order_id?: string
          picked_up_at?: string | null
          pickup_address?: string | null
          proof_photo_url?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_companies: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          phone: string | null
          status: Database["public"]["Enums"]["driver_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_push_tokens: {
        Row: {
          created_at: string
          device_label: string | null
          id: string
          is_active: boolean
          last_seen_at: string
          provider: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_label?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string
          provider: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_label?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string
          provider?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          opened_by: string
          order_id: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          opened_by: string
          order_id: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          opened_by?: string
          order_id?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          company_id: string | null
          created_at: string
          full_name: string
          id: string
          phone: string
          status: Database["public"]["Enums"]["driver_status"]
          updated_at: string
          user_id: string | null
          vehicle_reference: string | null
          vehicle_type: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone: string
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_reference?: string | null
          vehicle_type?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_reference?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_destination_links: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          updated_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
          url?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          brand_id: string | null
          created_at: string
          id: string
          product_id: string | null
          shop_id: string | null
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          shop_id?: string | null
          user_id: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          shop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_profiles: {
        Row: {
          created_at: string
          document_country: string | null
          document_last4: string | null
          document_path: string | null
          document_type: string | null
          expires_at: string | null
          id: string
          legal_name: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_country?: string | null
          document_last4?: string | null
          document_path?: string | null
          document_type?: string | null
          expires_at?: string | null
          id?: string
          legal_name?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_country?: string | null
          document_last4?: string | null
          document_path?: string | null
          document_type?: string | null
          expires_at?: string | null
          id?: string
          legal_name?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_profiles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json
          order_id: string | null
          payment_id: string | null
          reference: string
          type: Database["public"]["Enums"]["ledger_entry_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          payment_id?: string | null
          reference: string
          type: Database["public"]["Enums"]["ledger_entry_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          payment_id?: string | null
          reference?: string
          type?: Database["public"]["Enums"]["ledger_entry_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          order_id: string | null
          product_id: string | null
          sender_id: string
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          sender_id: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          sender_id?: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          currency: string
          id: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          shop_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          shop_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          shop_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          delivery_fee: number
          guest_address: string | null
          guest_city: string | null
          guest_name: string | null
          guest_phone: string | null
          guest_tracking_token_hash: string | null
          id: string
          idempotency_key: string | null
          order_number: string
          placed_at: string | null
          shipping_address_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          stock_reserved: boolean
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          delivery_fee?: number
          guest_address?: string | null
          guest_city?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_tracking_token_hash?: string | null
          id?: string
          idempotency_key?: string | null
          order_number: string
          placed_at?: string | null
          shipping_address_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stock_reserved?: boolean
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          delivery_fee?: number
          guest_address?: string | null
          guest_city?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_tracking_token_hash?: string | null
          id?: string
          idempotency_key?: string | null
          order_number?: string
          placed_at?: string | null
          shipping_address_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stock_reserved?: boolean
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_providers: {
        Row: {
          code: string
          configuration: Json
          created_at: string
          enabled: boolean
          id: string
          name: string
          supported_currencies: string[]
          updated_at: string
        }
        Insert: {
          code: string
          configuration?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          supported_currencies?: string[]
          updated_at?: string
        }
        Update: {
          code?: string
          configuration?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          supported_currencies?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          currency: string
          id: string
          idempotency_key: string
          metadata: Json
          order_id: string
          paid_at: string | null
          provider: string
          provider_payment_id: string | null
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          currency?: string
          id?: string
          idempotency_key: string
          metadata?: Json
          order_id: string
          paid_at?: string | null
          provider: string
          provider_payment_id?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          order_id?: string
          paid_at?: string | null
          provider?: string
          provider_payment_id?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          approved_at: string | null
          created_at: string
          currency: string
          destination_reference: string | null
          destination_type: string | null
          failure_reason: string | null
          id: string
          paid_at: string | null
          provider: string | null
          provider_payout_id: string | null
          requested_at: string
          seller_id: string
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
          wallet_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          created_at?: string
          currency?: string
          destination_reference?: string | null
          destination_type?: string | null
          failure_reason?: string | null
          id?: string
          paid_at?: string | null
          provider?: string | null
          provider_payout_id?: string | null
          requested_at?: string
          seller_id: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          created_at?: string
          currency?: string
          destination_reference?: string | null
          destination_type?: string | null
          failure_reason?: string | null
          id?: string
          paid_at?: string | null
          provider?: string | null
          provider_payout_id?: string | null
          requested_at?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: number
          key: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          key: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          key?: string
        }
        Relationships: []
      }
      phone_countries: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          dial_code: string
          enabled: boolean
          id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          dial_code: string
          enabled?: boolean
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          dial_code?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      phone_country_settings: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          dial_code: string
          flag_emoji: string | null
          id: string
          is_active: boolean
          sms_auth_enabled: boolean
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          dial_code: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          sms_auth_enabled?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          dial_code?: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean
          sms_auth_enabled?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          brand: string | null
          brand_id: string | null
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          is_featured: boolean
          name: string
          perfume_volume_ml: number | null
          product_type: string
          shop_id: string
          size_stock: Json
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number
          updated_at: string
          volume_ml: number | null
        }
        Insert: {
          base_price?: number
          brand?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          name: string
          perfume_volume_ml?: number | null
          product_type?: string
          shop_id: string
          size_stock?: Json
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          updated_at?: string
          volume_ml?: number | null
        }
        Update: {
          base_price?: number
          brand?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          perfume_volume_ml?: number | null
          product_type?: string
          shop_id?: string
          size_stock?: Json
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          updated_at?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country_code: string
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          is_suspended: boolean
          last_name: string | null
          phone: string | null
          phone_verified_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id: string
          is_suspended?: boolean
          last_name?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          is_suspended?: boolean
          last_name?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_attempts: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          currency: string
          id: string
          qualified_at: string | null
          referral_code: string
          referred_user_id: string | null
          referrer_id: string
          reward_amount: number
          rewarded_at: string | null
          status: Database["public"]["Enums"]["referral_status"]
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          qualified_at?: string | null
          referral_code: string
          referred_user_id?: string | null
          referrer_id: string
          reward_amount?: number
          rewarded_at?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          qualified_at?: string | null
          referral_code?: string
          referred_user_id?: string | null
          referrer_id?: string
          reward_amount?: number
          rewarded_at?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          payment_id: string | null
          processed_at: string | null
          provider_refund_id: string | null
          reason: string | null
          requested_by: string
          status: Database["public"]["Enums"]["refund_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          payment_id?: string | null
          processed_at?: string | null
          provider_refund_id?: string | null
          reason?: string | null
          requested_by: string
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          payment_id?: string | null
          processed_at?: string | null
          provider_refund_id?: string | null
          reason?: string | null
          requested_by?: string
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          resolution_note: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          apple_maps_url: string | null
          city: string | null
          country_code: string
          created_at: string
          description: string | null
          google_maps_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          shop_id: string | null
          status: Database["public"]["Enums"]["restaurant_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          apple_maps_url?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          shop_id?: string | null
          status?: Database["public"]["Enums"]["restaurant_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          apple_maps_url?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          shop_id?: string | null
          status?: Database["public"]["Enums"]["restaurant_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_published: boolean
          order_id: string | null
          product_id: string | null
          rating: number
          shop_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_id?: string | null
          product_id?: string | null
          rating: number
          shop_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          order_id?: string | null
          product_id?: string | null
          rating?: number
          shop_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: number
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          permission_id: number
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          permission_id?: number
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          background_color: string | null
          background_image_url: string | null
          banner_url: string | null
          city: string | null
          country_code: string
          created_at: string
          description: string | null
          id: string
          instagram: string | null
          is_premium: boolean
          is_pro: boolean
          is_restaurant: boolean
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          slug: string
          snapchat: string | null
          status: Database["public"]["Enums"]["shop_status"]
          tiktok: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          background_color?: string | null
          background_image_url?: string | null
          banner_url?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          is_premium?: boolean
          is_pro?: boolean
          is_restaurant?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          slug: string
          snapchat?: string | null
          status?: Database["public"]["Enums"]["shop_status"]
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          background_color?: string | null
          background_image_url?: string | null
          banner_url?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          is_premium?: boolean
          is_pro?: boolean
          is_restaurant?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string
          snapchat?: string | null
          status?: Database["public"]["Enums"]["shop_status"]
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          caption: string
          created_at: string
          id: string
          media_url: string | null
          owner_id: string
          platforms: string[]
          product_url: string | null
          scheduled_at: string
          shop_id: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          caption: string
          created_at?: string
          id?: string
          media_url?: string | null
          owner_id: string
          platforms?: string[]
          product_url?: string | null
          scheduled_at: string
          shop_id: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          id?: string
          media_url?: string | null
          owner_id?: string
          platforms?: string[]
          product_url?: string | null
          scheduled_at?: string
          shop_id?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      store_promotions: {
        Row: {
          attributed_sales: number
          budget: number
          clicks: number
          created_at: string
          end_at: string | null
          favorites: number
          id: string
          placement: string
          shop_id: string
          start_at: string | null
          status: Database["public"]["Enums"]["promotion_status"]
          updated_at: string
          views: number
          visits: number
        }
        Insert: {
          attributed_sales?: number
          budget?: number
          clicks?: number
          created_at?: string
          end_at?: string | null
          favorites?: number
          id?: string
          placement: string
          shop_id: string
          start_at?: string | null
          status?: Database["public"]["Enums"]["promotion_status"]
          updated_at?: string
          views?: number
          visits?: number
        }
        Update: {
          attributed_sales?: number
          budget?: number
          clicks?: number
          created_at?: string
          end_at?: string | null
          favorites?: number
          id?: string
          placement?: string
          shop_id?: string
          start_at?: string | null
          status?: Database["public"]["Enums"]["promotion_status"]
          updated_at?: string
          views?: number
          visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_promotions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      store_subscriptions: {
        Row: {
          amount: number
          cancelled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string
          id: string
          owner_id: string
          plan_name: string
          provider: string | null
          provider_subscription_id: string | null
          shop_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          owner_id: string
          plan_name?: string
          provider?: string | null
          provider_subscription_id?: string | null
          shop_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          owner_id?: string
          plan_name?: string
          provider?: string | null
          provider_subscription_id?: string | null
          shop_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_subscriptions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_subscriptions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_devices: {
        Row: {
          approved_at: string | null
          created_at: string
          device_name: string
          device_token_digest: string
          id: string
          last_seen_at: string | null
          revoked_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          device_name: string
          device_token_digest: string
          id?: string
          last_seen_at?: string | null
          revoked_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          device_name?: string
          device_token_digest?: string
          id?: string
          last_seen_at?: string | null
          revoked_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      super_admin_identities: {
        Row: {
          access_key_digest: string
          access_key_salt: string
          created_at: string
          first_name: string
          first_name_normalized: string
          last_name: string
          last_name_normalized: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_key_digest: string
          access_key_salt: string
          created_at?: string
          first_name: string
          first_name_normalized: string
          last_name: string
          last_name_normalized: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_key_digest?: string
          access_key_salt?: string
          created_at?: string
          first_name?: string
          first_name_normalized?: string
          last_name?: string
          last_name_normalized?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
          value_type: Database["public"]["Enums"]["setting_value_type"]
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
          value_type: Database["public"]["Enums"]["setting_value_type"]
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
          value_type?: Database["public"]["Enums"]["setting_value_type"]
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: number
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          available_balance: number
          blocked_balance: number
          created_at: string
          currency: string
          id: string
          pending_balance: number
          status: Database["public"]["Enums"]["wallet_status"]
          updated_at: string
          user_id: string
          withdrawn_total: number
        }
        Insert: {
          available_balance?: number
          blocked_balance?: number
          created_at?: string
          currency?: string
          id?: string
          pending_balance?: number
          status?: Database["public"]["Enums"]["wallet_status"]
          updated_at?: string
          user_id: string
          withdrawn_total?: number
        }
        Update: {
          available_balance?: number
          blocked_balance?: number
          created_at?: string
          currency?: string
          id?: string
          pending_balance?: number
          status?: Database["public"]["Enums"]["wallet_status"]
          updated_at?: string
          user_id?: string
          withdrawn_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connection: {
        Row: {
          ai_assistant_enabled: boolean
          auto_replies_enabled: boolean
          business_name: string | null
          connected_at: string | null
          connected_by: string | null
          human_handoff_enabled: boolean
          id: number
          last_error: string | null
          last_verified_at: string | null
          meta_business_id: string | null
          notifications_enabled: boolean
          phone_number_display: string | null
          phone_number_id: string | null
          status: Database["public"]["Enums"]["whatsapp_connection_status"]
          updated_at: string
          verification_codes_enabled: boolean
          waba_id: string | null
          webhook_status: Database["public"]["Enums"]["whatsapp_webhook_status"]
          whatsapp_login_enabled: boolean
        }
        Insert: {
          ai_assistant_enabled?: boolean
          auto_replies_enabled?: boolean
          business_name?: string | null
          connected_at?: string | null
          connected_by?: string | null
          human_handoff_enabled?: boolean
          id?: number
          last_error?: string | null
          last_verified_at?: string | null
          meta_business_id?: string | null
          notifications_enabled?: boolean
          phone_number_display?: string | null
          phone_number_id?: string | null
          status?: Database["public"]["Enums"]["whatsapp_connection_status"]
          updated_at?: string
          verification_codes_enabled?: boolean
          waba_id?: string | null
          webhook_status?: Database["public"]["Enums"]["whatsapp_webhook_status"]
          whatsapp_login_enabled?: boolean
        }
        Update: {
          ai_assistant_enabled?: boolean
          auto_replies_enabled?: boolean
          business_name?: string | null
          connected_at?: string | null
          connected_by?: string | null
          human_handoff_enabled?: boolean
          id?: number
          last_error?: string | null
          last_verified_at?: string | null
          meta_business_id?: string | null
          notifications_enabled?: boolean
          phone_number_display?: string | null
          phone_number_id?: string | null
          status?: Database["public"]["Enums"]["whatsapp_connection_status"]
          updated_at?: string
          verification_codes_enabled?: boolean
          waba_id?: string | null
          webhook_status?: Database["public"]["Enums"]["whatsapp_webhook_status"]
          whatsapp_login_enabled?: boolean
        }
        Relationships: []
      }
      whatsapp_secret: {
        Row: {
          access_token: string | null
          id: number
          token_expires_at: string | null
          updated_at: string
          webhook_verify_token: string | null
        }
        Insert: {
          access_token?: string | null
          id?: number
          token_expires_at?: string | null
          updated_at?: string
          webhook_verify_token?: string | null
        }
        Update: {
          access_token?: string | null
          id?: number
          token_expires_at?: string | null
          updated_at?: string
          webhook_verify_token?: string | null
        }
        Relationships: []
      }
      withdrawal_rules: {
        Row: {
          created_at: string
          currency: string
          daily_limit: number | null
          enabled: boolean
          fee_amount: number
          fee_percent: number
          id: string
          kyc_required: boolean
          manual_approval_required: boolean
          max_amount: number | null
          min_amount: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          daily_limit?: number | null
          enabled?: boolean
          fee_amount?: number
          fee_percent?: number
          id?: string
          kyc_required?: boolean
          manual_approval_required?: boolean
          max_amount?: number | null
          min_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          daily_limit?: number | null
          enabled?: boolean
          fee_amount?: number
          fee_percent?: number
          id?: string
          kyc_required?: boolean
          manual_approval_required?: boolean
          max_amount?: number | null
          min_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_finance_summary: {
        Row: {
          commission_volume: number | null
          open_disputes: number | null
          paid_payments: number | null
          paid_volume: number | null
          pending_payout_amount: number | null
          pending_payouts: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_finance_snapshot: { Args: never; Returns: Json }
      admin_moderate_review: {
        Args: { p_note?: string; p_publish: boolean; p_review_id: string }
        Returns: undefined
      }
      admin_operations_snapshot: { Args: never; Returns: Json }
      admin_overview_snapshot: { Args: never; Returns: Json }
      admin_set_associate_role: {
        Args: { p_enabled: boolean; p_note?: string; p_user_id: string }
        Returns: undefined
      }
      admin_set_setting: {
        Args: { p_actor: string; p_key: string; p_value: Json }
        Returns: undefined
      }
      admin_set_user_suspension: {
        Args: { p_reason?: string; p_suspended: boolean; p_user_id: string }
        Returns: undefined
      }
      admin_shops_list: { Args: { p_limit?: number }; Returns: Json }
      admin_update_dispute: {
        Args: { p_action: string; p_dispute_id: string; p_note?: string }
        Returns: undefined
      }
      admin_update_kyc: {
        Args: { p_action: string; p_kyc_id: string; p_reason?: string }
        Returns: undefined
      }
      admin_update_payout: {
        Args: { p_action: string; p_payout_id: string; p_reason?: string }
        Returns: undefined
      }
      admin_update_report: {
        Args: { p_action: string; p_note?: string; p_report_id: string }
        Returns: undefined
      }
      admin_user_directory: { Args: { p_limit?: number }; Returns: Json }
      buyer_cancel_order: { Args: { p_order_id: string }; Returns: undefined }
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_attempts: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      create_guest_order:
        | {
            Args: {
              p_buyer_id: string
              p_guest_address: string
              p_guest_city: string
              p_guest_name: string
              p_guest_phone: string
              p_idempotency_key: string
              p_product_id: string
              p_tracking_token_hash: string
              p_website: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_buyer_id: string
              p_guest_address: string
              p_guest_city: string
              p_guest_name: string
              p_guest_phone: string
              p_idempotency_key: string
              p_product_id: string
              p_quantity: number
              p_tracking_token_hash: string
              p_website: string
            }
            Returns: Json
          }
      create_payment_intent: {
        Args: {
          p_idempotency_key: string
          p_order_id: string
          p_provider: string
        }
        Returns: string
      }
      current_user_has_permission: {
        Args: { p_permission_key: string }
        Returns: boolean
      }
      decrement_product_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      driver_claim_delivery: { Args: { p_delivery_id: string }; Returns: Json }
      driver_confirm_delivery_code: {
        Args: { p_code: string; p_delivery_id: string }
        Returns: boolean
      }
      driver_list_assigned_deliveries: {
        Args: never
        Returns: {
          assigned_at: string
          created_at: string
          delivered_at: string
          delivery_address: string
          delivery_code_hint: string
          delivery_id: string
          failure_reason: string
          order_id: string
          order_number: string
          picked_up_at: string
          pickup_address: string
          status: Database["public"]["Enums"]["delivery_status"]
        }[]
      }
      driver_list_available_deliveries: {
        Args: never
        Returns: {
          created_at: string
          delivery_id: string
          order_id: string
          order_number: string
          pickup_address: string
          requested_at: string
        }[]
      }
      driver_update_delivery_status: {
        Args: {
          p_delivery_id: string
          p_status: Database["public"]["Enums"]["delivery_status"]
        }
        Returns: boolean
      }
      finance_totals: { Args: never; Returns: Json }
      get_guest_order: {
        Args: { p_order_number: string; p_tracking_token_hash: string }
        Returns: Json
      }
      has_any_admin_role: { Args: never; Returns: boolean }
      has_role: {
        Args: { required_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      seller_cancel_order: { Args: { p_order_id: string }; Returns: undefined }
      seller_confirm_order: { Args: { p_order_id: string }; Returns: undefined }
      seller_request_delivery: {
        Args: {
          p_actor_id: string
          p_code_ciphertext: string
          p_code_hash: string
          p_code_hint: string
          p_order_id: string
        }
        Returns: number
      }
    }
    Enums: {
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "approve"
        | "reject"
        | "freeze"
        | "unfreeze"
        | "login"
        | "logout"
        | "payment"
        | "refund"
        | "payout"
        | "role_change"
        | "config_change"
        | "block"
        | "unblock"
        | "permission_change"
      certification_status: "pending" | "approved" | "rejected" | "revoked"
      certification_type: "business" | "shop" | "premium"
      delivery_status:
        | "unassigned"
        | "assigned"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "failed"
        | "cancelled"
      dispute_status:
        | "open"
        | "under_review"
        | "resolved_buyer"
        | "resolved_seller"
        | "rejected"
        | "closed"
      driver_status: "pending" | "active" | "suspended" | "inactive"
      kyc_status:
        | "not_started"
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
      ledger_entry_type:
        | "sale"
        | "commission"
        | "payment"
        | "refund"
        | "payout"
        | "adjustment"
        | "reserve"
        | "release"
      message_type: "text" | "order_link" | "product_link"
      notification_type:
        | "order"
        | "payment"
        | "payout"
        | "message"
        | "promotion"
        | "system"
        | "security"
        | "delivery"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "ready_for_delivery"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
        | "disputed"
      payment_status:
        | "pending"
        | "authorized"
        | "paid"
        | "failed"
        | "cancelled"
        | "refunded"
        | "partially_refunded"
      payout_status:
        | "pending"
        | "approved"
        | "processing"
        | "paid"
        | "failed"
        | "cancelled"
        | "rejected"
      product_status: "draft" | "pending" | "active" | "rejected" | "archived"
      promotion_status:
        | "draft"
        | "pending"
        | "active"
        | "paused"
        | "completed"
        | "rejected"
      referral_status:
        | "pending"
        | "qualified"
        | "rewarded"
        | "expired"
        | "rejected"
      refund_status:
        | "requested"
        | "approved"
        | "processing"
        | "completed"
        | "failed"
        | "rejected"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      restaurant_status: "draft" | "pending" | "active" | "suspended" | "closed"
      setting_value_type: "string" | "number" | "boolean" | "json"
      shop_status: "draft" | "pending" | "active" | "suspended" | "closed"
      subscription_status: "active" | "past_due" | "cancelled" | "expired"
      user_role:
        | "super_admin"
        | "admin"
        | "moderator"
        | "finance_admin"
        | "support_admin"
        | "kyc_admin"
        | "catalog_admin"
        | "associate"
        | "seller"
        | "buyer"
      wallet_status: "active" | "frozen" | "closed"
      whatsapp_connection_status:
        | "disconnected"
        | "connecting"
        | "connected"
        | "expired"
        | "error"
        | "unavailable"
      whatsapp_webhook_status: "operational" | "error" | "not_configured"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      audit_action: [
        "create",
        "update",
        "delete",
        "approve",
        "reject",
        "freeze",
        "unfreeze",
        "login",
        "logout",
        "payment",
        "refund",
        "payout",
        "role_change",
        "config_change",
        "block",
        "unblock",
        "permission_change",
      ],
      certification_status: ["pending", "approved", "rejected", "revoked"],
      certification_type: ["business", "shop", "premium"],
      delivery_status: [
        "unassigned",
        "assigned",
        "picked_up",
        "in_transit",
        "delivered",
        "failed",
        "cancelled",
      ],
      dispute_status: [
        "open",
        "under_review",
        "resolved_buyer",
        "resolved_seller",
        "rejected",
        "closed",
      ],
      driver_status: ["pending", "active", "suspended", "inactive"],
      kyc_status: ["not_started", "pending", "approved", "rejected", "expired"],
      ledger_entry_type: [
        "sale",
        "commission",
        "payment",
        "refund",
        "payout",
        "adjustment",
        "reserve",
        "release",
      ],
      message_type: ["text", "order_link", "product_link"],
      notification_type: [
        "order",
        "payment",
        "payout",
        "message",
        "promotion",
        "system",
        "security",
        "delivery",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "ready_for_delivery",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
        "disputed",
      ],
      payment_status: [
        "pending",
        "authorized",
        "paid",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      payout_status: [
        "pending",
        "approved",
        "processing",
        "paid",
        "failed",
        "cancelled",
        "rejected",
      ],
      product_status: ["draft", "pending", "active", "rejected", "archived"],
      promotion_status: [
        "draft",
        "pending",
        "active",
        "paused",
        "completed",
        "rejected",
      ],
      referral_status: [
        "pending",
        "qualified",
        "rewarded",
        "expired",
        "rejected",
      ],
      refund_status: [
        "requested",
        "approved",
        "processing",
        "completed",
        "failed",
        "rejected",
      ],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      restaurant_status: ["draft", "pending", "active", "suspended", "closed"],
      setting_value_type: ["string", "number", "boolean", "json"],
      shop_status: ["draft", "pending", "active", "suspended", "closed"],
      subscription_status: ["active", "past_due", "cancelled", "expired"],
      user_role: [
        "super_admin",
        "admin",
        "moderator",
        "finance_admin",
        "support_admin",
        "kyc_admin",
        "catalog_admin",
        "associate",
        "seller",
        "buyer",
      ],
      wallet_status: ["active", "frozen", "closed"],
      whatsapp_connection_status: [
        "disconnected",
        "connecting",
        "connected",
        "expired",
        "error",
        "unavailable",
      ],
      whatsapp_webhook_status: ["operational", "error", "not_configured"],
    },
  },
} as const
