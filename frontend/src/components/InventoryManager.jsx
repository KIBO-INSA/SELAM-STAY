import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertCircle, ShoppingCart, RefreshCcw, TrendingDown, Check } from 'lucide-react';

export default function InventoryManager() {
  const [items, setItems] = useState([]);
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stockRes, optRes] = await Promise.all([
        inventoryAPI.getStatus(),
        inventoryAPI.getOptimization()
      ]);
      setItems(stockRes.data);
      setOptimization(optRes.data);
    } catch (err) {
      console.error("Failed to fetch inventory data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStock = async (id, current_stock) => {
    setUpdating(id);
    try {
      await inventoryAPI.updateStock(id, current_stock);
      await fetchData(); // Refresh
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCcw className="animate-spin text-amber-600" size={32} />
    </div>
  );

  const alerts = optimization?.alerts || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* AI Insights Header */}
      <div className="bg-gradient-to-r from-amber-700 to-coffee-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-amber-300" size={24} />
            <h2 className="text-2xl font-heading font-bold">Smart Inventory Insights</h2>
          </div>
          <p className="text-amber-100/80 max-w-2xl text-sm sm:text-base">
            Selam AI predicts your resource consumption based on the 7-day occupancy forecast ({Math.round((optimization?.forecast_occupancy?.reduce((a,b)=>a+b,0)/7)*100)}% avg).
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingDown size={120} />
        </div>
      </div>

      {/* Alerts / Reorder Suggestions */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {alerts.map((alert) => (
              <motion.div
                key={alert.item_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm ${
                  alert.urgency === 'high' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                }`}
              >
                <div className={`p-3 rounded-xl ${alert.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  <AlertCircle size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900">{alert.name}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      alert.urgency === 'high' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {alert.urgency} Risk
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 lines-clamp-2">
                    Predicted to fall below {alert.min_level}{alert.unit} threshold in 7 days.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-800">
                      Suggested Order: <span className="text-lg text-coffee-800">{alert.suggested_order} {alert.unit}</span>
                    </div>
                    <button className="bg-coffee-800 hover:bg-coffee-900 text-white p-2 rounded-lg transition-colors">
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Full Inventory Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-heading font-bold text-lg text-gray-900">Current Stock Levels</h3>
          <button onClick={fetchData} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-amber-600">
            <RefreshCcw size={18} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-gray-50">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-[10px] text-gray-400 capitalize">{item.supplier}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{item.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    {item.current_stock <= item.min_stock_level ? (
                      <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> LOW STOCK
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                        <Check size={12} /> SECURE
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`text-sm font-mono font-bold ${item.current_stock <= item.min_stock_level ? 'text-red-600' : 'text-coffee-900'}`}>
                         {item.current_stock}
                       </span>
                       <span className="text-[10px] text-gray-400 lowercase">{item.unit_measure}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleUpdateStock(item.id, item.current_stock + 10)}
                      disabled={updating === item.id}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 disabled:opacity-50"
                    >
                      {updating === item.id ? '...' : '+10 Restock'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
