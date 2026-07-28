import React, { useState } from 'react';
import { NewsCategory } from '../../types/news';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../services/newsService';
import { X, Plus, Edit2, Trash2, FolderPlus, ShieldCheck, Tag, Check, AlertCircle } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated?: () => void;
}

export default function CategoryManagerModal({ isOpen, onClose, onCategoriesUpdated }: CategoryManagerModalProps) {
  const [categories, setCategories] = useState<NewsCategory[]>(getCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0a1c3e');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRefresh = () => {
    const updated = getCategories();
    setCategories(updated);
    onCategoriesUpdated?.();
  };

  const handleStartAdd = () => {
    setEditingId('new');
    setName('');
    setDescription('');
    setColor('#0a1c3e');
    setError(null);
  };

  const handleStartEdit = (cat: NewsCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setColor(cat.color || '#0a1c3e');
    setError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Il nome della categoria è obbligatorio.');
      return;
    }

    if (editingId === 'new') {
      addCategory({
        name: name.trim(),
        description: description.trim(),
        color
      });
    } else if (editingId) {
      updateCategory(editingId, {
        name: name.trim(),
        description: description.trim(),
        color
      });
    }

    setEditingId(null);
    setName('');
    setDescription('');
    handleRefresh();
  };

  const handleDelete = (id: string, isSystem?: boolean) => {
    if (isSystem) {
      alert('Le categorie di sistema predefinite non possono essere eliminate.');
      return;
    }
    if (confirm('Sei sicuro di voler eliminare questa categoria?')) {
      deleteCategory(id);
      handleRefresh();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#c5a880]/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="bg-[#0a1c3e] text-white px-6 py-5 flex items-center justify-between border-b border-[#c5a880]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-brand-gold leading-tight">
                Gestione Categorie Articoli
              </h2>
              <p className="text-[10px] text-slate-300 font-tech tracking-wider uppercase">
                Organizzazione dei contenuti del Giornale di Stato
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form for new/editing category */}
          {editingId ? (
            <form onSubmit={handleSave} className="bg-[#0a1c3e]/5 border border-[#0a1c3e]/15 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-sm font-bold text-[#0a1c3e] uppercase tracking-wider">
                  {editingId === 'new' ? 'Nuova Categoria' : 'Modifica Categoria'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Annulla
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0a1c3e] mb-1">
                  Nome Categoria *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="es. Politica Sovrana, Economia, Diritti"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[#0a1c3e] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0a1c3e] mb-1">
                  Descrizione
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrizione degli argomenti trattati in questa categoria"
                  rows={2}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[#0a1c3e] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0a1c3e] mb-1">
                  Colore Identificativo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                  />
                  <span className="text-xs font-mono text-slate-600 uppercase">{color}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#0a1c3e] text-white hover:bg-brand-gold hover:text-[#0a1c3e] transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>Salva Categoria</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">
                {categories.length} Categorie disponibili
              </span>
              <button
                onClick={handleStartAdd}
                className="bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Aggiungi Categoria</span>
              </button>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shrink-0 border border-black/10 shadow-sm"
                    style={{ backgroundColor: cat.color || '#0a1c3e' }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-[#0a1c3e]">{cat.name}</h4>
                      {cat.isSystem && (
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-tech">
                          Sistema
                        </span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-[#0a1c3e] hover:bg-slate-200 transition cursor-pointer"
                    title="Modifica"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!cat.isSystem && (
                    <button
                      onClick={() => handleDelete(cat.id, cat.isSystem)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#0a1c3e] text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
