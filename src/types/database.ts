export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      deliveries: {
        Row: {
          assigned_at: string | null
          claim_expires_at: string | null
          company_id: string | null
          created_at: string
          delivered_at: string | null
          delivery_address: string | null
          delivery_code_hash: string | null
          delivery_code_hint: string | null
          driver_id: string | null
          failure_reason: string | null
          id: string
          order_id: string
          picked_up_at: string | null
          pickup_address: string | null
          proof_photo_url: string | null
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
          delivery_code_hash?: string | null
          delivery_code_hint?: string | null
          driver_id?: string | null
          failure_reason?: string | null
          id?: string
          order_id: string
          picked_up_at?: string | null
          pickup_address?: string | null
          proof_photo_url?: string | null
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
          delivery_code_hash?: string | null
          delivery_code_hint?: string | null
          driver_id?: string | null
          failure_reason?: string | null
          id?: string
          order_id?: string
          picked_up_at?: string | null
          pickup_address?: string | null
          proof_photo_url?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      kyc_profiles: {
        Row: {
          created_at: string
          document_country: string | null
          document_last4: string | null
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      orders: {
        Row: {
          buyer_id: string | null
          cancelled_at: string | null
          created_at: string
          currency: string
          guest_name: string | null
          guest_phone: string | null
          delivery_city: string | null
          delivery_address: string | null
          guest_access_token_hash: string | null
          delivered_at: string | null
          delivery_fee: number
          id: string
          order_number: string
          placed_at: string | null
          shipping_address_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          guest_name?: string | null
          guest_phone?: string | null
          delivery_city?: string | null
          delivery_address?: string | null
          guest_access_token_hash?: string | null
          delivered_at?: string | null
          delivery_fee?: number
          id?: string
          order_number: string
          placed_at?: string | null
          shipping_address_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          guest_name?: string | null
          guest_phone?: string | null
          delivery_city?: string | null
          delivery_address?: string | null
          guest_access_token_hash?: string | null
          delivered_at?: string | null
          delivery_fee?: number
          id?: string
          order_number?: string
          placed_at?: string | null
          shipping_address_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      products: {
        Row: {
          base_price: number
          brand_id: string | null
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          is_featured: boolean
          name: string
          shop_id: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          base_price?: number
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          name: string
          shop_id: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          base_price?: number
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          shop_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
      admin_finance_snapshot: { Args: Record<PropertyKey, never>; Returns: Json }
      admin_operations_snapshot: { Args: Record<PropertyKey, never>; Returns: Json }
      admin_overview_snapshot: { Args: Record<PropertyKey, never>; Returns: Json }
      admin_set_setting: {
        Args: { p_actor: string; p_key: string; p_value: Json }
        Returns: undefined
      }
      admin_set_user_suspension: {
        Args: { p_reason?: string; p_suspended: boolean; p_user_id: string }
        Returns: undefined
      }
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
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_attempts: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      create_payment_intent: {
        Args: {
          p_idempotency_key: string
          p_order_id: string
          p_provider: string
        }
        Returns: string
      }
      decrement_product_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      finance_totals: { Args: Record<PropertyKey, never>; Returns: Json }
      has_any_admin_role: { Args: Record<PropertyKey, never>; Returns: boolean }
      has_role: {
        Args: { required_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
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
      whatsapp_connection_status:
        | "disconnected"
        | "connecting"
        | "connected"
        | "expired"
        | "error"
        | "unavailable"
      whatsapp_webhook_status: "operational" | "error" | "not_configured"
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
        | "seller"
        | "buyer"
      wallet_status: "active" | "frozen" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]

export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]
