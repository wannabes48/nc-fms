'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TrendingUp, Users, Wallet, ArrowUpRight, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function StaffDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  
  const [kpis, setKpis] = useState({ total: 0, tithe: 0, offerings: 0, members: 0, growth: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [fundBreakdown, setFundBreakdown] = useState([]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.apiToken) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/`, {
        headers: {
          'Authorization': `Token ${session.user.apiToken}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.kpis) {
            setKpis(data.kpis);
            setWeeklyData(data.weekly_data);
            setFundBreakdown(data.fund_breakdown);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch analytics", err);
          setLoading(false);
        });
    }
  }, [status, session]);

  if (loading) {
    return <div className="h-full flex items-center justify-center text-[#6B6A62]">Loading live analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[12px] border border-[#E4E1D8] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-[#0F6E56]">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-1" /> {kpis.growth}%
            </span>
          </div>
          <h3 className="text-[#6B6A62] text-sm font-medium mb-1">Total Collections (YTD)</h3>
          <div className="text-2xl font-bold text-[#232420]">KES {kpis.total.toLocaleString()}</div>
        </div>

        <div className="bg-white p-6 rounded-[12px] border border-[#E4E1D8] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#185FA5]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-[#6B6A62] text-sm font-medium mb-1">Tithe</h3>
          <div className="text-2xl font-bold text-[#232420]">KES {kpis.tithe.toLocaleString()}</div>
        </div>

        <div className="bg-white p-6 rounded-[12px] border border-[#E4E1D8] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-[#BA7517]">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-[#6B6A62] text-sm font-medium mb-1">Local Offerings</h3>
          <div className="text-2xl font-bold text-[#232420]">KES {kpis.offerings.toLocaleString()}</div>
        </div>

        <div className="bg-white p-6 rounded-[12px] border border-[#E4E1D8] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-[#6B6A62] text-sm font-medium mb-1">Active Givers</h3>
          <div className="text-2xl font-bold text-[#232420]">{kpis.members}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[12px] border border-[#E4E1D8] shadow-sm">
          <h3 className="text-lg font-bold text-[#232420] mb-6">Collection Trends (Last 8 Weeks)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTithe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F6E56" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0F6E56" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOffering" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#185FA5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#185FA5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E1D8" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6A62' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6A62' }} tickFormatter={(val) => `KES ${val.toLocaleString()}`} width={80} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E4E1D8', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                  formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="tithe" name="Tithe" stroke="#0F6E56" strokeWidth={2} fillOpacity={1} fill="url(#colorTithe)" />
                <Area type="monotone" dataKey="offering" name="Offering" stroke="#185FA5" strokeWidth={2} fillOpacity={1} fill="url(#colorOffering)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[12px] border border-[#E4E1D8] shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-[#232420] mb-6">Fund Breakdown</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fundBreakdown} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E4E1D8" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#232420', fontWeight: 500 }} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, 'Amount']} />
                {/* Dynamic Bar Coloring can be added via Cell mapping, but a standard color works fine */}
                <Bar dataKey="value" fill="#0F6E56" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
