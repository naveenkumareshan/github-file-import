
import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { StatisticsCards } from '../components/admin/StatisticsCards';
import { ChatManagement } from '../components/admin/ChatManagement';
import { CustomerComplaints } from '../components/admin/CustomerComplaints';
import { OccupancyChart } from '../components/admin/OccupancyChart';
import { RevenueChart } from '../components/admin/RevenueChart';

// Mock data
const mockChatThreads = [
  {
    id: 201,
    studentName: "Jenny Wilson",
    hostName: "Partner",
    lastMessage: "I need to report an issue with the water heater in my room.",
    timestamp: "Today, 10:30 AM",
    unread: true
  },
  {
    id: 202,
    studentName: "Cameron Williamson",
    hostName: "Partner",
    lastMessage: "Thanks for fixing the ceiling fan. It works perfectly now.",
    timestamp: "Yesterday, 3:15 PM",
    unread: false
  }
];

const mockFinancialSummary = {
  totalRevenue: 85300,
  pendingPayments: 4500,
  activeSubscriptions: 28,
  newSubscriptionsThisMonth: 5,
  revenueToday: 1250,
  occupancyRate: 78
};

const HostDashboard = () => {
  return (
    <div className="min-h-screen bg-accent/30">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-cabin-dark">Partner Dashboard</h1>
            <p className="text-cabin-dark/70">Manage accommodations and resident services</p>
          </div>
          
          <div className="mt-4 md:mt-0 space-x-2">
            <Link
              to="/messages"
              className="bg-cabin-dark text-white px-4 py-2 rounded-md font-medium hover:bg-black transition-colors"
            >
              Messages
            </Link>
            <Link
              to="/laundry-agent"
              className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary/80 transition-colors"
            >
              Laundry Agent
            </Link>
          </div>
        </div>
        
        <StatisticsCards data={mockFinancialSummary} />
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <OccupancyChart />
          <RevenueChart />
        </div>
        
        <CustomerComplaints />
        <ChatManagement chatThreads={mockChatThreads} />
      </div>
      
      <footer className="bg-cabin-dark text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/50 text-sm">
            <p>© 2025 Inhalestays. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HostDashboard;
