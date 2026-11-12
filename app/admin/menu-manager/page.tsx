'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ChevronRight, Image as ImageIcon, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { toast } from 'sonner'
import { parseImages } from '@/lib/utils'

export default function MenuManager() {
  const [categories, setCategories] = useState<any[]>([])
  const [dishes, setDishes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'categories' | 'dishes'>('dishes')
  const [loading, setLoading] = useState(true)
  const [showAddDish, setShowAddDish] = useState(false)
  const [newDish, setNewDish] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    isVeg: true,
    images: ['', '', '']
  })
  const [newCategoryName, setNewCategoryName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingDish, setEditingDish] = useState<any>(null)

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDish.name || !newDish.categoryId || !newDish.price) {
      toast.error('Please fill required fields')
      return
    }
    setSaving(true)
    
    const url = editingDish ? `/api/admin/dishes/${editingDish.id}` : '/api/admin/dishes'
    const method = editingDish ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      body: JSON.stringify(newDish),
      headers: { 'Content-Type': 'application/json' }
    })
    setSaving(false)
    if (res.ok) {
      toast.success(editingDish ? 'Dish updated successfully' : 'Dish added successfully')
      setShowAddDish(false)
      setEditingDish(null)
      setNewDish({ name: '', description: '', categoryId: '', price: '', isVeg: true, images: ['', '', ''] })
      fetchData()
    } else {
      toast.error(editingDish ? 'Failed to update dish' : 'Failed to add dish')
    }
  }

  const startEditDish = (dish: any) => {
    setEditingDish(dish)
    setNewDish({
      name: dish.name,
      description: dish.description || '',
      categoryId: dish.categoryId || '',
      price: dish.sizes?.[0]?.price?.toString() || '0',
      isVeg: dish.isVeg ?? true,
      images: parseImages(dish.images).concat(['', '', '']).slice(0, 3)
    })
    setShowAddDish(true)
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName) return
    setSaving(true)
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name: newCategoryName }),
      headers: { 'Content-Type': 'application/json' }
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Category added')
      setNewCategoryName('')
      fetchData()
    } else {
      toast.error('Failed to add category')
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? This might affect dishes in this category.')) return
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    toast.success('Category deleted')
    fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [catRes, dishRes] = await Promise.all([
        fetch('/api/menu').then(r => r.json()),
        fetch('/api/admin/dishes').then(r => r.json())
    ])
    setCategories(catRes)
    setDishes(dishRes)
    setLoading(false)
  }

  const deleteDish = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dish?')) return
    await fetch(`/api/admin/dishes/${id}`, { method: 'DELETE' })
    toast.success('Dish deleted')
    fetchData()
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6 lg:p-10 font-poppins">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
              <Link href="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
              <ChevronRight className="w-3 h-3" />
              <span>Menu Manager</span>
            </div>
            <h1 className="text-4xl font-bold font-playfair text-primary">Menu Manager</h1>
            <p className="text-text-secondary">Configure your restaurant's offerings</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-border shadow-sm">
            <button 
                onClick={() => setActiveTab('dishes')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'dishes' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-border/20'}`}
            >
                Dishes
            </button>
            <button 
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-border/20'}`}
            >
                Categories
            </button>
        </div>
      </header>

      {activeTab === 'dishes' ? (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-playfair">Internal Menu ({dishes.length})</h2>
                <button 
                    onClick={() => setShowAddDish(true)}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2 hover:bg-primary-light transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add New Dish
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                    {dishes.map((dish) => (
                        <motion.div 
                            key={dish.id}
                            layout
                            className="bg-white p-5 rounded-[2rem] border border-border group hover:border-primary transition-all shadow-sm"
                        >
                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-accent/10 mb-4 border border-border">
                                {parseImages(dish.images)[0] ? (
                                    <img src={parseImages(dish.images)[0]} alt={dish.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-accent">
                                        <ImageIcon className="w-8 h-8" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <div className={`px-2 py-1 rounded-full text-[8px] font-bold ${dish.isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {dish.isAvailable ? 'AVAILABLE' : 'HIDDEN'}
                                    </div>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg mb-1">{dish.name}</h3>
                            <p className="text-[10px] text-text-secondary uppercase mb-3 px-2 py-0.5 bg-background inline-block rounded-md border border-border">
                                {dish.categoryName || 'No Category'}
                            </p>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
                                <span className="font-bold text-primary">₹{dish.sizes?.[0]?.price || 0}</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => startEditDish(dish)}
                                        className="p-2 bg-[#FFF8F0] text-text-secondary rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => deleteDish(dish.id)}
                                        className="p-2 bg-[#FFF8F0] text-text-secondary rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
      ) : (
          <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm">
                  <h2 className="text-2xl font-bold font-playfair mb-6">Add New Category</h2>
                  <form onSubmit={handleAddCategory} className="flex gap-4">
                      <input 
                        type="text" 
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="Category Name (e.g. Main Course)" 
                        className="flex-1 bg-background border border-border p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                      <button disabled={saving} className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-primary-light transition-all disabled:opacity-50">
                          {saving ? 'Adding...' : 'Add'}
                      </button>
                  </form>
              </div>

              <div className="space-y-4">
                  <h3 className="font-bold text-lg px-2">Existing Categories ({categories.length})</h3>
                  {categories.map(category => (
                      <div key={category.id} className="bg-white p-5 rounded-3xl border border-border flex justify-between items-center hover:border-primary/50 transition-all group">
                          <div>
                              <p className="font-bold">{category.name}</p>
                              <p className="text-xs text-text-secondary">{category.dishesCount || 0} items in this category</p>
                          </div>
                          <button 
                            onClick={() => deleteCategory(category.id)}
                            className="p-3 bg-red-50 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                          >
                              <Trash2 className="w-5 h-5" />
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      {/* Add Dish Modal */}
      {showAddDish && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm p-4 flex sm:items-center items-start justify-center overflow-y-auto">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-2xl rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl my-4 sm:my-8">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold font-playfair">{editingDish ? 'Edit Dish' : 'Add New Dish'}</h2>
                      <button onClick={() => {
                          setShowAddDish(false)
                          setEditingDish(null)
                          setNewDish({ name: '', description: '', categoryId: '', price: '', isVeg: true, images: ['', '', ''] })
                      }} className="p-2 bg-background rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X /></button>
                  </div>
                  
                  <form onSubmit={handleSaveDish} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Dish Name *</label>
                        <input required type="text" value={newDish.name} onChange={e => setNewDish({...newDish, name: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Masala Dosa" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Category *</label>
                        <select required value={newDish.categoryId} onChange={e => setNewDish({...newDish, categoryId: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Description</label>
                      <textarea value={newDish.description} onChange={e => setNewDish({...newDish, description: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]" placeholder="Brief description of the dish..." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Price (₹) *</label>
                        <input required type="number" min="0" value={newDish.price} onChange={e => setNewDish({...newDish, price: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="150" />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <input type="checkbox" id="isVeg" checked={newDish.isVeg} onChange={e => setNewDish({...newDish, isVeg: e.target.checked})} className="w-5 h-5 accent-green-600" />
                        <label htmlFor="isVeg" className="font-bold text-green-700 flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full border-2 border-green-700 block"></span> Vegetarian</label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border mt-4">
                      <label className="text-xs font-bold text-text-secondary uppercase mb-2 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Images (Up to 3)
                      </label>
                      <p className="text-xs text-text-secondary mb-3">Upload high-quality images from your device gallery.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[0, 1, 2].map((index) => (
                          <div key={index} className="flex flex-col gap-2 relative">
                             {newDish.images[index] ? (
                               <div className="relative h-24 w-full rounded-xl border border-border overflow-hidden bg-accent/10 shadow-inner group">
                                  <img src={newDish.images[index]} alt="Dish preview" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button type="button" onClick={() => {
                                          const newImages = [...newDish.images];
                                          newImages[index] = '';
                                          setNewDish({...newDish, images: newImages});
                                      }} className="bg-red-500 text-white rounded-full p-2 hover:scale-110 transition-transform shadow-md">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                               </div>
                             ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl hover:bg-primary/5 hover:border-primary/50 cursor-pointer transition-all">
                                  <span className="text-xs font-bold text-text-secondary flex flex-col items-center gap-1 opacity-70">
                                     <Plus className="w-5 h-5 text-primary" /> Image {index + 1}
                                  </span>
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    className="hidden" 
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      
                                      // Validate size (optional max 10MB test)
                                      if(file.size > 10 * 1024 * 1024) {
                                          toast.error('File too large. Max 10MB allowed.');
                                          return;
                                      }

                                      setSaving(true);
                                      toast.loading('Uploading image...', { id: `upload-${index}` });
                                      try {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
                                        const data = await res.json();
                                        if (data.url) {
                                          const newImages = [...newDish.images];
                                          newImages[index] = data.url;
                                          setNewDish({...newDish, images: newImages});
                                          toast.success('Image uploaded!', { id: `upload-${index}` });
                                        } else {
                                          toast.error(data.details || data.error || 'Upload failed', { id: `upload-${index}` });
                                        }
                                      } catch(err: any) {
                                        toast.error(err.message || 'Network error during upload', { id: `upload-${index}` });
                                      } finally {
                                        setSaving(false);
                                      }
                                    }}
                                  />
                                </label>
                             )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button disabled={saving} type="submit" className="w-full bg-primary hover:bg-primary-light text-white py-4 rounded-2xl font-bold shadow-lg transition-all mt-6 disabled:opacity-50">
                      {saving ? 'Saving...' : (editingDish ? 'Update Dish' : 'Save Dish')}
                    </button>
                  </form>
              </motion.div>
          </div>
      )}
    </div>
  )
}
