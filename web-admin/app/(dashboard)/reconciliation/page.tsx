'use client';
import { useState, useMemo } from 'react';
import { Download, Search, Filter } from 'lucide-react';
import Papa from 'papaparse';
import { 
  useTable, 
  createCoreRowModel, 
  createSortedRowModel,
  createFilteredRowModel,
  flexRender, 
  createColumnHelper 
} from '@tanstack/react-table';

type Transaction = {
  paystack_reference: string;
  total_amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  created_at: string;
  church: string;
  category: string;
};

const mockData: Transaction[] = [
  { paystack_reference: 'NC-A1B2C3D4', total_amount: 5000, status: 'COMPLETED', created_at: '2026-08-31T14:30:00Z', church: 'Nyamira Central', category: 'Tithe' },
  { paystack_reference: 'NC-X9Y8Z7W6', total_amount: 1200, status: 'PENDING', created_at: '2026-08-31T15:45:00Z', church: 'Sironga', category: 'Local Budget' },
  { paystack_reference: 'NC-M4N5O6P7', total_amount: 3500, status: 'FAILED', created_at: '2026-08-30T09:15:00Z', church: 'Kebirigo', category: 'Camp Meeting' },
];

const columnHelper = createColumnHelper<any, any>();

const columns = [
  columnHelper.accessor('paystack_reference', {
    header: 'Receipt Ref',
    cell: info => <span className="font-medium text-brand">{info.getValue()}</span>,
  }),
  columnHelper.accessor('created_at', {
    header: 'Date',
    cell: info => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor('church', { header: 'Church' }),
  columnHelper.accessor('category', { header: 'Category' }),
  columnHelper.accessor('total_amount', {
    header: () => <div className="text-right">Amount (KES)</div>,
    cell: info => <div className="text-right font-medium">{info.getValue().toLocaleString()}</div>,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const status = info.getValue();
      const style = 
        status === 'COMPLETED' ? 'text-[#0F6E56]' : 
        status === 'PENDING' ? 'text-[#BA7517]' : 
        'text-[#A32D2D]';
      return <span className={`text-xs font-bold ${style}`}>{status}</span>;
    },
  }),
];

export default function ReconciliationPage() {
  const [globalFilter, setGlobalFilter] = useState('');
  
  const table = useTable({
    data: mockData,
    columns: columns as any,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: createCoreRowModel(),
    getSortedRowModel: createSortedRowModel(),
    getFilteredRowModel: createFilteredRowModel(),
  } as any);

  const exportToCSV = () => {
    const csvData = mockData.map(t => ({
      'Receipt No': t.paystack_reference,
      'Date': new Date(t.created_at).toLocaleString(),
      'Church': t.church,
      'Category': t.category,
      'Amount (KES)': t.total_amount,
      'Status': t.status
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `NC_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reconciliation Ledger</h2>
          <p className="text-sm text-slate-500 mt-1">Detailed, filterable record of all incoming funds.</p>
        </div>
        
        <button onClick={exportToCSV} className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-border bg-slate-50/50 flex gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search reference, church, category..."
              className="w-full pl-9 pr-4 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-brand focus:border-brand outline-none text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md bg-white text-slate-700 text-sm font-medium hover:bg-slate-50">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-border">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}