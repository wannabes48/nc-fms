'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Edit2, Trash2, X, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FundsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    // Strict RBAC: Kick out local clerks
    if (session?.user?.role && session.user.role !== 'CONFERENCE_ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchCategories();
  }, [session, router]);

  const fetchCategories = async () => {
    if (!session?.user?.apiToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/`, {
        headers: { 'Authorization': `Token ${session.user.apiToken}` }
      });
      const data = await res.json();
      setCategories(data.results || data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category: any = null) => {
    if (category) {
      setEditingId(category.id);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${editingId}/` 
      : `${process.env.NEXT_PUBLIC_API_URL}/api/categories/`;
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${session?.user?.apiToken}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchCategories();
    }
  };

  if (loading) return <div className="p-8 text-[#6B6A62]">Loading funds...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#232420]">Fund Categories</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#0F6E56] text-white px-4 py-2 rounded-[8px] font-medium hover:bg-[#085041] transition-colors"
        >
          <Plus className="w-4 h-4" /> New Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-6 rounded-[12px] border border-[#E4E1D8] shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-[#0F6E56]">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(cat)} className="p-1.5 text-[#6B6A62] hover:text-[#185FA5] hover:bg-blue-50 rounded-md transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-[#232420]">{cat.name}</h3>
            <p className="text-sm text-[#6B6A62] mt-1 flex-1">{cat.description || 'No description provided.'}</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[12px] shadow-xl border border-[#E4E1D8]">
            <div className="flex justify-between items-center p-6 border-b border-[#E4E1D8]">
              <h3 className="text-lg font-bold text-[#232420]">
                {editingId ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6B6A62] hover:text-[#232420]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#232420] mb-1">Fund Name</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-[#E4E1D8] rounded-[8px] focus:border-[#0F6E56] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#232420] mb-1">Description</label>
                <textarea 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-[#E4E1D8] rounded-[8px] focus:border-[#0F6E56] outline-none h-24 resize-none"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-[#E4E1D8] rounded-[8px] font-medium text-[#232420] hover:bg-[#FAF9F6]">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-[#0F6E56] text-white rounded-[8px] font-medium hover:bg-[#085041]">
                  {editingId ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}