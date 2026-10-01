export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'at_depot'
  | 'ready_for_pickup'
  | 'delivered'
  | 'cancelled';

export type PaymentTiming = 'pay_before' | 'pay_after';

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_image: string | null;
  supplier_name: string;
  variant?: number | null;
  /** « M · Rouge » — vide pour un produit sans déclinaison. */
  variant_label?: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  /** Commission figée à la commande, en % — administrateur seulement. */
  commission_rate?: string | null;
  /** Part de la plateforme sur cette ligne — administrateur seulement. */
  commission_amount?: string | null;
  /** Part du fournisseur sur cette ligne — administrateur seulement. */
  supplier_amount?: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  status_display: string;
  payment_timing: PaymentTiming;
  payment_timing_display: string;
  total_amount: string;
  shipping_address: Record<string, string> | string;
  billing_address: Record<string, string> | string;
  phone: string;
  notes: string;
  items: OrderItem[];
  items_count: number;
  client_name: string;
  client_email: string;
  /** Commande passée sans compte. */
  is_guest: boolean;
  shipment_id: number | null;
  shipment_status: string | null;
  shipment_depot_name: string | null;
  shipment_depot_address: string | null;
  shipment_depot_location: string | null;
  shipment_return_reason: string | null;
  shipment_return_type: '' | 'manual' | 'automatic' | null;
  shipment_returned_at: string | null;
  recipient_first_name: string | null;
  recipient_last_name: string | null;
  recipient_id_card: string | null;
  recipient_phone: string | null;
  suppliers_ready_count: number;
  suppliers_total_count: number;
  /**
   * Détail par fournisseur — renseigné pour l'administrateur seulement
   * (`null` ailleurs : le client n'a pas à savoir qui fournit ses articles).
   */
  supplier_statuses?: OrderSupplierStatus[] | null;
  /** Total prélevé par la plateforme sur la commande — administrateur seulement. */
  commission_total?: string | null;
  /** Total reversé aux fournisseurs — administrateur seulement. */
  suppliers_amount_total?: string | null;
  /** Renseigné si la commande a été archivée : elle sort alors des listes. */
  archived_at?: string | null;
  archived_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

/** Préparation d'une commande chez un fournisseur donné. */
export interface OrderSupplierStatus {
  id: number;
  supplier: number;
  supplier_name: string;
  supplier_reference: string | null;
  supplier_email: string;
  supplier_phone: string;
  is_ready: boolean;
  ready_at: string | null;
  /** Dernier rappel envoyé par un administrateur. */
  reminded_at: string | null;
  reminder_count: number;
  /** Nombre de lignes de la commande qui viennent de ce fournisseur. */
  items_count: number;
}

export interface SupplierOrderItem {
  id: number;
  product: number;
  product_name: string;
  product_image: string | null;
  supplier_name: string;
  variant?: number | null;
  /** « M · Rouge » — le fournisseur doit préparer la bonne déclinaison. */
  variant_label?: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  /** Taux figé au moment de la commande, en %. */
  commission_rate: string;
  /** Part de la plateforme sur cette ligne. */
  commission_amount: string;
  /** Ce que touche le fournisseur sur cette ligne. */
  supplier_amount: string;
}

export interface SupplierOrder {
  id: number;
  order_number: string;
  status: OrderStatus;
  status_display: string;
  payment_timing: PaymentTiming;
  payment_timing_display: string;
  shipping_address: Record<string, string> | string;
  client_name: string;
  client_phone: string;
  my_items: SupplierOrderItem[];
  my_items_count: number;
  my_subtotal: string;
  /** Commission totale prélevée sur ses articles de cette commande. */
  my_commission_total: string;
  /** Total net du fournisseur sur cette commande. */
  my_net_total: string;
  notes: string;
  created_at: string;
  shipment_id: number | null;
  shipment_depot_name: string | null;
  my_is_ready: boolean;
  suppliers_ready_count: number;
  suppliers_total_count: number;
  all_ready: boolean;
}

export interface Depot {
  id: number;
  name: string;
  address: string;
  commune: number | null;
  commune_name: string;
  departement_id: number | null;
  departement_name: string;
  region_id: number | null;
  region_name: string;
  commune_lat: string | null;
  commune_lon: string | null;
  city: string;
  latitude: string | null;
  longitude: string | null;
  manager: number | null;
  manager_name: string;
  manager_phone: string;
  is_active: boolean;
  distance_km?: number | null;
}

export interface Shipment {
  id: number;
  order_id: number;
  tracking_number: string;
  status: 'preparing' | 'sent_to_depot' | 'at_depot' | 'client_notified' | 'delivered' | 'returned';
  status_display: string;
  order_number: string;
  order_total: string;
  client_name: string;
  client_phone: string;
  depot_name: string;
  depot_city: string;
  shipping_address: Record<string, string> | null;
  items: OrderItem[];
  shipped_at: string | null;
  arrived_at_depot_at: string | null;
  client_notified_at: string | null;
  delivered_at: string | null;
  notes: string;
  recipient_first_name: string;
  recipient_last_name: string;
  recipient_id_card: string;
  recipient_phone: string;
  returned_at: string | null;
  return_type: '' | 'manual' | 'automatic';
  return_reason: string;
  return_shipped_at: string | null;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  postal_code?: string;
  country?: string;
}

export interface CartItemPayload {
  product_id: number;
  quantity: number;
  /** Obligatoire si le produit a des déclinaisons ; le serveur refuse sinon. */
  variant_id?: number | null;
}

export interface CheckoutPayload {
  shipping_address: ShippingAddress;
  payment_timing: PaymentTiming;
  commune_id?: number | null;
  phone?: string;
  notes?: string;
  cart_items: CartItemPayload[];
  // ── Commande invité (sans compte) : requis si non connecté ──
  guest_first_name?: string;
  guest_last_name?: string;
  guest_email?: string;
}

/** Coordonnées d'invité mémorisées localement pour pré-remplir la prochaine commande. */
export interface GuestCheckoutInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  region_id?: number | null;
  departement_id?: number | null;
  commune_id?: number | null;
}
