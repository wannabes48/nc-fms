'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, X, ReceiptText, User, Download } from 'lucide-react';

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    if (!session?.user?.apiToken) return;
    setIsExporting(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/export/?search=${search}&status=${statusFilter}`, {
        headers: { 'Authorization': `Token ${session.user.apiToken}` }
      });
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `treasury_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.apiToken) return;
    
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/?page=${page}&search=${search}&status=${statusFilter}`, {
          headers: { 'Authorization': `Token ${session.user.apiToken}` }
        });
        const data = await res.json();
        setTransactions(data.results || []);
        setTotalPages(Math.ceil(data.count / 10) || 1); 
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(timer);
  }, [session, page, search, statusFilter]);

  return (
    <div className="space-y-6 relative">
      {/* Header & Controls remain unchanged */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-[#232420]">Ledger Records</h1>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6A62]" />
            <input 
              type="text"
              placeholder="Search ref or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-[8px] border border-[#E4E1D8] focus:border-[#0F6E56] outline-none"
            />
          </div>
          <div className="w-40">
            <CustomSelect 
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'FAILED', label: 'Failed' }
              ]}
              className="text-sm"
            />
          </div>
          
          <button 
            onClick={handleExportCSV}
            disabled={isExporting}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-[8px] transition-colors ${
              isExporting ? 'bg-[#A5D6A7] cursor-not-allowed' : 'bg-[#0F6E56] hover:bg-[#085041]'
            }`}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="hidden sm:inline">Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#E4E1D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#FAF9F6] border-b border-[#E4E1D8] text-[#6B6A62]">
              <tr>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E1D8]">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-[#6B6A62]">Loading records...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-[#6B6A62]">No transactions found.</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-[#185FA5]">{tx.paystack_reference}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#232420]">{tx.member_name}</div>
                      <div className="text-xs text-[#6B6A62]">{tx.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#232420]">KES {parseFloat(tx.total_amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-[#6B6A62]">
                      {new Date(tx.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                        tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                        tx.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Wire up the Eye Button */}
                      <button 
                        onClick={() => setSelectedTx(tx)}
                        className="text-[#0F6E56] hover:text-[#085041] p-1.5 rounded-md hover:bg-green-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-[#E4E1D8] flex items-center justify-between bg-[#FAF9F6]">
          <div className="text-sm text-[#6B6A62]">
            Page <span className="font-medium text-[#232420]">{page}</span> of <span className="font-medium text-[#232420]">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-1.5 rounded-[6px] border border-[#E4E1D8] bg-white text-[#232420] hover:bg-[#FAF9F6] disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0 || loading}
              className="p-1.5 rounded-[6px] border border-[#E4E1D8] bg-white text-[#232420] hover:bg-[#FAF9F6] disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Transaction Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[12px] shadow-xl border border-[#E4E1D8] flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 border-b border-[#E4E1D8]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-[#0F6E56]">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#232420]">Transaction Details</h3>
                  <p className="text-xs font-mono text-[#6B6A62]">{selectedTx.paystack_reference}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTx(null)} className="text-[#6B6A62] hover:text-[#232420] bg-[#FAF9F6] hover:bg-[#E4E1D8] p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Member & Church Details */}
              <div className="grid grid-cols-2 gap-4 bg-[#FAF9F6] p-4 rounded-[8px] border border-[#E4E1D8]">
                <div>
                  <div className="text-xs text-[#6B6A62] mb-1">Giver</div>
                  <div className="font-semibold text-[#232420] flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    {selectedTx.member_name}
                  </div>
                  <div className="text-xs text-[#6B6A62] mt-0.5">{selectedTx.phone_number}</div>
                </div>
                <div>
                  <div className="text-xs text-[#6B6A62] mb-1">Local Church</div>
                  <div className="font-semibold text-[#232420]">{selectedTx.church_name || 'Nyamira Conference'}</div>
                  <div className="text-xs text-[#6B6A62] mt-0.5">
                    {new Date(selectedTx.created_at).toLocaleString('en-GB')}
                  </div>
                </div>
              </div>

              {/* Fund Allocation Breakdown */}
              <div>
                <h4 className="text-sm font-bold text-[#6B6A62] uppercase tracking-wider mb-3">Fund Split Allocation</h4>
                <div className="space-y-3">
                  {selectedTx.allocations?.map((alloc: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-3 border-b border-[#E4E1D8] last:border-0 last:pb-0">
                      <div>
                        <div className="font-medium text-[#232420]">{alloc.category_name}</div>
                        {alloc.custom_description && (
                          <div className="text-xs text-[#185FA5] mt-0.5 font-medium italic">
                            Note: {alloc.custom_description}
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-[#232420]">
                        KES {parseFloat(alloc.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer with Total */}
            <div className="p-6 border-t border-[#E4E1D8] bg-[#FAF9F6] rounded-b-[12px] flex justify-between items-center">
              <span className="text-sm font-medium text-[#6B6A62]">Total Amount Paid</span>
              <span className="text-2xl font-bold text-[#0F6E56]">
                KES {parseFloat(selectedTx.total_amount).toLocaleString()}
              </span>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
}
