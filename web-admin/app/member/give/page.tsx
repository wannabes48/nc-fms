'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, CheckSquare, Square, Download } from 'lucide-react';
import Link from 'next/link';

export default function GivePage() {
  const [view, setView] = useState<'categories' | 'amounts' | 'wait' | 'receipt' | 'failed'>('categories');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, any>>({});
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tracking state for polling
  const [currentRef, setCurrentRef] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // 1. Fetch real categories from Django on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/`, {
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
    setIsSubmitting(true);
    setPollCount(0);
    setCurrentRef(null);
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/initiate/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          amount: totalAmount,
          allocations: amounts
        })
      });
      
      const data = await res.json();
      if (res.ok && data.reference) {
        setCurrentRef(data.reference); // Save reference to start polling
        setView('wait');
      } else {
        setView('failed');
      }
    } catch (error) {
      console.error(error);
      setView('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Polling Effect: Checks backend every 2.5 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (view === 'wait' && currentRef) {
      interval = setInterval(async () => {
        // Timeout after ~60 seconds (24 polls * 2.5s)
        if (pollCount >= 24) {
          setView('failed');
          clearInterval(interval);
          return;
        }
        
        setPollCount(prev => prev + 1);
        const token = localStorage.getItem('token');

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/status/${currentRef}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            
            if (data.status === 'COMPLETED') {
              // 1. Transaction confirmed! Now securely fetch the PDF Blob
              try {
                const pdfRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/payments/receipt/${currentRef}/`, {
                  headers: { 'Authorization': `Token ${token}` }
                });
                
                if (pdfRes.ok) {
                  const blob = await pdfRes.blob();
                  const blobUrl = window.URL.createObjectURL(blob);
                  setReceiptUrl(blobUrl); // Save the local blob URL to state
                }
              } catch (err) {
                console.error("Failed to load PDF", err);
              }

              setView('receipt');
              clearInterval(interval);
            } else if (data.status === 'FAILED') {
              setView('failed');
              clearInterval(interval);
            }
            // If PENDING, the interval continues running
          }
        } catch (error) {
          console.error("Polling error", error);
        }
      }, 2500);
    }

    return () => clearInterval(interval);
  }, [view, currentRef, pollCount]);

  const handleRetry = () => {
    setView('amounts');
    setPollCount(0);
    setCurrentRef(null);
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
              disabled={totalAmount <= 0 || isSubmitting}
              onClick={handlePaymentSubmit}
              className={`w-full flex justify-center items-center gap-2 py-4 rounded-[8px] font-medium transition-colors ${
                (totalAmount <= 0 || isSubmitting) ? 'bg-[#A5D6A7] text-white cursor-not-allowed' : 'bg-[#0F6E56] text-white hover:bg-[#085041]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : 'Pay Total via M-Pesa'}
            </button>
          </div>
        )}
        
        {view === 'wait' && (
          <div className="text-center py-12 max-w-sm mx-auto">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-green-100 rounded-full animate-ping"></div>
              <div className="absolute inset-0 flex items-center justify-center bg-green-50 rounded-full text-[#0F6E56]">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#232420] mb-2">Check your phone</h2>
            <p className="text-[#6B6A62] mb-6">
              An M-Pesa prompt has been sent to your phone. Please enter your PIN to complete the transaction.
            </p>
            <p className="text-xs text-[#185FA5] animate-pulse">Waiting for confirmation...</p>
          </div>
        )}

        {view === 'failed' && (
          <div className="text-center py-12 max-w-sm mx-auto animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 text-[#A32D2D] rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-[#232420] mb-2">Payment Failed</h2>
            <p className="text-[#6B6A62] mb-8">
              The transaction was cancelled or timed out. Your account has not been charged.
            </p>
            
            <button 
              onClick={handleRetry}
              className="w-full bg-[#232420] text-white py-4 rounded-[8px] font-medium hover:bg-black transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {view === 'receipt' && (
          <div className="text-center py-8 max-w-lg mx-auto animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-50 text-[#0F6E56] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-[#232420] mb-2">Offering Received!</h2>
            <p className="text-sm text-[#6B6A62] mb-6">
              Your giving of KES {totalAmount.toLocaleString()} has been securely recorded.
            </p>
            
            {receiptUrl ? (
              <div className="mb-6 rounded-[8px] overflow-hidden border border-[#E4E1D8] shadow-sm">
                {/* INLINE PDF VIEWER */}
                <iframe 
                  src={receiptUrl} 
                  className="w-full h-80 bg-[#FAF9F6]"
                  title="Transaction Receipt"
                />
              </div>
            ) : (
              <div className="mb-6 p-4 text-sm text-[#6B6A62] bg-[#FAF9F6] rounded-[8px] border border-[#E4E1D8]">
                Generating receipt...
              </div>
            )}
            
            <div className="space-y-3">
              {receiptUrl && (
                <a 
                  href={receiptUrl}
                  download={`NC_Receipt_${currentRef}.pdf`}
                  className="w-full flex items-center justify-center gap-2 bg-[#0F6E56] text-white py-3.5 rounded-[8px] font-medium hover:bg-[#085041] transition-colors"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              )}
              
              <Link 
                href="/member/dashboard"
                className="block w-full border-2 border-[#E4E1D8] text-[#232420] py-3.5 rounded-[8px] font-medium hover:bg-[#FAF9F6] transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
