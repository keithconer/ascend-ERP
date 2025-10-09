// src/components/SalesOrderManagement.tsx
import React, { useState, useEffect } from 'react';

// Define types for Sales Order
type SalesOrder = {
  id: number;
  orderNumber: string;
  totalPrice: number;
  status: string;
};

const SalesOrderManagement: React.FC = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);

  useEffect(() => {
    // Example fetching from Supabase (replace with your actual query)
    const fetchSalesOrders = async () => {
      // const { data, error } = await supabase.from('sales_orders').select('*');
      // if (error) console.log('Error fetching sales orders:', error);
      // else setSalesOrders(data);

      // For now, mock data:
      setSalesOrders([
        { id: 1, orderNumber: 'SO-001', totalPrice: 2500, status: 'Shipped' },
        { id: 2, orderNumber: 'SO-002', totalPrice: 3000, status: 'Pending' },
      ]);
    };

    fetchSalesOrders();
  }, []);

  return (
    <div>
      <h1>Sales Order Management</h1>
      <ul>
        {salesOrders.map((order) => (
          <li key={order.id}>
            {order.orderNumber} - ${order.totalPrice} - {order.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SalesOrderManagement;
