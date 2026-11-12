'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, Users, ShoppingBag, Package, 
  ChevronRight, AlertTriangle, Settings, Home, LogOut
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { NewOrderAlert } from '@/components/notifications/NewOrderAlert'
import { signOut } from 'next-auth/react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    customers: 0,
    lowStock: 0
  })

  useEffect(() => {
    // Fetch stats from API
    fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => setStats(data))
  }, [])

  const cards = [
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Today\'s Revenue', value: `₹${stats.revenue}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'New Customers', value: stats.customers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Low Stock Items', value: stats.lowStock, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' }
  ]

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6 lg:p-10 font-poppins">
      {/* ── New Order Alert Overlay ── */}
      <NewOrderAlert />
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-playfair text-primary">Admin Dashboard</h1>
          <p className="text-text-secondary">Overview of The Royal Comfort operations</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link 
            href="/" 
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-white border border-border rounded-2xl text-sm font-bold text-text-secondary hover:text-primary transition-all shadow-sm hover:shadow-md"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <button 
            onClick={() => {
              localStorage.removeItem('cached_session_cookie_name')
              localStorage.removeItem('cached_session_cookie_val')
              sessionStorage.removeItem('restore_attempted')
              signOut({ callbackUrl: '/auth/login' })
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-100 transition-all shadow-sm hover:shadow-md"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card, i) => (
            <motion.div 
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[2rem] border border-border shadow-sm flex items-center justify-between"
            >
                <div>
                   <p className="text-[10px] font-bold text-text-secondary uppercase mb-1">{card.title}</p>
                   <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center`}>
                    <card.icon className="w-6 h-6" />
                </div>
            </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Links */}
        <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-bold font-playfair mb-4 px-2">Management</h2>
            <Link href="/admin/menu-manager" className="flex items-center justify-between p-6 bg-white rounded-3xl border border-border hover:border-primary transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                        <Package className="w-6 h-6" />
                    </div>
                <div>
                    <h3 className="font-bold">Menu Manager</h3>
                    <p className="text-xs text-text-secondary">Edit dishes & categories</p>
                </div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/admin/qr-generator" className="flex items-center justify-between p-6 bg-white rounded-3xl border border-border hover:border-primary transition-all group text-left">
                <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-left">
                        <span className="text-xl font-bold">QR</span>
                    </div>
                <div>
                    <h3 className="font-bold">QR Generator</h3>
                    <p className="text-xs text-text-secondary">Branded menu QR codes</p>
                </div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/admin/settings" className="flex items-center justify-between p-6 bg-white rounded-3xl border border-border hover:border-primary transition-all group text-left">
                <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center text-left">
                        <Settings className="w-6 h-6" />
                    </div>
                <div>
                    <h3 className="font-bold">Settings</h3>
                    <p className="text-xs text-text-secondary">Restaurant profile & info</p>
                </div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>

        {/* Placeholder for charts/recent activity */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-playfair">Recent Orders</h2>
                <Link href="/admin/orders" className="text-sm text-primary font-bold hover:underline">View All</Link>
            </div>
            
            <div className="space-y-4">
                {/* Order items placeholder */}
                <div className="text-center py-20 opacity-20">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-xl font-bold font-playfair">No orders yet</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
