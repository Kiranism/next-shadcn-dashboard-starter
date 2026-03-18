export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      billing_types: {
        Row: {
          behavior_profile: Json;
          color: string;
          created_at: string;
          id: string;
          name: string;
          payer_id: string;
        };
        Insert: {
          behavior_profile?: Json;
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
          payer_id: string;
        };
        Update: {
          behavior_profile?: Json;
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          payer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'billing_types_payer_id_fkey';
            columns: ['payer_id'];
            isOneToOne: false;
            referencedRelation: 'payers';
            referencedColumns: ['id'];
          }
        ];
      };
      clients: {
        Row: {
          city: string;
          company_id: string;
          company_name: string | null;
          created_at: string;
          first_name: string | null;
          greeting_style: string | null;
          id: string;
          is_company: boolean;
          last_name: string | null;
          notes: string | null;
          phone: string | null;
          requires_daily_scheduling: boolean | null;
          stations: string[] | null;
          street: string;
          street_number: string;
          relation: string | null;
          updated_at: string | null;
          zip_code: string;
          lat: number | null;
          lng: number | null;
        };
        Insert: {
          city: string;
          company_id: string;
          company_name?: string | null;
          created_at?: string;
          first_name?: string | null;
          greeting_style?: string | null;
          id?: string;
          is_company?: boolean;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          requires_daily_scheduling?: boolean | null;
          stations?: string[] | null;
          street: string;
          street_number: string;
          relation?: string | null;
          updated_at?: string | null;
          zip_code: string;
          lat?: number | null;
          lng?: number | null;
        };
        Update: {
          city?: string;
          company_id?: string;
          company_name?: string | null;
          created_at?: string;
          first_name?: string | null;
          greeting_style?: string | null;
          id?: string;
          is_company?: boolean;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          requires_daily_scheduling?: boolean | null;
          stations?: string[] | null;
          street?: string;
          street_number?: string;
          relation?: string | null;
          updated_at?: string | null;
          zip_code?: string;
          lat?: number | null;
          lng?: number | null;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          code: string;
          created_at: string | null;
          id: string;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      driver_documents: {
        Row: {
          company_id: string | null;
          document_type: string | null;
          driver_id: string | null;
          file_path: string;
          id: string;
          uploaded_at: string | null;
          valid_until: string | null;
        };
        Insert: {
          company_id?: string | null;
          document_type?: string | null;
          driver_id?: string | null;
          file_path: string;
          id?: string;
          uploaded_at?: string | null;
          valid_until?: string | null;
        };
        Update: {
          company_id?: string | null;
          document_type?: string | null;
          driver_id?: string | null;
          file_path?: string;
          id?: string;
          uploaded_at?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'driver_documents_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'driver_documents_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          }
        ];
      };
      driver_profiles: {
        Row: {
          created_at: string | null;
          default_vehicle_id: string | null;
          id: string;
          license_number: string | null;
          notes: string | null;
          user_id: string | null;
          street: string | null;
          street_number: string | null;
          zip_code: string | null;
          city: string | null;
          lat: number | null;
          lng: number | null;
        };
        Insert: {
          created_at?: string | null;
          default_vehicle_id?: string | null;
          id?: string;
          license_number?: string | null;
          notes?: string | null;
          user_id?: string | null;
          street?: string | null;
          street_number?: string | null;
          zip_code?: string | null;
          city?: string | null;
          lat?: number | null;
          lng?: number | null;
        };
        Update: {
          created_at?: string | null;
          default_vehicle_id?: string | null;
          id?: string;
          license_number?: string | null;
          notes?: string | null;
          user_id?: string | null;
          street?: string | null;
          street_number?: string | null;
          zip_code?: string | null;
          city?: string | null;
          lat?: number | null;
          lng?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'driver_profiles_default_vehicle_id_fkey';
            columns: ['default_vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'driver_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          }
        ];
      };
      live_locations: {
        Row: {
          company_id: string | null;
          driver_id: string;
          lat: number | null;
          lng: number | null;
          status: string;
          updated_at: string | null;
          vehicle_id: string | null;
        };
        Insert: {
          company_id?: string | null;
          driver_id: string;
          lat?: number | null;
          lng?: number | null;
          status: string;
          updated_at?: string | null;
          vehicle_id?: string | null;
        };
        Update: {
          company_id?: string | null;
          driver_id?: string;
          lat?: number | null;
          lng?: number | null;
          status?: string;
          updated_at?: string | null;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'live_locations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'live_locations_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: true;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'live_locations_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          company_id: string | null;
          created_at: string | null;
          data: Json | null;
          id: string;
          title: string | null;
          user_id: string | null;
        };
        Insert: {
          body?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          title?: string | null;
          user_id?: string | null;
        };
        Update: {
          body?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          title?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          }
        ];
      };
      payers: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          number: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          number?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          number?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payers_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      recurring_rules: {
        Row: {
          id: string;
          client_id: string;
          rrule_string: string;
          pickup_address: string;
          dropoff_address: string;
          pickup_time: string;
          return_trip: boolean;
          return_time: string | null;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          rrule_string: string;
          pickup_address: string;
          dropoff_address: string;
          pickup_time: string;
          return_trip?: boolean;
          return_time?: string | null;
          start_date: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          rrule_string?: string;
          pickup_address?: string;
          dropoff_address?: string;
          pickup_time?: string;
          return_trip?: boolean;
          return_time?: string | null;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_rules_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          }
        ];
      };
      recurring_rule_exceptions: {
        Row: {
          id: string;
          rule_id: string;
          exception_date: string;
          original_pickup_time: string;
          is_cancelled: boolean;
          modified_pickup_time: string | null;
          modified_pickup_address: string | null;
          modified_dropoff_address: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          rule_id: string;
          exception_date: string;
          original_pickup_time: string;
          is_cancelled?: boolean;
          modified_pickup_time?: string | null;
          modified_pickup_address?: string | null;
          modified_dropoff_address?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          rule_id?: string;
          exception_date?: string;
          original_pickup_time?: string;
          is_cancelled?: boolean;
          modified_pickup_time?: string | null;
          modified_pickup_address?: string | null;
          modified_dropoff_address?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_rule_exceptions_rule_id_fkey';
            columns: ['rule_id'];
            isOneToOne: false;
            referencedRelation: 'recurring_rules';
            referencedColumns: ['id'];
          }
        ];
      };
      rides: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          distance: number | null;
          distance_km: number | null;
          driver_id: string | null;
          dropoff_address: string | null;
          dropoff_lat: number | null;
          dropoff_lng: number | null;
          ended_at: string | null;
          fare_amount: number | null;
          id: string;
          note: string | null;
          payment_method: string | null;
          pickup_address: string | null;
          pickup_lat: number | null;
          pickup_lng: number | null;
          shift_id: string | null;
          started_at: string | null;
          status: string;
          vehicle_id: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          distance?: number | null;
          distance_km?: number | null;
          driver_id?: string | null;
          dropoff_address?: string | null;
          dropoff_lat?: number | null;
          dropoff_lng?: number | null;
          ended_at?: string | null;
          fare_amount?: number | null;
          id?: string;
          note?: string | null;
          payment_method?: string | null;
          pickup_address?: string | null;
          pickup_lat?: number | null;
          pickup_lng?: number | null;
          shift_id?: string | null;
          started_at?: string | null;
          status: string;
          vehicle_id?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          distance?: number | null;
          distance_km?: number | null;
          driver_id?: string | null;
          dropoff_address?: string | null;
          dropoff_lat?: number | null;
          dropoff_lng?: number | null;
          ended_at?: string | null;
          fare_amount?: number | null;
          id?: string;
          note?: string | null;
          payment_method?: string | null;
          pickup_address?: string | null;
          pickup_lat?: number | null;
          pickup_lng?: number | null;
          shift_id?: string | null;
          started_at?: string | null;
          status?: string;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'rides_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rides_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rides_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rides_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          }
        ];
      };
      shift_events: {
        Row: {
          event_type: string;
          id: string;
          lat: number | null;
          lng: number | null;
          metadata: Json | null;
          shift_id: string | null;
          timestamp: string | null;
        };
        Insert: {
          event_type: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          metadata?: Json | null;
          shift_id?: string | null;
          timestamp?: string | null;
        };
        Update: {
          event_type?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          metadata?: Json | null;
          shift_id?: string | null;
          timestamp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shift_events_shift_id_fkey';
            columns: ['shift_id'];
            isOneToOne: false;
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          }
        ];
      };
      shifts: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          driver_id: string | null;
          end_odometer: number | null;
          ended_at: string | null;
          id: string;
          start_odometer: number | null;
          started_at: string;
          status: string;
          total_distance_km: number | null;
          total_earnings: number | null;
          vehicle_id: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          driver_id?: string | null;
          end_odometer?: number | null;
          ended_at?: string | null;
          id?: string;
          start_odometer?: number | null;
          started_at: string;
          status: string;
          total_distance_km?: number | null;
          total_earnings?: number | null;
          vehicle_id?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          driver_id?: string | null;
          end_odometer?: number | null;
          ended_at?: string | null;
          id?: string;
          start_odometer?: number | null;
          started_at?: string;
          status?: string;
          total_distance_km?: number | null;
          total_earnings?: number | null;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shifts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shifts_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shifts_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          }
        ];
      };
      trip_assignments: {
        Row: {
          assigned_at: string | null;
          driver_id: string | null;
          id: string;
          status: string;
          trip_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          assigned_at?: string | null;
          driver_id?: string | null;
          id?: string;
          status: string;
          trip_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          assigned_at?: string | null;
          driver_id?: string | null;
          id?: string;
          status?: string;
          trip_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_assignments_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trip_assignments_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          }
        ];
      };
      trips: {
        Row: {
          actual_dropoff_at: string | null;
          actual_pickup_at: string | null;
          billing_type_id: string | null;
          client_id: string | null;
          client_name: string | null;
          client_phone: string | null;
          company_id: string | null;
          created_at: string | null;
          created_by: string | null;
          driver_id: string | null;
          dropoff_address: string | null;
          dropoff_lat: number | null;
          dropoff_lng: number | null;
          dropoff_city: string | null;
          dropoff_street: string | null;
          dropoff_street_number: string | null;
          dropoff_zip_code: string | null;
          driving_distance_km: number | null;
          driving_duration_seconds: number | null;
          dropoff_location: Json | null;
          dropoff_station: string | null;
          greeting_style: string | null;
          has_missing_geodata: boolean;
          group_id: string | null;
          id: string;
          ingestion_source: string | null;
          is_wheelchair: boolean;
          link_type: string | null;
          linked_trip_id: string | null;
          note: string | null;
          notes: string | null;
          needs_driver_assignment: boolean;
          canceled_reason_notes: string | null;
          payer_id: string | null;
          payment_method: string | null;
          pickup_address: string | null;
          pickup_lat: number | null;
          pickup_lng: number | null;
          pickup_city: string | null;
          pickup_street: string | null;
          pickup_street_number: string | null;
          pickup_zip_code: string | null;
          pickup_location: Json | null;
          pickup_station: string | null;
          price: number | null;
          requested_date: string | null;
          return_status: string | null;
          rule_id: string | null;
          scheduled_at: string | null;
          status: string;
          stop_order: number | null;
          stop_updates: Json;
          vehicle_id: string | null;
        };
        Insert: {
          actual_dropoff_at?: string | null;
          actual_pickup_at?: string | null;
          billing_type_id?: string | null;
          client_id?: string | null;
          client_name?: string | null;
          client_phone?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          driver_id?: string | null;
          dropoff_address?: string | null;
          dropoff_lat?: number | null;
          dropoff_lng?: number | null;
          dropoff_city?: string | null;
          dropoff_street?: string | null;
          dropoff_street_number?: string | null;
          dropoff_zip_code?: string | null;
          driving_distance_km?: number | null;
          driving_duration_seconds?: number | null;
          dropoff_location?: Json | null;
          dropoff_station?: string | null;
          greeting_style?: string | null;
          has_missing_geodata?: boolean;
          group_id?: string | null;
          id?: string;
          ingestion_source?: string | null;
          is_wheelchair?: boolean;
          link_type?: string | null;
          linked_trip_id?: string | null;
          note?: string | null;
          notes?: string | null;
          needs_driver_assignment?: boolean;
          canceled_reason_notes?: string | null;
          payer_id?: string | null;
          payment_method?: string | null;
          pickup_address?: string | null;
          pickup_lat?: number | null;
          pickup_lng?: number | null;
          pickup_city?: string | null;
          pickup_street?: string | null;
          pickup_street_number?: string | null;
          pickup_zip_code?: string | null;
          pickup_location?: Json | null;
          pickup_station?: string | null;
          price?: number | null;
          requested_date?: string | null;
          return_status?: string | null;
          rule_id?: string | null;
          scheduled_at?: string | null;
          status: string;
          stop_order?: number | null;
          stop_updates?: Json;
          vehicle_id?: string | null;
        };
        Update: {
          actual_dropoff_at?: string | null;
          actual_pickup_at?: string | null;
          billing_type_id?: string | null;
          client_id?: string | null;
          client_name?: string | null;
          client_phone?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          driver_id?: string | null;
          dropoff_address?: string | null;
          dropoff_lat?: number | null;
          dropoff_lng?: number | null;
          driving_distance_km?: number | null;
          driving_duration_seconds?: number | null;
          dropoff_location?: Json | null;
          dropoff_station?: string | null;
          greeting_style?: string | null;
          has_missing_geodata?: boolean;
          group_id?: string | null;
          id?: string;
          ingestion_source?: string | null;
          is_wheelchair?: boolean;
          link_type?: string | null;
          linked_trip_id?: string | null;
          note?: string | null;
          notes?: string | null;
          needs_driver_assignment?: boolean;
          canceled_reason_notes?: string | null;
          payer_id?: string | null;
          payment_method?: string | null;
          pickup_address?: string | null;
          pickup_lat?: number | null;
          pickup_lng?: number | null;
          pickup_location?: Json | null;
          pickup_station?: string | null;
          price?: number | null;
          requested_date?: string | null;
          return_status?: string | null;
          rule_id?: string | null;
          scheduled_at?: string | null;
          status?: string;
          stop_order?: number | null;
          stop_updates?: Json;
          vehicle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'trips_billing_type_id_fkey';
            columns: ['billing_type_id'];
            isOneToOne: false;
            referencedRelation: 'billing_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trips_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trips_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trips_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trips_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trips_linked_trip_id_fkey';
            columns: ['linked_trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trips_payer_id_fkey';
            columns: ['payer_id'];
            isOneToOne: false;
            referencedRelation: 'payers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trips_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          }
        ];
      };
      accounts: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          role: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          id: string;
          is_active?: boolean | null;
          name: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'accounts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      vehicles: {
        Row: {
          color: string | null;
          company_id: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          license_plate: string;
          name: string;
          status: string | null;
        };
        Insert: {
          color?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          license_plate: string;
          name: string;
          status?: string | null;
        };
        Update: {
          color?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          license_plate?: string;
          name?: string;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {}
  }
} as const;
