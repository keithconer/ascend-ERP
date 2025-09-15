type OrderItemRecord = {
  id: string;
  order_id: string;
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
};

export type { OrderItemRecord };
