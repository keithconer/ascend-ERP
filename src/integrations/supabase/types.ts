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
          invoice_id: string
          po_number: string | null
          status: string | null
          supplier_name: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          employee_name?: string | null
          id?: number
          invoice_id: string
          po_number?: string | null
          status?: string | null
          supplier_name?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          employee_name?: string | null
          id?: number
          invoice_id?: string
          po_number?: string | null
          status?: string | null
          supplier_name?: string | null
        }
        Relationships: []
      }
      accounts_receivable: {
        Row: {
          created_at: string | null
          customer_id: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_id: string
          paid_date: string | null
          payment_status: string | null
          sales_order_id: string | null
          total_amount: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_id: string
          paid_date?: string | null
          payment_status?: string | null
          sales_order_id?: string | null
          total_amount: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_id?: string
          paid_date?: string | null
          payment_status?: string | null
          sales_order_id?: string | null
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          date: string
          employee_id: number | null
          hours_worked: number | null
          id: number
          status: string | null
          time_in: string | null
          time_out: string | null
        }
        Insert: {
          date: string
          employee_id?: number | null
          hours_worked?: number | null
          id?: number
          status?: string | null
          time_in?: string | null
          time_out?: string | null
        }
        Update: {
          date?: string
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
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_issues: {
        Row: {
          created_at: string | null
          customer_id: string | null
          description: string | null
          id: string
          issue_id: string
          issue_type: string
          order_id: string | null
          status: string | null
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          issue_id: string
          issue_type: string
          order_id?: string | null
          status?: string | null
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          issue_id?: string
          issue_type?: string
          order_id?: string | null
          status?: string | null
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_issues_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_issues_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_issues_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_tickets"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      customer_solutions: {
        Row: {
          created_at: string | null
          id: string
          issue_id: string
          quantity: number | null
          solution_description: string | null
          solution_id: string
          solution_type: string
          status: string | null
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_id: string
          quantity?: number | null
          solution_description?: string | null
          solution_id: string
          solution_type: string
          status?: string | null
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_id?: string
          quantity?: number | null
          solution_description?: string | null
          solution_id?: string
          solution_type?: string
          status?: string | null
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_solutions_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: true
            referencedRelation: "customer_issues"
            referencedColumns: ["issue_id"]
          },
          {
            foreignKeyName: "customer_solutions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_tickets"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      customer_tickets: {
        Row: {
          assigned_to: number | null
          contact_info: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string
          description: string | null
          id: string
          internal_notes: string | null
          issue_type: string
          order_id: string | null
          priority: string | null
          resolution_status: string | null
          solution: string | null
          status: string | null
          ticket_id: string
          track_status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: number | null
          contact_info?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          description?: string | null
          id?: string
          internal_notes?: string | null
          issue_type: string
          order_id?: string | null
          priority?: string | null
          resolution_status?: string | null
          solution?: string | null
          status?: string | null
          ticket_id: string
          track_status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: number | null
          contact_info?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          description?: string | null
          id?: string
          internal_notes?: string | null
          issue_type?: string
          order_id?: string | null
          priority?: string | null
          resolution_status?: string | null
          solution?: string | null
          status?: string | null
          ticket_id?: string
          track_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          contact_info: string | null
          created_at: string | null
          customer_id: string
          customer_name: string
          deleted_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          contact_info?: string | null
          created_at?: string | null
          customer_id: string
          customer_name: string
          deleted_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          contact_info?: string | null
          created_at?: string | null
          customer_id?: string
          customer_name?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      demand_forecasting: {
        Row: {
          created_at: string | null
          forecast_id: string
          id: string
          lead_time: number | null
          notes: string | null
          plan_id: string | null
          predicted_demand: number
          product_id: string
          recommend_order_qty: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          forecast_id: string
          id?: string
          lead_time?: number | null
          notes?: string | null
          plan_id?: string | null
          predicted_demand: number
          product_id: string
          recommend_order_qty?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          forecast_id?: string
          id?: string
          lead_time?: number | null
          notes?: string | null
          plan_id?: string | null
          predicted_demand?: number
          product_id?: string
          recommend_order_qty?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_forecasting_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "supply_chain_plans"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "demand_forecasting_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          department_id: number | null
          employee_type: string | null
          first_name: string
          hire_date: string | null
          id: number
          last_name: string
          middle_initial: string | null
          phone_number: string | null
          position: string | null
          rate_per_day: number | null
          updated_at: string | null
          work_days_per_week: number | null
        }
        Insert: {
          created_at?: string | null
          department_id?: number | null
          employee_type?: string | null
          first_name: string
          hire_date?: string | null
          id?: number
          last_name: string
          middle_initial?: string | null
          phone_number?: string | null
          position?: string | null
          rate_per_day?: number | null
          updated_at?: string | null
          work_days_per_week?: number | null
        }
        Update: {
          created_at?: string | null
          department_id?: number | null
          employee_type?: string | null
          first_name?: string
          hire_date?: string | null
          id?: number
          last_name?: string
          middle_initial?: string | null
          phone_number?: string | null
          position?: string | null
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
          invoice_number: string | null
          po_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          gr_number: string
          id?: string
          invoice_number?: string | null
          po_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          gr_number?: string
          id?: string
          invoice_number?: string | null
          po_id?: string
          status?: string
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
          created_at: string | null
          description: string | null
          expiration_tracking: boolean | null
          id: string
          is_active: boolean | null
          max_threshold: number | null
          min_threshold: number | null
          name: string
          sku: string
          unit_of_measure: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expiration_tracking?: boolean | null
          id?: string
          is_active?: boolean | null
          max_threshold?: number | null
          min_threshold?: number | null
          name: string
          sku: string
          unit_of_measure?: string | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expiration_tracking?: boolean | null
          id?: string
          is_active?: boolean | null
          max_threshold?: number | null
          min_threshold?: number | null
          name?: string
          sku?: string
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string | null
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
          contact_info: string | null
          created_at: string | null
          customer_name: string
          demand_quantity: number
          lead_id: number
          lead_status: string | null
          product_id: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: number | null
          available_stock?: number | null
          contact_info?: string | null
          created_at?: string | null
          customer_name: string
          demand_quantity: number
          lead_id?: number
          lead_status?: string | null
          product_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: number | null
          available_stock?: number | null
          contact_info?: string | null
          created_at?: string | null
          customer_name?: string
          demand_quantity?: number
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
      m9_project_employees: {
        Row: {
          assigned_at: string | null
          employee_id: number | null
          id: number
          project_id: number | null
        }
        Insert: {
          assigned_at?: string | null
          employee_id?: number | null
          id?: never
          project_id?: number | null
        }
        Update: {
          assigned_at?: string | null
          employee_id?: number | null
          id?: never
          project_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "m9_project_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "m9_project_employees_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "m9_projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      m9_project_tasks: {
        Row: {
          assigned_employee_id: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: number
          project_id: number | null
          start_date: string | null
          task_id: number
          updated_at: string | null
        }
        Insert: {
          assigned_employee_id?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: never
          project_id?: number | null
          start_date?: string | null
          task_id: number
          updated_at?: string | null
        }
        Update: {
          assigned_employee_id?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: never
          project_id?: number | null
          start_date?: string | null
          task_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "m9_project_tasks_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "m9_project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "m9_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "m9_project_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "m9_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      m9_project_type_assigned: {
        Row: {
          assigned_at: string | null
          assigned_id: number
          employee_id: number
          project_type_id: number | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_id?: number
          employee_id: number
          project_type_id?: number | null
        }
        Update: {
          assigned_at?: string | null
          assigned_id?: number
          employee_id?: number
          project_type_id?: number | null
        }
        Relationships: []
      }
      m9_projects: {
        Row: {
          created_at: string | null
          estimated_cost: number | null
          expected_end_date: string | null
          project_code: string
          project_id: number
          project_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_cost?: number | null
          expected_end_date?: string | null
          project_code: string
          project_id?: never
          project_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_cost?: number | null
          expected_end_date?: string | null
          project_code?: string
          project_id?: never
          project_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      m9_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          task_code: string
          task_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          task_code: string
          task_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          task_code?: string
          task_name?: string
        }
        Relationships: []
      }
      payroll: {
        Row: {
          created_at: string | null
          days_worked: number | null
          deduction: number | null
          employee_id: number | null
          id: number
          payroll_period_end: string | null
          payroll_period_start: string | null
          salary: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_worked?: number | null
          deduction?: number | null
          employee_id?: number | null
          id?: number
          payroll_period_end?: string | null
          payroll_period_start?: string | null
          salary?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_worked?: number | null
          deduction?: number | null
          employee_id?: number | null
          id?: number
          payroll_period_end?: string | null
          payroll_period_start?: string | null
          salary?: number | null
          status?: string
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
          po_number: string | null
          requisition_id: string | null
          status: string
          supplier_id: string
          total: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string | null
          requisition_id?: string | null
          status?: string
          supplier_id: string
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string | null
          requisition_id?: string | null
          status?: string
          supplier_id?: string
          total?: number | null
          updated_at?: string | null
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
            foreignKeyName: "purchase_requisitions_supplier_id_fkey"
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
          lead_id: number | null
          product_id: string | null
          quantity: number
          quotation_id: number
          status: string | null
          total_amount: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          assigned_to?: number | null
          created_at?: string | null
          customer_name: string
          lead_id?: number | null
          product_id?: string | null
          quantity: number
          quotation_id?: number
          status?: string | null
          total_amount: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          assigned_to?: number | null
          created_at?: string | null
          customer_name?: string
          lead_id?: number | null
          product_id?: string | null
          quantity?: number
          quotation_id?: number
          status?: string | null
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "quotations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      routing_management: {
        Row: {
          created_at: string | null
          departure_time: string | null
          destination_supplier_id: string
          distance_km: number | null
          expected_arrival_time: string | null
          id: string
          plan_id: string | null
          route_id: string
          route_status: string
          source_warehouse_id: string
          updated_at: string | null
          vehicle_assigned: string | null
        }
        Insert: {
          created_at?: string | null
          departure_time?: string | null
          destination_supplier_id: string
          distance_km?: number | null
          expected_arrival_time?: string | null
          id?: string
          plan_id?: string | null
          route_id: string
          route_status?: string
          source_warehouse_id: string
          updated_at?: string | null
          vehicle_assigned?: string | null
        }
        Update: {
          created_at?: string | null
          departure_time?: string | null
          destination_supplier_id?: string
          distance_km?: number | null
          expected_arrival_time?: string | null
          id?: string
          plan_id?: string | null
          route_id?: string
          route_status?: string
          source_warehouse_id?: string
          updated_at?: string | null
          vehicle_assigned?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routing_management_destination_supplier_id_fkey"
            columns: ["destination_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_management_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "supply_chain_plans"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "routing_management_source_warehouse_id_fkey"
            columns: ["source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          assigned_to: number | null
          created_at: string | null
          customer_id: string | null
          delivery_status: string | null
          demand_quantity: number
          id: string
          lead_id: number | null
          order_date: string
          order_id: string
          payment_terms: string | null
          product_id: string | null
          quotation_id: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          assigned_to?: number | null
          created_at?: string | null
          customer_id?: string | null
          delivery_status?: string | null
          demand_quantity: number
          id?: string
          lead_id?: number | null
          order_date?: string
          order_id: string
          payment_terms?: string | null
          product_id?: string | null
          quotation_id?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          assigned_to?: number | null
          created_at?: string | null
          customer_id?: string | null
          delivery_status?: string | null
          demand_quantity?: number
          id?: string
          lead_id?: number | null
          order_date?: string
          order_id?: string
          payment_terms?: string | null
          product_id?: string | null
          quotation_id?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "sales_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["quotation_id"]
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
          contract: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          contact_info?: string | null
          contract?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          contact_info?: string | null
          contract?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      supply_chain_plans: {
        Row: {
          created_at: string | null
          forecast_demand: number | null
          id: string
          plan_id: string
          plan_status: string
          po_number: string | null
          product_id: string
          requisition_id: string | null
          supplier_id: string
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string | null
          forecast_demand?: number | null
          id?: string
          plan_id: string
          plan_status?: string
          po_number?: string | null
          product_id: string
          requisition_id?: string | null
          supplier_id: string
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string | null
          forecast_demand?: number | null
          id?: string
          plan_id?: string
          plan_status?: string
          po_number?: string | null
          product_id?: string
          requisition_id?: string | null
          supplier_id?: string
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_chain_plans_po_number_fkey"
            columns: ["po_number"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["po_number"]
          },
          {
            foreignKeyName: "supply_chain_plans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_chain_plans_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_chain_plans_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_chain_plans_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_customer_credit_status: {
        Args: { p_customer_id: string }
        Returns: {
          has_unpaid: boolean
          unpaid_count: number
        }[]
      }
      generate_customer_id: { Args: never; Returns: string }
      generate_forecast_id: { Args: never; Returns: string }
      generate_invoice_id: { Args: never; Returns: string }
      generate_issue_id: { Args: never; Returns: string }
      generate_issue_id_unique: { Args: never; Returns: string }
      generate_order_id: { Args: never; Returns: string }
      generate_plan_id: { Args: never; Returns: string }
      generate_route_id: { Args: never; Returns: string }
      generate_solution_id: { Args: never; Returns: string }
      generate_solution_id_unique: { Args: never; Returns: string }
      generate_ticket_id: { Args: never; Returns: string }
      generate_ticket_id_unique: { Args: never; Returns: string }
      generate_unique_id: {
        Args: { column_name: string; prefix: string; table_name: string }
        Returns: string
      }
      handle_ticket_solution: {
        Args: { p_solution_choice: string; p_ticket_id: string }
        Returns: Json
      }
      mark_invoice_as_paid: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
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
