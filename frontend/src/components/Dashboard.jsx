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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currency, setCurrency] = useState('ETB');
  const [selectedProperty, setSelectedProperty] = useState('African Village');

  useEffect(() => {
    refreshData();
  }, [selectedProperty]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.summary(selectedProperty);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="flex-1 bg-[#0a0a0b] text-white selection:bg-amber-500/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-500 font-bold tracking-wider text-xs uppercase">
              <Sparkles size={14} />
              <span>Multi-Property Intelligence Hub</span>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-heading font-black tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                Kuriftu <span className="text-amber-500 italic">Enterprise</span>
              </h1>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="bg-[#18181b] border border-white/20 text-white rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
              >
                <option value="African Village">African Village</option>
                <option value="Bishoftu">Bishoftu Water Park</option>
                <option value="Entoto">Entoto Adventure</option>
              </select>
            </div>
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
          <div className="relative group cursor-pointer" onClick={() => setCurrency(currency === 'ETB' ? 'USD' : 'ETB')}>
            <MetricCard 
              label={`Total Daily Revenue (${currency})`} 
              value={`${currency} ${currency === 'ETB' ? data.revenue.today_total_etb.toLocaleString() : data.revenue.today_total_usd.toLocaleString()}`} 
              trend="Click to Toggle" 
              isUp={true}
              icon={DollarSign}
              color="amber"
            />
            <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[8px] font-black px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
              Switch to {currency === 'ETB' ? 'USD' : 'ETB'}
            </div>
          </div>
          <MetricCard 
            label="Experience Engagement" 
            value={`${data.property_performance.reduce((acc, curr) => acc + curr.engagement, 0) / data.property_performance.length}%`} 
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
            label="Supply Chain Risks" 
            value={data.alerts.supply_chain_risks} 
            trend={data.alerts.supply_chain_risks > 0 ? "Action Required" : "Stable"} 
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

                {/* Local Intelligence & Alerts */}
                <div className="bg-gradient-to-br from-indigo-900/10 to-amber-900/10 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-heading font-bold mb-6 flex items-center gap-3">
                      <Globe className="text-indigo-500" />
                      Local Market Intelligence
                    </h3>
                    <div className="space-y-4">
                      {data.alerts.upcoming_events?.map(event => (
                        <div key={event.name} className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white uppercase text-xs tracking-widest">{event.name}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-black ${
                              event.demand_impact === 'Surge' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'
                            }`}>
                              {event.demand_impact} DEMAND
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {event.type} event taking place in <span className="text-white font-bold">{event.days_away} days</span>. Yield multipliers actively adjusted.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/5">
                    <h4 className="text-xs font-black uppercase text-amber-500 tracking-tighter mb-4 flex items-center gap-2">
                      <BrainCircuit size={14} />
                      AI Prescriptive Actions
                    </h4>
                    {data.ai_actions && data.ai_actions.length > 0 ? (
                      <div className="space-y-4">
                        {data.ai_actions.map(action => (
                          <div key={action.id} className="p-4 rounded-2xl bg-[#18181b] border border-white/5 shadow-xl relative overflow-hidden group">
                            {/* Accent line based on impact */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                              action.impact === 'Critical' || action.impact === 'Urgent' ? 'bg-rose-500' :
                              action.impact === 'High' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            
                            <div className="flex justify-between items-start mb-2 pl-2">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-0.5">{action.type}</span>
                                <span className="font-bold text-white text-sm leading-tight">{action.title}</span>
                              </div>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-black ${
                                action.impact === 'Critical' || action.impact === 'Urgent' ? 'bg-rose-500/20 text-rose-400' :
                                action.impact === 'High' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {action.impact}
                              </span>
                            </div>
                            
                            <div className="pl-2 space-y-2 mb-3 mt-2">
                              <p className="text-[11px] text-gray-400 leading-relaxed">
                                <span className="text-gray-500 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Observation</span>
                                {action.observation}
                              </p>
                              <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                                <span className="text-amber-500/80 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Recommendation</span>
                                {action.recommendation}
                              </p>
                            </div>
                            
                            <div className="pl-2 mt-4">
                              <button className="w-full bg-white/5 hover:bg-amber-500 text-gray-300 hover:text-black transition-colors font-bold text-[11px] py-2 rounded-lg border border-white/5 hover:border-amber-500 flex items-center justify-center gap-2">
                                {action.button_text} <ArrowUpRight size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-500 italic text-center py-2">No active prescriptions.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* EXPERIENCE INTELLIGENCE CONTENT */}
            {activeTab === 'cultural' && (
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-3xl">
                  <h3 className="text-xl font-heading font-bold mb-8 flex items-center gap-3">
                    <Globe className="text-amber-500" />
                    Signature Experience Performance
                  </h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.property_performance}>
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
                    Experience Rankings
                  </h3>
                  <div className="space-y-4">
                    {data.property_performance.sort((a,b) => b.engagement - a.engagement).map((v, i) => (
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
                    value={`ETB ${data.revenue.service_revenue_etb?.toLocaleString()}`} 
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
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">Our AI predicts a total revenue of <span className="text-white font-bold">ETB {(data.revenue.today_total_etb * 30 * 0.9).toLocaleString()}</span> for the next 30 days based on current market velocity.</p>
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
