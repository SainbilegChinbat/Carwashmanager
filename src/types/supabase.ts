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
      appointment_commissions: {
        Row: {
          amount: number
          appointment_id: string
          commission_rate: number
          created_at: string
          employee_id: string
          employee_name: string
          id: string
          service_id: string | null
        }
        Insert: {
          amount: number
          appointment_id: string
          commission_rate: number
          created_at?: string
          employee_id: string
          employee_name: string
          id?: string
          service_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string
          commission_rate?: number
          created_at?: string
          employee_id?: string
          employee_name?: string
          id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_commissions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_commissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_commissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      appointment_employees: {
        Row: {
          appointment_id: string
          created_at: string
          employee_id: string
          id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          employee_id: string
          id?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_employees_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      appointment_reminders: {
        Row: {
          appointment_date: string
          appointment_id: string
          appointment_time: string
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          is_read: boolean
          license_plate: string
          reminder_time: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_id: string
          appointment_time: string
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          is_read?: boolean
          license_plate: string
          reminder_time: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_id?: string
          appointment_time?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          is_read?: boolean
          license_plate?: string
          reminder_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      appointment_services: {
        Row: {
          appointment_id: string
          commission_rate: number
          created_at: string
          id: string
          price: number
          service_id: string | null
          service_name: string
        }
        Insert: {
          appointment_id: string
          commission_rate: number
          created_at?: string
          id?: string
          price: number
          service_id?: string | null
          service_name: string
        }
        Update: {
          appointment_id?: string
          commission_rate?: number
          created_at?: string
          id?: string
          price?: number
          service_id?: string | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          license_plate: string
          notes: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          license_plate: string
          notes?: string | null
          status: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          license_plate?: string
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      commissions: {
        Row: {
          amount: number
          commission_rate: number
          created_at: string
          employee_id: string
          employee_name: string
          id: string
          is_paid: boolean
          notes: string | null
          service_id: string | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          commission_rate: number
          created_at?: string
          employee_id: string
          employee_name: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          service_id?: string | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          commission_rate?: number
          created_at?: string
          employee_id?: string
          employee_name?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          service_id?: string | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      employees: {
        Row: {
          address: string
          created_at: string
          default_commission_rate: number
          id: string
          name: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          default_commission_rate: number
          id?: string
          name: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          default_commission_rate?: number
          id?: string
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      pending_service_commissions: {
        Row: {
          amount: number
          commission_rate: number
          created_at: string
          employee_id: string
          employee_name: string
          id: string
          pending_service_id: string
          service_id: string | null
        }
        Insert: {
          amount: number
          commission_rate: number
          created_at?: string
          employee_id: string
          employee_name: string
          id?: string
          pending_service_id: string
          service_id?: string | null
        }
        Update: {
          amount?: number
          commission_rate?: number
          created_at?: string
          employee_id?: string
          employee_name?: string
          id?: string
          pending_service_id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_service_commissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_service_commissions_pending_service_id_fkey"
            columns: ["pending_service_id"]
            isOneToOne: false
            referencedRelation: "pending_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_service_commissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      pending_service_details: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          pending_service_id: string
          price: number
          service_id: string | null
          service_name: string
        }
        Insert: {
          commission_rate: number
          created_at?: string
          id?: string
          pending_service_id: string
          price: number
          service_id?: string | null
          service_name: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          pending_service_id?: string
          price?: number
          service_id?: string | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_service_details_pending_service_id_fkey"
            columns: ["pending_service_id"]
            isOneToOne: false
            referencedRelation: "pending_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_service_details_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      pending_service_employees: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          pending_service_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          pending_service_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          pending_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_service_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_service_employees_pending_service_id_fkey"
            columns: ["pending_service_id"]
            isOneToOne: false
            referencedRelation: "pending_services"
            referencedColumns: ["id"]
          }
        ]
      }
      pending_services: {
        Row: {
          created_at: string
          date: string
          estimated_completion: string | null
          id: string
          license_plate: string
          notes: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          estimated_completion?: string | null
          id?: string
          license_plate: string
          notes?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          estimated_completion?: string | null
          id?: string
          license_plate?: string
          notes?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          name: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate: number
          created_at?: string
          id?: string
          name: string
          price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transaction_employees: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_employees_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      transaction_services: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          price: number
          service_id: string | null
          service_name: string
          transaction_id: string
        }
        Insert: {
          commission_rate: number
          created_at?: string
          id?: string
          price: number
          service_id?: string | null
          service_name: string
          transaction_id: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          price?: number
          service_id?: string | null
          service_name?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_services_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          created_at: string
          date: string
          id: string
          license_plate: string
          notes: string | null
          payment_method: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          license_plate: string
          notes?: string | null
          payment_method: string
          status: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          license_plate?: string
          notes?: string | null
          payment_method?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          address: string | null
          business_name: string
          created_at: string
          email: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_name: string
          created_at?: string
          email: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_name?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      appointment_details_view: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          commissions: Json | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          employees: Json | null
          id: string | null
          license_plate: string | null
          notes: string | null
          services: Json | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      employee_commissions_view: {
        Row: {
          amount: number | null
          commission_rate: number | null
          date: string | null
          employee_id: string | null
          employee_name: string | null
          id: string | null
          is_paid: boolean | null
          license_plate: string | null
          notes: string | null
          payment_method: string | null
          service_id: string | null
          status: string | null
          transaction_id: string | null
          transaction_notes: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      pending_service_details_view: {
        Row: {
          commissions: Json | null
          created_at: string | null
          date: string | null
          employees: Json | null
          estimated_completion: string | null
          id: string | null
          license_plate: string | null
          notes: string | null
          services: Json | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transaction_details_view: {
        Row: {
          commissions: Json | null
          created_at: string | null
          date: string | null
          employees: Json | null
          id: string | null
          license_plate: string | null
          notes: string | null
          payment_method: string | null
          services: Json | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      get_user_dashboard_stats: {
        Args: {
          user_uuid: string
          target_date: string
        }
        Returns: Json
      }
      get_user_employee_stats: {
        Args: {
          user_uuid: string
          start_date: string
          end_date: string
        }
        Returns: {
          employee_id: string
          employee_name: string
          total_commission: number
          service_count: number
          revenue_share: number
          paid_commissions: number
          unpaid_commissions: number
        }[]
      }
      get_user_service_stats: {
        Args: {
          user_uuid: string
          start_date: string
          end_date: string
        }
        Returns: {
          service_id: string
          service_name: string
          total_revenue: number
          service_count: number
          average_price: number
          total_commission: number
        }[]
      }
      get_user_transactions_by_date_range: {
        Args: {
          user_uuid: string
          start_date: string
          end_date: string
        }
        Returns: {
          created_at: string
          date: string
          id: string
          license_plate: string
          notes: string | null
          payment_method: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never