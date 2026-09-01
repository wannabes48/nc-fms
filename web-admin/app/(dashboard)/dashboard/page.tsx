'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const collectionData = [
  { name: 'Tithe', amount: 450000 },
  { name: 'Camp Meeting', amount: 120000 },
  { name: 'Local Budget', amount: 85000 },
  { name: 'Development', amount: 40000 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 font-sans">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">Total Collections</p>
          <p className="text-3xl font-bold text-slate-900">KES 695,000</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">Tithes</p>
          <p className="text-3xl font-bold text-slate-900">KES 450,000</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">Active Churches</p>
          <p className="text-3xl font-bold text-slate-900">42</p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-danger/30 bg-danger/5 shadow-sm">
          <p className="text-sm font-medium text-danger mb-2">Failed Transactions</p>
          <p className="text-3xl font-bold text-danger">3</p>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm col-span-4">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Collections by Category</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={collectionData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E1D8" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B6A62'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B6A62'}} tickFormatter={(value) => `Ksh ${value/1000}k`} />
              <Tooltip cursor={{fill: '#FAF9F6'}} contentStyle={{borderRadius: '8px', border: '1px solid #E4E1D8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="amount" fill="#0F6E56" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
