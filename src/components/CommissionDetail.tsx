import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { useCommissionDetail } from '../hooks/useCommissionDetail';
import { formatCurrency, parseCurrency } from '../utils/currency';
import type { Phase, Voice } from '../types';

interface CommissionDetailProps {
  commissionId: string;
  onBack: () => void;
}

export function CommissionDetail({ commissionId, onBack }: CommissionDetailProps) {
  const {
    commission,
    phases,
    voices,
    totals,
    loading,
    error,
    createPhase,
    updatePhase,
    deletePhase,
    createVoice,
    updateVoice,
    deleteVoice
  } = useCommissionDetail(commissionId);

  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [phaseTitle, setPhaseTitle] = useState('');
  const [showVoiceForm, setShowVoiceForm] = useState<string | null>(null);
  const [editingVoice, setEditingVoice] = useState<Voice | null>(null);
  const [voiceForm, setVoiceForm] = useState({
    description: '',
    amount: '',
    type: 'income' as 'income' | 'outcome'
  });
  // File upload state for Voice
  const [voiceFiles, setVoiceFiles] = useState<{ name: string; url: string; id?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [draggedPhase, setDraggedPhase] = useState<Phase | null>(null);
  const [draggedVoice, setDraggedVoice] = useState<Voice | null>(null);

  const handlePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phaseTitle.trim()) return;

    try {
      if (editingPhase) {
        await updatePhase(editingPhase.id, { title: phaseTitle });
      } else {
        await createPhase(phaseTitle);
      }
      setPhaseTitle('');
      setShowPhaseForm(false);
      setEditingPhase(null);
    } catch (err) {
      console.error('Error saving phase:', err);
    }
  };

  const handleVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceForm.description.trim() || !voiceForm.amount) return;

    const amount = parseCurrency(voiceForm.amount);
    if (amount < 0 || amount > 999999999) return;

    try {
      if (editingVoice) {
        await updateVoice(editingVoice.id, {
          description: voiceForm.description,
          amount,
          type: voiceForm.type
        });
      } else if (showVoiceForm) {
        await createVoice(showVoiceForm, {
          description: voiceForm.description,
          amount,
          type: voiceForm.type
        });
      }
      setVoiceForm({ description: '', amount: '', type: 'income' });
      setShowVoiceForm(null);
      setEditingVoice(null);
    } catch (err) {
      console.error('Error saving voice:', err);
    }
  };

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase);
    setPhaseTitle(phase.title);
    setShowPhaseForm(true);
  };

  const handleEditVoice = (voice: Voice) => {
    setEditingVoice(voice);
    setVoiceForm({
      description: voice.description || '',
      amount: voice.amount.toString(),
      type: voice.type
    });
    setShowVoiceForm(voice.phase_id);
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa fase e tutte le sue voci?')) {
      await deletePhase(phaseId);
    }
  };

  const handleDeleteVoice = async (voiceId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa voce?')) {
      await deleteVoice(voiceId);
    }
  };

  // Drag and drop handlers for phases
  const handlePhaseDragStart = (e: React.DragEvent, phase: Phase) => {
    setDraggedPhase(phase);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePhaseDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handlePhaseDrop = async (e: React.DragEvent, targetPhase: Phase) => {
    e.preventDefault();
    if (!draggedPhase || draggedPhase.id === targetPhase.id) return;

    // Since we don't have order_index, we'll just update created_at to simulate reordering
    // This is a simple approach - for true reordering you'd need an order_index column
    console.log('Phase reordering would require order_index column in database');
    setDraggedPhase(null);
  };

  // Drag and drop handlers for voices
  const handleVoiceDragStart = (e: React.DragEvent, voice: Voice) => {
    setDraggedVoice(voice);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleVoiceDrop = async (e: React.DragEvent, targetVoice: Voice) => {
    e.preventDefault();
    if (!draggedVoice || draggedVoice.id === targetVoice.id || draggedVoice.phase_id !== targetVoice.phase_id) return;

    // Since we don't have order_index, we'll just update created_at to simulate reordering
    console.log('Voice reordering would require order_index column in database');
    setDraggedVoice(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !commission) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla lista
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            {error || 'Commissione non trovata'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla lista
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {commission.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Protocollo: {commission.protocol_number_reference}
        </p>
        
        <div className="grid grid-cols-3 gap-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Entrate Totali</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totals.income)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Uscite Totali</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totals.outcome)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Netto</p>
            <p className={`text-xl font-bold ${totals.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(totals.net)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fasi</h2>
          <button
            onClick={() => setShowPhaseForm(true)}
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Fase
          </button>
        </div>

        {showPhaseForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <form onSubmit={handlePhaseSubmit} className="flex space-x-3">
              <input
                type="text"
                value={phaseTitle}
                onChange={(e) => setPhaseTitle(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Titolo della fase"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                {editingPhase ? 'Aggiorna' : 'Aggiungi'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPhaseForm(false);
                  setEditingPhase(null);
                  setPhaseTitle('');
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                Annulla
              </button>
            </form>
          </div>
        )}

        {phases.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              Nessuna fase creata. Aggiungi una fase per iniziare.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase) => (
              <div
                key={phase.id}
                draggable
                onDragStart={(e) => handlePhaseDragStart(e, phase)}
                onDragOver={handlePhaseDragOver}
                onDrop={(e) => handlePhaseDrop(e, phase)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-move hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {phase.title}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditPhase(phase)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Modifica fase"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePhase(phase.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Elimina fase"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Voci</h4>
                    <button
                      onClick={() => setShowVoiceForm(phase.id)}
                      className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Aggiungi Voce
                    </button>
                  </div>

                  {showVoiceForm === phase.id && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <form onSubmit={handleVoiceSubmit} className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={voiceForm.description}
                            onChange={(e) => setVoiceForm({ ...voiceForm, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            placeholder="Descrizione"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="999999999"
                            value={voiceForm.amount}
                            onChange={(e) => setVoiceForm({ ...voiceForm, amount: e.target.value })}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            placeholder="Importo €"
                            required
                          />
                          <select
                            value={voiceForm.type}
                            onChange={(e) => setVoiceForm({ ...voiceForm, type: e.target.value as 'income' | 'outcome' })}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="income">Entrata</option>
                            <option value="outcome">Uscita</option>
                          </select>
                        </div>
                        {/* File upload for PDFs */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allega PDF</label>
                          <input
                            type="file"
                            accept="application/pdf"
                            multiple
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files) return;
                              setUploading(true);
                              // Simulate upload, replace with real upload logic
                              const uploaded: { name: string; url: string }[] = [];
                              for (let i = 0; i < files.length; i++) {
                                const file = files[i];
                                if (file.type !== 'application/pdf') continue;
                                // TODO: Replace with real upload, e.g. Supabase Storage
                                // For now, just use a fake URL
                                uploaded.push({ name: file.name, url: URL.createObjectURL(file) });
                              }
                              setVoiceFiles((prev) => [...prev, ...uploaded]);
                              setUploading(false);
                              // Reset input value so same file can be re-uploaded if removed
                              e.target.value = '';
                            }}
                            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 focus:outline-none"
                          />
                          {uploading && (
                            <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center">
                              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                              Caricamento...
                            </div>
                          )}
                          {/* Uploaded files badges */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {voiceFiles.map((file, idx) => (
                              <span key={file.url + idx} className="inline-flex items-center px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded text-xs">
                                {file.name}
                                <button
                                  type="button"
                                  className="ml-2 text-xs text-red-500 hover:text-red-700 focus:outline-none"
                                  onClick={() => setVoiceFiles((prev) => prev.filter((_, i) => i !== idx))}
                                  title="Rimuovi file"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
                          >
                            {editingVoice ? 'Aggiorna' : 'Aggiungi'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowVoiceForm(null);
                              setEditingVoice(null);
                              setVoiceForm({ description: '', amount: '', type: 'income' });
                              setVoiceFiles([]);
                            }}
                            className="px-3 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm"
                          >
                            Annulla
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-2">
                    {(voices[phase.id] || []).map((voice) => (
                      <div
                        key={voice.id}
                        draggable
                        onDragStart={(e) => handleVoiceDragStart(e, voice)}
                        onDragOver={handlePhaseDragOver}
                        onDrop={(e) => handleVoiceDrop(e, voice)}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {voice.description || 'Nessuna descrizione'}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className={`text-sm font-semibold ${voice.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(voice.amount)}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${voice.type === 'income' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                                {voice.type === 'income' ? 'Entrata' : 'Uscita'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditVoice(voice)}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Modifica voce"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteVoice(voice.id)}
                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Elimina voce"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}