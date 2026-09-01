'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, ArrowLeft, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';

export default function GivePage() {
  const [view, setView] = useState<'categories' | 'amounts' | 'wait' | 'receipt'>('categories');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, any>>({});
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  // 1. Fetch real categories from Django on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:8000/api/categories/', {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => res.json())
      .then(data => setDbCategories(data.results || data))
      .catch(err => console.error(err));
  }, []);

  const toggleCategory = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
      const newAmounts = { ...amounts };
      delete newAmounts[id];
      setAmounts(newAmounts);
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const totalAmount = Object.values(amounts).reduce((sum, val) => sum + (Number(val.amount) || 0), 0);

  // 2. Submit the payload to Django
  const handlePaymentSubmit = async () => {
    setView('wait');
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('http://localhost:8000/api/payments/initiate/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          amount: totalAmount,
          allocations: amounts // Sends exactly {"1": "5000", "2": "1000"}
        })
      });
      
      if (res.ok) {
        // Start waiting for the webhook to update the status to COMPLETED
        setTimeout(() => setView('receipt'), 5000); 
      } else {
        console.error("Payment initiation failed");
        setView('amounts');
      }
    } catch (error) {
      console.error(error);
      setView('amounts');
    }
  };

  return (
    <div className="space-y-6">
      {view !== 'wait' && view !== 'receipt' && (
        <button 
          onClick={() => view === 'amounts' ? setView('categories') : window.history.back()} 
          className="inline-flex items-center text-sm text-[#6B6A62] hover:text-[#0F6E56] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> 
          {view === 'amounts' ? 'Back to selection' : 'Back to dashboard'}
        </button>
      )}

      <div className="bg-white rounded-[12px] p-6 md:p-8 shadow-sm border border-[#E4E1D8]">
        {view === 'categories' && (
          <>
            <h2 className="text-xl font-bold text-[#232420] mb-2">Select Categories</h2>
            <p className="text-sm text-[#6B6A62] mb-6">Choose one or multiple funds to support.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {dbCategories.map((cat) => {
                const isSelected = selectedIds.includes(cat.id.toString());
                return (
                  <button 
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id.toString())}
                    className={`flex items-start gap-4 p-4 rounded-[8px] border text-left transition-all ${
                      isSelected ? 'border-[#0F6E56] bg-green-50' : 'border-[#E4E1D8] hover:border-[#0F6E56]'
                    }`}
                  >
                    <div className={`mt-1 ${isSelected ? 'text-[#0F6E56]' : 'text-[#E4E1D8]'}`}>
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-[#232420]">{cat.name}</div>
                      <div className="text-sm text-[#6B6A62] mt-1">{cat.description || ''}</div>
                    </div>
                  </button>
                )
              })}
            </div>
            
            <button 
              disabled={selectedIds.length === 0}
              onClick={() => setView('amounts')}
              className="w-full bg-[#0F6E56] text-white py-4 rounded-[8px] font-medium hover:bg-[#085041] disabled:opacity-50"
            >
              Continue to Amounts
            </button>
          </>
        )}

        {view === 'amounts' && (
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold text-[#232420] mb-6 text-center">Enter Amounts</h2>
            
            <div className="space-y-4 mb-8">
              {selectedIds.map(id => {
                const cat = dbCategories.find(c => c.id.toString() === id)!;
                const isOther = cat.name.toLowerCase() === 'other';

                return (
                  <div key={id} className="p-4 rounded-[8px] border border-[#E4E1D8] bg-[#FAF9F6] space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-medium text-[#232420]">{cat.name}</div>
                      <div className="relative w-1/2">
                        <span className="absolute left-3 top-3 text-sm font-medium text-[#6B6A62]">KES</span>
                        <input 
                          type="number"
                          value={amounts[id]?.amount || ''}
                          onChange={(e) => setAmounts({
                            ...amounts, 
                            [id]: { ...(amounts[id] || {}), amount: e.target.value }
                          })}
                          placeholder="0"
                          className="w-full pl-12 pr-3 py-2 text-lg font-bold rounded-[6px] border border-[#E4E1D8] focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56] outline-none text-[#232420]"
                        />
                      </div>
                    </div>

                    {isOther && (
                      <div>
                        <input 
                          type="text"
                          value={amounts[id]?.custom || ''}
                          onChange={(e) => setAmounts({
                            ...amounts, 
                            [id]: { ...(amounts[id] || {}), custom: e.target.value }
                          })}
                          placeholder="Specify what this offering is for..."
                          className="w-full px-3 py-2 text-sm rounded-[6px] border border-[#E4E1D8] focus:border-[#0F6E56] outline-none bg-white text-[#232420]"
                          required
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="border-t border-[#E4E1D8] pt-6 mb-6 flex justify-between items-center">
              <span className="text-lg font-medium text-[#6B6A62]">Total Amount</span>
              <span className="text-2xl font-bold text-[#232420]">KES {totalAmount.toLocaleString()}</span>
            </div>

            <button 
              disabled={totalAmount <= 0}
              onClick={handlePaymentSubmit}
              className="w-full bg-[#0F6E56] text-white py-4 rounded-[8px] font-medium hover:bg-[#085041] disabled:opacity-50"
            >
              Pay Total via M-Pesa
            </button>
          </div>
        )}
        
        {view === 'wait' && (
          <div className="py-12 flex flex-col items-center text-center">
            <Loader2 className="w-12 h-12 text-[#0F6E56] animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-[#232420] mb-2">Check your phone</h2>
            <p className="text-[#6B6A62] max-w-xs">
              An M-Pesa prompt has been sent to your phone. Enter your PIN to complete the transaction.
            </p>
            <button onClick={() => setView('amounts')} className="mt-8 text-sm text-[#A32D2D] hover:underline">
              Cancel payment
            </button>
          </div>
        )}
        
        {view === 'receipt' && (
          <div className="py-8 flex flex-col items-center text-center">
            <CheckCircle2 className="w-16 h-16 text-[#0F6E56] mb-6" />
            <h2 className="text-2xl font-bold text-[#232420] mb-2">Payment Received</h2>
            
            <div className="w-full max-w-sm bg-[#FAF9F6] border border-[#E4E1D8] rounded-[8px] p-4 text-left mb-8 mt-6">
              <div className="border-b border-[#E4E1D8] pb-3 mb-3">
                <div className="flex justify-between items-end">
                  <span className="text-[#6B6A62] text-sm">Total Paid</span>
                  <span className="font-bold text-[#232420] text-lg">KES {totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {selectedIds.map(id => (
                  <div key={id} className="flex justify-between">
                    <span className="text-[#6B6A62]">{dbCategories.find(c => c.id.toString() === id)?.name}</span>
                    <span className="font-medium text-[#232420]">KES {amounts[id]?.amount || '0'}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/member/dashboard" className="w-full max-w-sm bg-[#0F6E56] text-white py-3 rounded-[8px] font-medium hover:bg-[#085041] inline-flex justify-center">
              Done
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
