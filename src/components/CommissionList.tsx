import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Calendar, FileText } from 'lucide-react';
import { useCommissions } from '../hooks/useCommissions';
import { formatCurrency } from '../utils/currency';
import type { Commission } from '../types';

interface CommissionListProps {
  onSelectCommission: (id: string) => void;
}

export function CommissionList({ onSelectCommission }: CommissionListProps) {
  const { commissions, loading, error, createCommission, updateCommission, deleteCommission } = useCommissions();
  const [showForm, setShowForm] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    protocol_number_reference: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.protocol_number_reference.trim()) return;

    try {
      if (editingCommission) {
        await updateCommission(editingCommission.id, formData);
      } else {
        await createCommission(formData);
      }
      setFormData({ title: '', protocol_number_reference: '' });
      setShowForm(false);
      setEditingCommission(null);
    } catch (err) {
      console.error('Error saving commission:', err);
    }
  };

  const handleEdit = (commission: Commission) => {
    setEditingCommission(commission);
    setFormData({
      title: commission.title,
      protocol_number_reference: commission.protocol_number_reference
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa commissione?')) {
      await deleteCommission(id);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', protocol_number_reference: '' });
    setShowForm(false);
    setEditingCommission(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Errore: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Le Mie Commissioni
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuova Commissione
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingCommission ? 'Modifica Commissione' : 'Nuova Commissione'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titolo *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Inserisci il titolo della commissione"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Numero Protocollo *
              </label>
              <input
                type="text"
                value={formData.protocol_number_reference}
                onChange={(e) => setFormData({ ...formData, protocol_number_reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Numero di protocollo (richiesto)"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                {editingCommission ? 'Aggiorna' : 'Crea'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {commissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nessuna commissione trovata. Creane una per iniziare.
            </p>
          </div>
        ) : (
          commissions.map((commission) => (
            <div
              key={commission.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {commission.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Protocollo: {commission.protocol_number_reference}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(commission.created_at).toLocaleDateString('it-IT')}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Entrate:</span>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(commission.totalIncome)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Uscite:</span>
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(commission.totalOutcome)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Netto:</span>
                      <p className={`font-semibold ${commission.netTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(commission.netTotal)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 h- ml-4">
                  <button
                    onClick={() => onSelectCommission(commission.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Visualizza dettagli"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(commission)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Modifica"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(commission.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}