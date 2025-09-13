export interface EcommerceOrder {
  id: string;
  external_order_id: string | null;
  customer_name: string;
  order_status: OrderStatus;
  total_amount: number;
  currency: string;
  items: OrderItem[];
  shipping_address: ShippingAddress | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  address: string;
  city: string;
  country: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum EcommercePlatform {
  SHOPIFY = 'shopify',
  WOOCOMMERCE = 'woocommerce',
  MAGENTO = 'magento',
  CUSTOM = 'custom',
}
