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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          amount: number | null
          created_at: string | null
          employee_name: string | null
          id: number
          invoice_id: string | null
          po_number: string | null
          status: string | null
          supplier_name: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          employee_name?: string | null
          id?: number
          invoice_id?: string | null
          po_number?: string | null
          status?: string | null
          supplier_name?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          employee_name?: string | null
          id?: number
          invoice_id?: string | null
          po_number?: string | null
          status?: string | null
          supplier_name?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          date: string | null
          employee_id: number | null
          hours_worked: number | null
          id: number
          status: string | null
          time_in: string | null
          time_out: string | null
        }
        Insert: {
          date?: string | null
          employee_id?: number | null
          hours_worked?: number | null
          id?: number
          status?: string | null
          time_in?: string | null
          time_out?: string | null
        }
        Update: {
          date?: string | null
          employee_id?: number | null
          hours_worked?: number | null
          id?: number
          status?: string | null
          time_in?: string | null
          time_out?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          department_id: string | null
          employee_type: string | null
          first_name: string
          hire_date: string | null
          id: number
          last_name: string
          middle_initial: string | null
          phone_number: string | null
          position: string
          rate_per_day: number | null
          updated_at: string | null
          work_days_per_week: number | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          employee_type?: string | null
          first_name: string
          hire_date?: string | null
          id?: number
          last_name: string
          middle_initial?: string | null
          phone_number?: string | null
          position: string
          rate_per_day?: number | null
          updated_at?: string | null
          work_days_per_week?: number | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          employee_type?: string | null
          first_name?: string
          hire_date?: string | null
          id?: number
          last_name?: string
          middle_initial?: string | null
          phone_number?: string | null
          position?: string
          rate_per_day?: number | null
          updated_at?: string | null
          work_days_per_week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipts: {
        Row: {
          created_at: string | null
          gr_number: string
          id: string
          invoice_number: string
          po_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          gr_number: string
          id?: string
          invoice_number: string
          po_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          gr_number?: string
          id?: string
          invoice_number?: string
          po_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          available_quantity: number | null
          id: string
          item_id: string
          last_counted_at: string | null
          quantity: number
          reserved_quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          available_quantity?: number | null
          id?: string
          item_id: string
          last_counted_at?: string | null
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          available_quantity?: number | null
          id?: string
          item_id?: string
          last_counted_at?: string | null
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          created_at: string
          id: string
          is_acknowledged: boolean
          item_id: string
          message: string
          warehouse_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string
          id?: string
          is_acknowledged?: boolean
          item_id: string
          message: string
          warehouse_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          is_acknowledged?: boolean
          item_id?: string
          message?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          expiration_tracking: boolean | null
          id: string
          is_active: boolean
          max_threshold: number | null
          min_threshold: number | null
          name: string
          sku: string
          unit_of_measure: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          expiration_tracking?: boolean | null
          id?: string
          is_active?: boolean
          max_threshold?: number | null
          min_threshold?: number | null
          name: string
          sku: string
          unit_of_measure?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          expiration_tracking?: boolean | null
          id?: string
          is_active?: boolean
          max_threshold?: number | null
          min_threshold?: number | null
          name?: string
          sku?: string
          unit_of_measure?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: number | null
          available_stock: number | null
          contact_info: string
          created_at: string | null
          customer_name: string
          demand_quantity: number | null
          lead_id: number
          lead_status: string | null
          product_id: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: number | null
          available_stock?: number | null
          contact_info: string
          created_at?: string | null
          customer_name: string
          demand_quantity?: number | null
          lead_id?: number
          lead_status?: string | null
          product_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: number | null
          available_stock?: number | null
          contact_info?: string
          created_at?: string | null
          customer_name?: string
          demand_quantity?: number | null
          lead_id?: number
          lead_status?: string | null
          product_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          created_at: string | null
          days_worked: number
          deduction: number
          employee_id: number
          id: number
          payroll_period_end: string
          payroll_period_start: string
          salary: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_worked: number
          deduction: number
          employee_id: number
          id?: number
          payroll_period_end: string
          payroll_period_start: string
          salary: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_worked?: number
          deduction?: number
          employee_id?: number
          id?: number
          payroll_period_end?: string
          payroll_period_start?: string
          salary?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          price: number
          purchase_order_id: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          price: number
          purchase_order_id: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          price?: number
          purchase_order_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_date: string
          po_number: string
          requisition_id: string | null
          status: string
          supplier_id: string | null
          total: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          requisition_id?: string | null
          status?: string
          supplier_id?: string | null
          total?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          requisition_id?: string | null
          status?: string
          supplier_id?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisition_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          quantity: number
          requisition_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          quantity: number
          requisition_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          quantity?: number
          requisition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisition_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisition_items_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisitions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          request_date: string
          status: string
          supplier_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          request_date?: string
          status?: string
          supplier_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          request_date?: string
          status?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          assigned_to: number | null
          created_at: string | null
          customer_name: string
          lead_id: number
          product_id: string
          quantity: number
          quotation_id: number
          status: string | null
          total_amount: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          assigned_to?: number | null
          created_at?: string | null
          customer_name: string
          lead_id: number
          product_id: string
          quantity: number
          quotation_id?: number
          status?: string | null
          total_amount?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          assigned_to?: number | null
          created_at?: string | null
          customer_name?: string
          lead_id?: number
          product_id?: string
          quantity?: number
          quotation_id?: number
          status?: string | null
          total_amount?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "fk_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          expiration_date: string | null
          id: string
          item_id: string
          notes: string | null
          quantity: number
          reference_number: string | null
          total_cost: number | null
          transaction_type: string
          unit_cost: number | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          reference_number?: string | null
          total_cost?: number | null
          transaction_type: string
          unit_cost?: number | null
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expiration_date?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          reference_number?: string | null
          total_cost?: number | null
          transaction_type?: string
          unit_cost?: number | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_info: string | null
          contract: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          contact_info?: string | null
          contract?: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          contact_info?: string | null
          contract?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
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
      department_type:
        | "inventory"
        | "customer_service"
        | "procurement"
        | "supply_chain"
        | "finance"
        | "ecommerce"
        | "business_intelligence"
        | "sales"
        | "projects"
        | "hr"
      ecommerce_platform: "shopify" | "woocommerce" | "magento" | "custom"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      sync_status: "pending" | "synced" | "failed"
      transaction_type: "purchase" | "sale" | "adjustment" | "transfer"
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
    Enums: {
      department_type: [
        "inventory",
        "customer_service",
        "procurement",
        "supply_chain",
        "finance",
        "ecommerce",
        "business_intelligence",
        "sales",
        "projects",
        "hr",
      ],
      ecommerce_platform: ["shopify", "woocommerce", "magento", "custom"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      sync_status: ["pending", "synced", "failed"],
      transaction_type: ["purchase", "sale", "adjustment", "transfer"],
    },
  },
} as const
