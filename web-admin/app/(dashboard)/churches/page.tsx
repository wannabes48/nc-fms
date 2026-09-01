import React from 'react';

export default function ChurchesPage() {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Churches</h2>
          <p className="text-sm text-slate-500 mt-1">Manage local congregations.</p>
        </div>
      </div>
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm text-slate-500">
        <p>Churches list will be displayed here.</p>
      </div>
    </div>
  );
}
