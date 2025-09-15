export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ecommerce_orders: {
        Row: {
          id: string
          external_order_id: string
          customer_id: string
          customer_name: string
          order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          total_amount: number
          currency: string
          items: Json
          shipping_address: Json
          platform: 'shopify' | 'woocommerce' | 'magento' | 'custom'
          sync_status: 'synced' | 'pending' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          external_order_id: string
          customer_id: string
          customer_name: string
          order_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          total_amount: number
          currency?: string
          items: Json
          shipping_address: Json
          platform: 'shopify' | 'woocommerce' | 'magento' | 'custom'
          sync_status?: 'synced' | 'pending' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          external_order_id?: string
          customer_id?: string
          customer_name?: string
          order_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          total_amount?: number
          currency?: string
          items?: Json
          shipping_address?: Json
          platform?: 'shopify' | 'woocommerce' | 'magento' | 'custom'
          sync_status?: 'synced' | 'pending' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
