import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, X } from 'lucide-react';
import type { Commissioner } from '../types';

interface CommissionerPanelProps {
  commissioners: Commissioner[];
  addCommissioner: (name: string, commission_percent: number) => Promise<boolean>;
  updateCommissioner: (id: string, updates: Partial<Commissioner>) => Promise<boolean>;
  deleteCommissioner: (id: string) => Promise<boolean>;
}

export function CommissionerPanel({ commissioners, addCommissioner, updateCommissioner, deleteCommissioner }: CommissionerPanelProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingCommissioner, setEditingCommissioner] = useState<Commissioner | null>(null);
  const [name, setName] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('10');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    if (editingCommissioner) {
      await updateCommissioner(editingCommissioner.id, {
        name: name.trim(),
        commission_percent: parseFloat(commissionPercent) || 10,
      });
    } else {
      await addCommissioner(name.trim(), parseFloat(commissionPercent) || 10);
    }
    setSaving(false);
    closeModal();
  };

  const handleEdit = (commissioner: Commissioner) => {
    setEditingCommissioner(commissioner);
    setName(commissioner.name);
    setCommissionPercent(commissioner.commission_percent.toString());
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este comisionista?')) return;
    await deleteCommissioner(id);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCommissioner(null);
    setName('');
    setCommissionPercent('10');
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Comisionistas</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {commissioners.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay comisionistas registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {commissioners.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3"
            >
              <div>
                <p className="text-white font-medium">{c.name}</p>
                <p className="text-sm text-slate-400">{c.commission_percent}% de comisión</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingCommissioner ? 'Editar Comisionista' : 'Nuevo Comisionista'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                  placeholder="Nombre del comisionista"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">% Comisión sobre precio de venta</label>
                <input
                  type="number"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
                  step="0.1"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !name.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white py-2 rounded-lg transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
