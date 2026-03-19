// Types for Laravel API - Delivery Person
export interface DeliveryPerson {
  id: number;
  user_id?: number;
  full_name: string;
  name?: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  vehicle_type?: 'bike' | 'motorcycle' | 'car' | 'van';
  license_number?: string | null;
  avatar_url?: string | null;
  zone?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

// Types for Laravel API - Delivery/Order
export interface Delivery {
  id: number;
  order_id: number;
  order_number?: string;
  delivery_person_id?: number | string | null;
  client_name?: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  customer_address: string;
  delivery_coordinates?: { lat: number; lng: number } | null;
  delivery_type?: 'standard' | 'express' | 'scheduled';
  status: 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'returned';
  notes?: string | null;
  commune?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  scheduled_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  delivery_proof_url?: string;
  created_at: string;
  updated_at?: string;
}

// Types for Laravel API - Stats
export interface DeliveryStats {
  deliveries_today: number;
  completed: number;
  failed: number;
  earnings: number;
  rating: number;
  // Legacy support
  total?: number;
  delivered?: number;
  in_transit?: number;
  pending?: number;
}

// Types for Delivery Proof
export interface DeliveryProof {
  photo_base64: string;
  signature_base64: string;
  gps_lat: number;
  gps_lng: number;
  notes?: string;
}

export interface DeliveryProofRecord {
  id: string;
  delivery_id: string;
  photo_url: string | null;
  signature_data: string | null;
  recipient_name: string | null;
  notes: string | null;
  created_at: string;
}
