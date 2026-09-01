'use client';
import { useState, useEffect } from 'react';
import { Download, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/history/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data && Array.isArray(data.results)) {
        setHistory(data.results);
      } else if (Array.isArray(data)) {
        setHistory(data);
      } else {
        console.error("Unexpected API response format:", data);
        setHistory([]);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <Link href="/member/dashboard" className="inline-flex items-center text-sm text-[#6B6A62] hover:text-[#0F6E56] transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to dashboard
      </Link>

      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-bold text-[#232420]">Giving History</h1>
      </div>
      
      <div className="bg-white rounded-[12px] shadow-sm border border-[#E4E1D8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E4E1D8] bg-[#FAF9F6] flex justify-between items-center">
          <span className="font-semibold text-[#232420] text-sm">All Transactions</span>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-[#0F6E56] animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-[#6B6A62]">
            You have no giving history yet.
          </div>
        ) : (
          <div className="divide-y divide-[#E4E1D8]">
            {history.map((tx) => (
              <div key={tx.paystack_reference} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F6] transition-colors">
                <div>
                  <div className="font-bold text-[#232420]">
                    {tx.allocations?.length > 0 
                      ? tx.allocations.map((a: any) => a.category_name).join(', ') 
                      : 'Online Offering'}
                  </div>
                  <div className="text-sm text-[#6B6A62] mt-1 flex gap-3">
                    <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={`uppercase text-xs mt-0.5 tracking-wide ${tx.status === 'COMPLETED' ? 'text-[#0F6E56]' : 'text-[#BA7517]'}`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#6B6A62] mt-1 font-mono">Ref: {tx.paystack_reference}</div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 border-[#E4E1D8] pt-4 sm:pt-0">
                  <div className="text-lg font-bold text-[#232420]">
                    KES {parseFloat(tx.total_amount).toLocaleString()}
                  </div>
                  {tx.status === 'COMPLETED' && (
                    <button className="text-[#185FA5] hover:bg-blue-50 p-2 rounded-full transition-colors" title="Download Receipt">
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
