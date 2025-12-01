export type Database = {
  public: {
    Tables: {
      damage_reports: {
        Row: {
          id: string
          created_at: string
          gnd_code: string | null
          gnd_name: string | null
          location: {
            type: 'Point'
            coordinates: [number, number]
          } | null
          property_type: string
          property_condition: string
          damage_level: number
          estimated_damage_lkr: number
          affected_residents: number
          description: string
          contact_name: string | null
          contact_phone: string | null
          contact_email: string | null
          photos: string[]
          status: 'pending' | 'verified' | 'rejected'
          verified_by: string | null
          verified_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          gnd_code?: string | null
          gnd_name?: string | null
          location?: {
            type: 'Point'
            coordinates: [number, number]
          } | null
          property_type: string
          property_condition: string
          damage_level: number
          estimated_damage_lkr: number
          affected_residents: number
          description: string
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          photos?: string[]
          status?: 'pending' | 'verified' | 'rejected'
          verified_by?: string | null
          verified_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          gnd_code?: string | null
          gnd_name?: string | null
          location?: {
            type: 'Point'
            coordinates: [number, number]
          } | null
          property_type?: string
          property_condition?: string
          damage_level?: number
          estimated_damage_lkr?: number
          affected_residents?: number
          description?: string
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          photos?: string[]
          status?: 'pending' | 'verified' | 'rejected'
          verified_by?: string | null
          verified_at?: string | null
        }
      }
      support_posts: {
        Row: {
          id: string
          created_at: string
          organization_name: string
          contact_name: string
          contact_phone: string
          contact_email: string | null
          support_type: string
          description: string
          location_preference: string | null
          status: 'active' | 'fulfilled' | 'inactive'
        }
        Insert: {
          id?: string
          created_at?: string
          organization_name: string
          contact_name: string
          contact_phone: string
          contact_email?: string | null
          support_type: string
          description: string
          location_preference?: string | null
          status?: 'active' | 'fulfilled' | 'inactive'
        }
        Update: {
          id?: string
          created_at?: string
          organization_name?: string
          contact_name?: string
          contact_phone?: string
          contact_email?: string | null
          support_type?: string
          description?: string
          location_preference?: string | null
          status?: 'active' | 'fulfilled' | 'inactive'
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          created_at: string
          role: 'admin' | 'government_agent'
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          role?: 'admin' | 'government_agent'
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          role?: 'admin' | 'government_agent'
        }
      }
    }
  }
}

export type DamageReport = Database['public']['Tables']['damage_reports']['Row']
export type SupportPost = Database['public']['Tables']['support_posts']['Row']
export type AdminUser = Database['public']['Tables']['admin_users']['Row']

