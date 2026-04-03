import { useState, useEffect } from 'react';
import { dashboardAPI, maintenanceAPI, sentimentAPI, pricingAPI, schedulerAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wrench, DollarSign, CalendarDays,
  AlertTriangle, CheckCircle2, AlertCircle, Clock, Package
} from 'lucide-react';
import InventoryManager from './InventoryManager';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [summary,     setSummary]     = useState(null);
  const [maintenance, setMaintenance] = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [pricing,     setPricing]     = useState([]);
  const [schedule,    setSchedule]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('overview');

  useEffect(() => {
    Promise.all([
      dashboardAPI.summary(),
      maintenanceAPI.all(),
      sentimentAPI.alerts(),
      pricingAPI.simulate(),
      schedulerAPI.week(),
    ]).then(([s, m, a, p, sc]) => {
      setSummary(s.data);
      setMaintenance(m.data);
      setAlerts(a.data);
      setPricing(p.data);
      setSchedule(sc.data.schedule || []);
    }).finally(() => setLoading(false));
  }, []);

  const resolveAlert = async (id) => {
    await sentimentAPI.resolve(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-coffee-800">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <Clock size={32} />
          </motion.div>
          <span className="font-heading font-medium">Loading Selam Stay Dashboard...</span>
        </div>
      </div>
    );
  }

  const sentimentData = summary ? [
    { name: 'Positive', value: summary.sentiment_breakdown.positive },
    { name: 'Neutral',  value: summary.sentiment_breakdown.neutral },
    { name: 'Negative', value: summary.sentiment_breakdown.negative },
  ] : [];

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'pricing', label: 'Pricing Engine', icon: DollarSign },
    { id: 'schedule', label: 'Staff Schedule', icon: CalendarDays },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, count: alerts.length },
  ];

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-heading font-bold text-coffee-900">Manager Dashboard</h1>
        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-amber-700 bg-amber-50' : 'text-gray-600 hover:text-coffee-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="ml-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* OVERVIEW */}
          {activeTab === 'overview' && summary && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Occupancy" value={`${summary.occupancy.percentage}%`} sub={`Rooms: ${summary.occupancy.occupied}/${summary.occupancy.total_rooms}`} color="border-green-500" />
                <KPICard title="Today's Revenue" value={`ETB ${summary.revenue.today_etb}`} sub="Estimated based on occupied" color="border-amber-500" />
                <KPICard title="Unresolved Alerts" value={summary.alerts.unresolved_negative_feedback} sub="Guest feedback issues" color="border-red-500" />
                <KPICard title="Critical Maintenance" value={summary.alerts.critical_maintenance} sub="Needs immediate action" color="border-orange-500" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-heading font-semibold text-coffee-900 mb-4">Guest Sentiment</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2}>
                          {sentimentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36}/>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-heading font-semibold text-coffee-900 mb-4">Dynamic Pricing (ETB)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pricing} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="room_type" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="base_price" name="Base Price" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={32} />
                        <Bar dataKey="recommended_price" name="Optimized Price" fill="#D97706" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INVENTORY */}
          {activeTab === 'inventory' && (
            <InventoryManager />
          )}

          {/* MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-heading font-semibold text-coffee-900">Equipment Risk Analysis</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-4">Equipment</th>
                      <th className="px-6 py-4">Usage (hrs)</th>
                      <th className="px-6 py-4">Risk Score</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Action Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {maintenance.map((m, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{m.equipment}</td>
                        <td className="px-6 py-4 text-gray-600">{m.usage_hours}h</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{m.risk_score}</span>
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${m.risk_level === 'critical' ? 'bg-red-500' : m.risk_level === 'warning' ? 'bg-amber-500' : 'bg-green-500'}`}
                                style={{ width: `${m.risk_score * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
                            ${m.risk_level === 'critical' ? 'bg-red-50 text-red-700' : 
                              m.risk_level === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}
                          `}>
                            {m.risk_level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{m.recommendation || 'Normal operation'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRICING */}
          {activeTab === 'pricing' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pricing.map((p, i) => {
                const isUp = p.change_percent >= 0;
                return (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-heading font-semibold text-gray-900">{p.room_type}</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${
                        isUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {isUp ? '↑' : '↓'} {Math.abs(p.change_percent)}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Base Rate: <span className="line-through">ETB {p.base_price}</span></p>
                      <p className="text-3xl font-bold text-amber-700">ETB {p.recommended_price}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-heading font-semibold text-coffee-900">7-Day Staff Optimization</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium whitespace-nowrap">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Day</th>
                      <th className="px-6 py-4">Est. Occupancy</th>
                      <th className="px-6 py-4">Staff Req.</th>
                      <th className="px-6 py-4">Shift Assignments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schedule.map((s, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">{s.date}</td>
                        <td className="px-6 py-4 text-gray-600">{s.weekday}</td>
                        <td className="px-6 py-4 text-gray-700 font-medium">{Math.round(s.occupancy * 100)}%</td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{s.staff_needed}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(s.assignments || {}).map(([name, shift]) => (
                              <span key={name} className="inline-flex items-center px-2 py-1 rounded bg-coffee-50 text-coffee-800 text-xs font-medium">
                                {name} ({shift.split(' ')[0]})
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-heading font-semibold text-coffee-900">Guest Feedback Alerts</h3>
                <span className="text-sm font-medium text-gray-500">{alerts.length} unresolved issue(s)</span>
              </div>
              
              {alerts.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-500 mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-lg font-heading font-medium text-gray-900">All caught up!</h4>
                  <p className="text-gray-500 mt-1">There are no unresolved guest complaints.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {alerts.map(a => (
                    <div key={a.id} className="bg-red-50/50 border border-red-100 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 justify-between sm:items-start">
                      <div className="flex gap-4">
                        <div className="text-red-500 shrink-0"><AlertCircle size={24} /></div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-gray-900">Room {a.room_number}</span>
                            <span className="text-xs text-gray-500">{new Date(a.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">"{a.message}"</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => resolveAlert(a.id)}
                        className="bg-white border border-gray-200 text-gray-700 hover:text-green-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function KPICard({ title, value, sub, color }) {
  return (
    <div className={`bg-white p-6 rounded-2xl border border-gray-100 border-t-4 ${color} shadow-sm hover:shadow-md transition-shadow`}>
      <h4 className="text-sm font-medium text-gray-500 mb-2">{title}</h4>
      <div className="text-3xl font-heading font-bold text-coffee-900 mb-1">{value}</div>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}
