'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Receipt, Clock, Church } from 'lucide-react';

export default function MemberDashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [user, setUser] = useState<{ firstName: string; church: string } | null>(null);
  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Fetch real data from Django
    fetch('http://localhost:8000/api/transactions/history/', {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(data => {
      // DRF returns paginated data in a 'results' array
      if (data && Array.isArray(data.results)) {
        setHistory(data.results);
      } else if (Array.isArray(data)) {
        setHistory(data);
      } else {
        console.error("Unexpected API response format:", data);
        setHistory([]);
      }
    })
    .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    // Calculate dynamic greeting based on client's local time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:8000/api/auth/profile/', {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser({
          firstName: data.first_name || 'Member',
          church: data.local_church_name || 'Nyamira Conference'
        });
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-8">
      {/* Dynamic Header */}
      <div className="bg-white rounded-[12px] p-6 border border-[#E4E1D8] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#232420]">
            {greeting}, {user ? user.firstName : 'Loading...'}.
          </h1>
          <p className="text-sm text-[#6B6A62] mt-1 flex items-center gap-2">
            <Church className="w-4 h-4 text-[#0F6E56]" />
            {user ? user.church : 'Loading church...'}
          </p>
        </div>
        <Link href="/member/give" className="bg-[#0F6E56] text-white px-6 py-3 rounded-[8px] font-medium hover:bg-[#085041] transition-colors shadow-sm">
          Give Offering
        </Link>
      </div>

      {/* Primary Action Card (Give Now) */}
      <div className="bg-white rounded-[12px] p-6 md:p-8 shadow-sm border border-[#E4E1D8] flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-[#0F6E56]/10 text-[#0F6E56] rounded-full flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#232420] mb-2">Return your offering</h2>
        <p className="text-[#6B6A62] mb-8 max-w-sm text-sm">
          Tithe, local church budget, or conference funds. Return via M-Pesa or Card securely.
        </p>
        <Link 
          href="/member/give" 
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#0F6E56] text-white px-8 py-3 rounded-[8px] font-medium hover:bg-[#085041] transition-colors"
        >
          Give Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Recent Activity Strip */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-[#232420]">Recent Activity</h3>
          <Link href="/member/history" className="text-sm text-[#185FA5] font-medium hover:underline">
            View all
          </Link>
        </div>
        
        <div className="bg-white rounded-[12px] border border-[#E4E1D8] divide-y divide-[#E4E1D8] overflow-hidden">
          {history.length === 0 ? (
            <div className="p-6 text-center text-[#6B6A62] text-sm">
              No recent transactions found.
            </div>
          ) : (
            history.slice(0, 3).map((tx: any) => (
              <div key={tx.paystack_reference} className="p-4 flex justify-between items-center hover:bg-[#FAF9F6] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 text-[#6B6A62] rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    {/* If using allocations, you might want to map through tx.allocations here */}
                    <p className="font-semibold text-[#232420] text-sm">Online Giving</p>
                    <p className="text-xs text-[#6B6A62]">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#232420]">KES {parseFloat(tx.total_amount).toLocaleString()}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${tx.status === 'COMPLETED' ? 'text-[#0F6E56]' : 'text-[#BA7517]'}`}>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
