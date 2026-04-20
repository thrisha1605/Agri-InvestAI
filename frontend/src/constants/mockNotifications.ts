import { Notification } from '@/types/notifications';

export const FARMER_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    type: 'PROJECT_APPROVED',
    title: 'Project Approved! 🎉',
    message: 'Your "Organic Basmati Rice" project has been approved and is now live for investments.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    actionUrl: '/farmer/dashboard',
    metadata: {
      projectName: 'Organic Basmati Rice',
    }
  },
  {
    id: 'notif_2',
    type: 'NEW_INVESTMENT',
    title: 'New Investment Received',
    message: 'Priya Sharma invested ₹1,50,000 in your Cotton Drip Irrigation project.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    read: false,
    actionUrl: '/projects/2',
    metadata: {
      projectName: 'Cotton Drip Irrigation',
      investorName: 'Priya Sharma',
      amount: 150000,
    }
  },
  {
    id: 'notif_3',
    type: 'HARVEST_REMINDER',
    title: 'Harvest Due Soon',
    message: 'Your wheat crop is expected to be ready for harvest in 7 days. Please prepare for harvesting activities.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    metadata: {
      projectName: 'Wheat Cultivation',
    }
  },
  {
    id: 'notif_4',
    type: 'SETTLEMENT_COMPLETED',
    title: 'Settlement Processed',
    message: 'Settlement of ₹3,20,000 has been completed for your Rice project. Funds will be credited within 2-3 days.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    actionUrl: '/farmer/wallet',
    metadata: {
      projectName: 'Organic Rice',
      amount: 320000,
    }
  },
  {
    id: 'notif_5',
    type: 'NEW_INVESTMENT',
    title: 'Project Fully Funded! 🎯',
    message: 'Your "Mango Orchard" project has reached 100% funding goal with total investment of ₹5,00,000.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: true,
    actionUrl: '/projects/3',
    metadata: {
      projectName: 'Mango Orchard',
      amount: 500000,
    }
  },
];

export const INVESTOR_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_inv_1',
    type: 'PAYMENT_CONFIRMED',
    title: 'Payment Successful ✓',
    message: 'Your investment of ₹1,50,000 in "Organic Basmati Rice" has been confirmed. Transaction ID: RZP_45678',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    read: false,
    actionUrl: '/investor/portfolio',
    metadata: {
      projectName: 'Organic Basmati Rice',
      amount: 150000,
    }
  },
  {
    id: 'notif_inv_2',
    type: 'PROJECT_UPDATE',
    title: 'Project Progress Update',
    message: 'Cotton Drip Irrigation: Drip system installation completed. Crop showing healthy growth at 45 days.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: false,
    actionUrl: '/projects/2',
    metadata: {
      projectName: 'Cotton Drip Irrigation',
    }
  },
  {
    id: 'notif_inv_3',
    type: 'SIP_DEBIT_ALERT',
    title: 'SIP Debit Scheduled',
    message: 'Your monthly SIP of ₹10,000 for "Vegetable Farming" will be debited on March 5, 2026.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    read: false,
    metadata: {
      projectName: 'Vegetable Farming',
      amount: 10000,
    }
  },
  {
    id: 'notif_inv_4',
    type: 'PROFIT_DISTRIBUTED',
    title: 'Profit Credited! 💰',
    message: 'Profit of ₹28,500 from "Wheat Cultivation" has been credited to your wallet. ROI: 19%',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    actionUrl: '/investor/wallet',
    metadata: {
      projectName: 'Wheat Cultivation',
      amount: 28500,
    }
  },
  {
    id: 'notif_inv_5',
    type: 'PROJECT_FUNDED',
    title: 'Project Fully Funded',
    message: '"Mango Orchard Development" has reached its funding goal. Project will begin operations next week.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    actionUrl: '/projects/3',
    metadata: {
      projectName: 'Mango Orchard Development',
    }
  },
];

export const ADMIN_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_admin_1',
    type: 'SYSTEM_ALERT',
    title: 'New Projects Pending Approval',
    message: '24 projects are awaiting admin review. Please review and approve within 48 hours.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    read: false,
    actionUrl: '/admin/dashboard',
  },
  {
    id: 'notif_admin_2',
    type: 'SYSTEM_ALERT',
    title: 'High Platform Activity',
    message: 'Platform experiencing 5,000+ concurrent users. All systems operating normally.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true,
  },
];
