
import React, { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { LaundryAgentDashboard } from '../components/LaundryAgentDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LaundryItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  icon: string;
}

interface PickupLocation {
  roomNumber: string;
  block: string;
  floor: string;
  pickupTime?: string;
}

interface LaundryOrder {
  id: number;
  orderNumber: string;
  requestDate: string;
  status: string;
  clothesCount: string;
  items: LaundryItem[];
  totalAmount: number;
  pickupLocation: PickupLocation;
  deliveryDate?: string;
  complaints?: { id: string; text: string; status: string; date: string }[];
}

const LaundryAgentPage = () => {
  const [currentOrders, setCurrentOrders] = useState<LaundryOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<LaundryOrder[]>([]);
  
  useEffect(() => {
    // Load orders from localStorage
    try {
      const storedOrders = localStorage.getItem('currentOrders');
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        // Filter orders by status
        const active = parsedOrders.filter((order: LaundryOrder) => order.status !== 'Delivered');
        const completed = parsedOrders.filter((order: LaundryOrder) => order.status === 'Delivered');
        
        setCurrentOrders(active);
        setCompletedOrders(completed);
      }
    } catch (error) {
      console.error('Error loading orders', error);
    }
  }, []);
  
  // Handle order updates
  const handleOrderUpdate = (updatedOrders: LaundryOrder[]) => {
    // Update the current orders
    setCurrentOrders(updatedOrders);
    
    // Update in localStorage
    try {
      const storedOrders = localStorage.getItem('currentOrders');
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        const completedFromStorage = parsedOrders.filter((order: LaundryOrder) => order.status === 'Delivered');
        
        // Combine current active orders with completed ones
        const updatedStorage = [...updatedOrders, ...completedFromStorage];
        localStorage.setItem('currentOrders', JSON.stringify(updatedStorage));
      }
    } catch (error) {
      console.error('Error updating orders', error);
    }
  };
  
  // Handle order completion
  const handleOrderComplete = (completedOrder: LaundryOrder) => {
    // Mark order as delivered with timestamp
    const updatedOrder = {
      ...completedOrder,
      status: 'Delivered',
      deliveryDate: new Date().toLocaleString()
    };
    
    // Update state
    setCurrentOrders(prev => prev.filter(order => order.id !== completedOrder.id));
    setCompletedOrders(prev => [...prev, updatedOrder]);
    
    // Update in localStorage
    try {
      const storedOrders = localStorage.getItem('currentOrders');
      if (storedOrders) {
        let parsedOrders = JSON.parse(storedOrders);
        
        // Replace the completed order
        parsedOrders = parsedOrders.map((order: LaundryOrder) => 
          order.id === completedOrder.id ? updatedOrder : order
        );
        
        localStorage.setItem('currentOrders', JSON.stringify(parsedOrders));
      }
    } catch (error) {
      console.error('Error completing order', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-accent/30">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Laundry Service Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Welcome to the laundry service management dashboard. Here you can manage all laundry orders,
              see pending requests, and track deliveries.
            </p>
          </CardContent>
        </Card>
        
        <LaundryAgentDashboard
          currentOrders={currentOrders}
          pastOrders={completedOrders}
          onOrderUpdate={handleOrderUpdate}
          onOrderComplete={handleOrderComplete}
        />
      </div>
      
      <Footer />
    </div>
  );
};

export default LaundryAgentPage;
