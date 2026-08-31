'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function TransactionsPage() {
  const auth = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Fetch from Django API with page parameter
    fetch(`http://localhost:8000/api/transactions/?page=${page}`, {
      headers: { 'Authorization': `Token ${auth?.token}` }
    })
    .then(res => res.json())
    .then(data => {
      setTransactions(data.results);
      setTotalPages(Math.ceil(data.count / 10)); // Assuming 10 items per page
    });
  }, [page, auth?.token]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-2 px-4 border-b">Reference</th>
            <th className="py-2 px-4 border-b">Amount (KES)</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Church</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx: any) => (
            <tr key={tx.paystack_reference} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{tx.paystack_reference}</td>
              <td className="py-2 px-4 border-b">{tx.total_amount}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 py-1 rounded text-xs ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {tx.status}
                </span>
              </td>
              <td className="py-2 px-4 border-b">{tx.local_church?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination Controls */}
      <div className="flex justify-between mt-4">
        <button 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        <span className="py-2">Page {page} of {totalPages}</span>
        <button 
          disabled={page === totalPages} 
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}