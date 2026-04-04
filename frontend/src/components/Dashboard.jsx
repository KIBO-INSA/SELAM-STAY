import { useState, useEffect } from 'react';
import { dashboardAPI, sentimentAPI } from '../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Users, Heart, Target, 
  Zap, Sparkles, DollarSign, ArrowUpRight,
  ChevronRight, BrainCircuit, Activity,
  RefreshCcw, Globe, AlertCircle, Award,
  Map, Star
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
  const [data,       setData]    = useState(null);
  const [loading,    setLoading] = useState(true);
  const [error,      setError]   = useState(null);
  const [activeTab,  setActiveTab] = useState('overview');
  const [tasks,      setTasks]   = useState([]);
  const [tasksError, setTasksError] = useState(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setError(null);
    setTasksError(null);
    dashboardAPI.summary()
      .then(res => setData(res.data))
      .catch(err => {
        setError(err);
        setData(null);
      })
      .finally(() => setLoading(false));

    dashboardAPI.tasks()
      .then(res => setTasks(res.data?.tasks || []))
      .catch(err => {
        setTasksError(err);
        setTasks([]);
      });
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0b]">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-amber-500 mb-4"
        >
          <Globe size={48} />
        </motion.div>
        <h2 className="text-xl font-heading font-bold text-white tracking-widest uppercase animate-pulse">
          Connecting African Nations...
        </h2>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0b] text-white gap-4">
        <div className="text-rose-400">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-xl font-heading font-bold tracking-widest uppercase">
          Dashboard data unavailable
        </h2>
        <p className="text-sm text-gray-400 max-w-xl text-center">
          The server returned an error for <span className="text-gray-300">/api/dashboard/summary</span>. Please try again.
        </p>
        <button
          onClick={refreshData}
          className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          Retry
        </button>
        {error ? (
          <p className="text-xs text-gray-500">{String(error?.message || error)}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0b] text-white selection:bg-amber-500/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-500 font-bold tracking-wider text-xs uppercase">
              <Sparkles size={14} />
              <span>Pan-African Intelligence Hub</span>
            </div>
            <h1 className="text-4xl font-heading font-black tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Kuriftu <span className="text-amber-500 italic">African Village</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
              {['overview', 'cultural', 'revenue', 'guests'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === t 
                    ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                    : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button 
              onClick={refreshData}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors"
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Global AI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            label="Total Daily Revenue" 
            value={`ETB ${data.revenue.today_etb.toLocaleString()}`} 
            trend="+12.5%" 
            isUp={true}
            icon={DollarSign}
            color="amber"
          />
          <MetricCard 
            label="Cultural Engagement" 
            value={`${data.cultural_performance.reduce((acc, curr) => acc + curr.engagement, 0) / data.cultural_performance.length}%`} 
            trend="Active" 
            icon={Map}
            color="blue"
          />
          <MetricCard 
            label="Avg Sentiment" 
            value="91%" 
            trend="+2.1%" 
            isUp={true}
            icon={Heart}
            color="rose"
          />
          <MetricCard 
            label="Experience Gaps" 
            value={data.cultural_performance.filter(v => v.status === 'Gap').length} 
            trend="Action Required" 
            icon={AlertCircle}
            color="rose"
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* OVERVIEW CONTENT */}
            {activeTab === 'overview' && (
              <>
                {/* Revenue Forecast Chart */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-heading font-bold flex items-center gap-3">
                      <TrendingUp className="text-blue-500" />
                      Revenue Predictive Analytics
                    </h3>
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-blue-500/30">
                      G3 Forecast
                    </span>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.revenue.forecast} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px', color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Experience Gaps & Automations */}
                <div className="bg-gradient-to-br from-rose-900/10 to-amber-900/10 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-2xl">
                  <h3 className="text-xl font-heading font-bold mb-6 flex items-center gap-3">
                    <AlertCircle className="text-rose-500" />
                    Experience Gaps
                  </h3>
                  <div className="space-y-4">
                    {data.cultural_performance.filter(v => v.status === 'Gap').map(v => (
                      <div key={v.villa} className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white uppercase text-xs tracking-widest">{v.villa} Villa</span>
                          <span className="text-[10px] text-rose-400 font-black">{v.sentiment}% Mood</span>
                        </div>
                        <p className="text-xs text-gray-400">Low engagement with in-room artifacts reported. AI suggesting proactive digital guide session.</p>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-xs font-black uppercase text-amber-500 tracking-tighter mb-4">AI Recovery Actions</h4>
                      <AutomationItem title="Zambia Cultural Boost" desc="Sent push notification for 1963 Restaurant 'Nshima' special to current Zambia villa guest." impact="Engaged" />
                    </div>
                  </div>
                </div>

                {/* Task Schedule */}
                <div className="lg:col-span-3 bg-white/5 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-heading font-bold flex items-center gap-3">
                      <Activity className="text-amber-500" />
                      Task Schedule
                    </h3>
                    <span className="text-xs text-gray-400">
                      {tasks?.length || 0} active
                    </span>
                  </div>

                  {tasksError ? (
                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-sm text-rose-300">
                      Failed to load task schedule.
                    </div>
                  ) : (tasks?.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-widest text-gray-400 border-b border-white/10">
                            <th className="py-3 pr-4">Ref</th>
                            <th className="py-3 pr-4">Category</th>
                            <th className="py-3 pr-4">Room</th>
                            <th className="py-3 pr-4">Status</th>
                            <th className="py-3 pr-4">Assigned Staff</th>
                            <th className="py-3">Assigned At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.slice(0, 20).map(t => {
                            const staff = t.assigned_staff;
                            const staffLabel = staff?.name ? `${staff.name}${staff.role ? ` (${staff.role})` : ''}` : (staff?.id ? `Staff #${staff.id}` : 'Unassigned');
                            const assignedAt = t.assigned_at ? new Date(t.assigned_at).toLocaleString() : '—';
                            const statusColor = t.status === 'in_progress'
                              ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                              : t.status === 'pending'
                                ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30';

                            return (
                              <tr key={t.id} className="border-b border-white/5 last:border-b-0">
                                <td className="py-3 pr-4 font-mono text-xs text-gray-300">#{t.ref_id || t.id}</td>
                                <td className="py-3 pr-4 text-gray-200">{t.category || '—'}</td>
                                <td className="py-3 pr-4 text-gray-200">{t.room_number || '—'}</td>
                                <td className="py-3 pr-4">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                                    {t.status || '—'}
                                  </span>
                                </td>
                                <td className="py-3 pr-4 text-gray-200">{staffLabel}</td>
                                <td className="py-3 text-gray-400">{assignedAt}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-gray-300">
                      No active tasks right now.
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* CULTURAL INTELLIGENCE CONTENT */}
            {activeTab === 'cultural' && (
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-3xl">
                  <h3 className="text-xl font-heading font-bold mb-8 flex items-center gap-3">
                    <Globe className="text-amber-500" />
                    Pan-African Consistency Score
                  </h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.cultural_performance}>
                        <PolarGrid stroke="#ffffff20" />
                        <PolarAngleAxis dataKey="villa" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <Radar
                          name="Engagement"
                          dataKey="engagement"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Sentiment"
                          dataKey="sentiment"
                          stroke="#f59e0b"
                          fill="#f59e0b"
                          fillOpacity={0.6}
                        />
                        <Legend />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '16px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-6">
                  <h3 className="text-lg font-heading font-bold flex items-center gap-2">
                    <Award className="text-amber-500" />
                    Villa Rankings
                  </h3>
                  <div className="space-y-4">
                    {data.cultural_performance.sort((a,b) => b.engagement - a.engagement).map((v, i) => (
                      <div key={v.villa} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${i < 2 ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest">{v.villa}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{v.status}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-amber-500">{v.engagement}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* REVENUE & YIELD INTELLIGENCE */}
            {activeTab === 'revenue' && (
              <div className="lg:col-span-3 space-y-8">
                {/* Yield Strategy Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard 
                    label="RevPAR" 
                    value={`ETB ${data.kpis.revpar.toLocaleString()}`} 
                    trend={`Yield: ${data.kpis.yield_index}%`} 
                    icon={Target}
                    color="blue"
                  />
                  <MetricCard 
                    label="ADR" 
                    value={`ETB ${data.kpis.adr.toLocaleString()}`} 
                    trend="Market Average: +15%" 
                    icon={DollarSign}
                    color="amber"
                  />
                  <MetricCard 
                    label="Service Forecast" 
                    value={`ETB ${data.revenue.service_revenue.toLocaleString()}`} 
                    trend="High Demand" 
                    icon={Zap}
                    color="rose"
                  />
                  <MetricCard 
                    label="Total Daily Goal" 
                    value="92%" 
                    trend="On Track" 
                    icon={Activity}
                    color="blue"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* Dynamic Pricing AI Analysis */}
                   <div className="lg:col-span-2 bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-3xl">
                      <div className="flex items-center justify-between mb-8">
                         <h3 className="text-xl font-heading font-bold flex items-center gap-3">
                            <BrainCircuit className="text-amber-500" />
                            Market Intelligence & AI Pricing Strategy
                         </h3>
                         <div className="flex gap-2">
                           <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black border border-amber-500/20 uppercase tracking-widest">Live Optimization</span>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                               <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">AI Reasoning</p>
                               <p className="text-lg font-bold text-white mb-4 italic">"{data.pricing_recommendation.direction === 'increase' ? 'Higher demand detected due to weekend surge and festival proximity. Increasing rates to capture maximum value.' : 'Occupancy is below 50%. Activating flash discounts to drive last-minute bookings.'}"</p>
                               <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                     <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 mb-1">
                                        <span>Market Demand</span>
                                        <span>{data.pricing_recommendation.occupancy_rate * 100}%</span>
                                     </div>
                                     <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: `${data.pricing_recommendation.occupancy_rate * 100}%` }} />
                                     </div>
                                  </div>
                               </div>
                            </div>
                            
                            <div className="space-y-4">
                               <h4 className="text-xs font-black uppercase text-amber-500 tracking-widest">Optimal Rate vs Competitor</h4>
                               <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                  <span className="text-xs font-bold">Kuriftu Dynamic Rate</span>
                                  <span className="text-lg font-black text-white">ETB {data.pricing_recommendation.recommended_price.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 opacity-50">
                                  <span className="text-xs font-bold">Local Market Avg</span>
                                  <span className="text-lg font-black text-gray-400">ETB 180,000</span>
                                </div>
                            </div>
                         </div>

                         <div className="bg-stone-900/50 p-6 rounded-3xl border border-white/10">
                            <h4 className="text-xs font-black uppercase text-amber-500 tracking-widest mb-6 border-b border-white/5 pb-4">Service Yield Management</h4>
                            <div className="space-y-6">
                               {Object.entries(data.service_pricing).map(([name, prices]) => (
                                 <div key={name} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                       <span>{name}</span>
                                       <span className={prices.optimized < prices.base ? 'text-green-400' : 'text-amber-400'}>
                                          {prices.optimized < prices.base ? 'Flash Discount' : 'Standard Yield'}
                                       </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                       <span className="text-sm font-bold text-gray-400 line-through">ETB {prices.base}</span>
                                       <div className="flex items-center gap-2">
                                          <ArrowUpRight size={14} className={prices.optimized < prices.base ? 'rotate-90 text-green-400' : 'text-amber-400'} />
                                          <span className="text-xl font-black text-white">ETB {prices.optimized}</span>
                                       </div>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-gradient-to-br from-amber-600/10 to-transparent border border-white/10 p-8 rounded-[3rem] backdrop-blur-3xl flex flex-col justify-between">
                      <div>
                        <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-black mb-8 shadow-2xl shadow-amber-500/20">
                           <Target size={32} />
                        </div>
                        <h3 className="text-2xl font-heading font-black mb-4 uppercase tracking-tighter">Profit Prediction</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">Our AI predicts a total revenue of <span className="text-white font-bold">ETB {(data.revenue.today_total * 30 * 0.9).toLocaleString()}</span> for the next 30 days based on current market velocity.</p>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-amber-500/80 font-bold italic">
                           "Tip: Occupancy surcharges are currently offsetting low service bookings."
                        </div>
                      </div>
                      <button className="mt-8 bg-white text-black py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-500 transition-all">Download P&L Report</button>
                   </div>
                </div>
              </div>
            )}

            {/* GUESTS CONTENT */}
            {activeTab === 'guests' && (
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="bg-white/5 border border-white/10 p-12 rounded-[3.5rem] text-center backdrop-blur-2xl border-t-amber-500/20">
                  <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center mb-8 mx-auto rotate-12 rotate-shadow shadow-amber-500/20">
                    <Users size={40} />
                  </div>
                  <h3 className="text-3xl font-heading font-black tracking-tight mb-4">Guest Heritage Intelligence</h3>
                  <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
                    Our AI is currently curating unique cultural journeys for {data.occupancy.occupied} villas. 
                    We are bridging the gap between property-wide consistency and individual villa country identity.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    {Object.entries(data.guest_segments).map(([name, count]) => (
                      <div key={name} className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
                        <p className="text-xs font-black uppercase text-amber-500 mb-1">{name}</p>
                        <p className="text-2xl font-black">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, isUp, icon: Icon, color }) {
  const colorMap = {
    amber: 'ring-amber-500/20 text-amber-500 bg-amber-500/5',
    blue: 'ring-blue-500/20 text-blue-500 bg-blue-500/5',
    rose: 'ring-rose-500/20 text-rose-500 bg-rose-500/5',
  };

  return (
    <div className={`p-6 rounded-[2rem] border border-white/10 backdrop-blur-3xl ring-1 ${colorMap[color]} shadow-2xl`}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-white/5 rounded-2xl">
          <Icon size={20} />
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isUp ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-500'}`}>
          {trend}
        </div>
      </div>
      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</h4>
      <p className="text-2xl font-heading font-black tracking-tighter text-white">{value}</p>
    </div>
  );
}

function AutomationItem({ title, desc, impact }) {
  return (
    <div className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all cursor-pointer">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="text-sm font-bold flex items-center gap-2">
            {title}
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-amber-500" />
          </h4>
          <p className="text-[10px] text-gray-500 leading-tight">{desc}</p>
        </div>
        <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">{impact}</span>
      </div>
    </div>
  );
}

function PricingInsightCard({ title, current, label, desc }) {
  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-2xl ring-1 ring-white/5 flex flex-col justify-between">
      <div>
        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-6">{title}</h3>
        <p className="text-4xl font-heading font-black tracking-tighter mb-1">ETB {current.toLocaleString()}</p>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">{label}</p>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed border-t border-white/10 pt-4 mt-8 italic">"{desc}"</p>
    </div>
  );
}
