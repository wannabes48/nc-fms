'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function FundManagementPage() {
  const auth = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fetchCategories = () => {
    fetch('http://localhost:8000/api/categories/', {
      headers: { 'Authorization': `Token ${auth?.token}` }
    })
    .then(res => res.json())
    .then(data => setCategories(data));
  };

  useEffect(() => { fetchCategories(); }, [auth?.token]);

  const toggleActiveStatus = async (id: number, currentStatus: boolean) => {
    await fetch(`http://localhost:8000/api/categories/${id}/`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Token ${auth?.token}` 
      },
      body: JSON.stringify({ is_active: !currentStatus })
    });
    fetchCategories(); // Refresh list
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:8000/api/categories/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Token ${auth?.token}` 
      },
      body: JSON.stringify({ name: newCategoryName, is_active: true })
    });
    setNewCategoryName('');
    fetchCategories();
  };

  // Only Conference Admins should see this page
  if (auth?.role !== 'CONFERENCE_ADMIN') return <p>Access Denied.</p>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Manage Offering Categories</h1>
      
      <form onSubmit={handleAddCategory} className="flex gap-4 mb-8">
        <input 
          type="text" 
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="e.g. District Development Fund"
          className="border p-2 rounded w-full"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-6 rounded hover:bg-blue-700">
          Add
        </button>
      </form>

      <div className="bg-white rounded shadow divide-y">
        {categories.map((cat: any) => (
          <div key={cat.id} className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">{cat.name}</h3>
              <p className="text-sm text-gray-500">
                Status: {cat.is_active ? 'Active' : 'Closed'}
              </p>
            </div>
            <button 
              onClick={() => toggleActiveStatus(cat.id, cat.is_active)}
              className={`px-4 py-2 rounded text-sm font-bold ${
                cat.is_active ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {cat.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}