import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { Commission, Phase, Voice, VoiceFile } from '../types';

export function useCommissionDetail(commissionId: string) {
  const [commission, setCommission] = useState<Commission | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [voices, setVoices] = useState<Record<string, Voice[]>>({});
  const [voiceFiles, setVoiceFiles] = useState<Record<string, VoiceFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissionDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch commission
      const { data: commissionData, error: commissionError } = await supabase
        .from('commissions')
        .select('*')
        .eq('id', commissionId)
        .single()
        .returns<Commission>();

      if (commissionError) throw commissionError;

      // Fetch phases ordered by creation time
      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .select('*')
        .eq('commission_id', commissionId)
        .order('created_at')
        .returns<Phase[]>();

      if (phasesError) throw phasesError;

      // Fetch voices for all phases ordered by creation time
      const { data: voicesData, error: voicesError } = await supabase
        .from('voices')
        .select('*')
        .in('phase_id', (phasesData || []).map(p => p.id))
        .order('created_at')
        .returns<Voice[]>();

      if (voicesError) throw voicesError;

      // Group voices by phase_id
      const voicesByPhase: Record<string, Voice[]> = {};
      (voicesData || []).forEach(voice => {
        if (!voicesByPhase[voice.phase_id]) {
          voicesByPhase[voice.phase_id] = [];
        }
        voicesByPhase[voice.phase_id].push(voice);
      });

      // Fetch voice_files for these voices
      const voiceIds = (voicesData || []).map(v => v.id);
      const voiceFilesByVoice: Record<string, VoiceFile[]> = {};
      if (voiceIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: filesData, error: filesError } = await (supabase as unknown as { from: (table: string) => any }).from('voice_files')
          .select('*')
          .in('voice_id', voiceIds)
          .order('created_at');
        if (filesError) throw filesError;
        ((filesData as VoiceFile[]) || []).forEach((f: VoiceFile) => {
          if (!voiceFilesByVoice[f.voice_id]) voiceFilesByVoice[f.voice_id] = [];
          voiceFilesByVoice[f.voice_id].push(f);
        });
      }

      setCommission(commissionData);
      setPhases(phasesData || []);
      setVoices(voicesByPhase);
      setVoiceFiles(voiceFilesByVoice);

      // Update commission totals
      await updateCommissionTotals(commissionData, voicesByPhase);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [commissionId]);

  const updateCommissionTotals = async (commission: Commission, voicesByPhase: Record<string, Voice[]>) => {
    let totalIncome = 0;
    let totalOutcome = 0;

    Object.values(voicesByPhase).flat().forEach(voice => {
      if (voice.type === 'income') {
        totalIncome += Number(voice.amount);
      } else {
        totalOutcome += Number(voice.amount);
      }
    });

    // Only update if totals have changed
    if (commission.income !== totalIncome || commission.outcome !== totalOutcome) {
      await supabase
        .from('commissions')
        .update({
          income: totalIncome,
          outcome: totalOutcome
        } as Database['public']['Tables']['commissions']['Update'])
        .eq('id', commission.id);
    }
  };

  useEffect(() => {
    if (commissionId) {
      fetchCommissionDetail();
    }
  }, [commissionId, fetchCommissionDetail]);

  const createPhase = async (title: string) => {
    try {
      const { error } = await supabase
        .from('phases')
        .insert([
          {
            commission_id: commissionId,
            title
          } as Database['public']['Tables']['phases']['Insert']
        ]);

      if (error) throw error;
      await fetchCommissionDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create phase');
    }
  };

  const updatePhase = async (phaseId: string, updates: Partial<Phase>) => {
    try {
      const { error } = await supabase
        .from('phases')
        .update(updates as Database['public']['Tables']['phases']['Update'])
        .eq('id', phaseId);

      if (error) throw error;
      await fetchCommissionDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update phase');
    }
  };

  const deletePhase = async (phaseId: string) => {
    try {
      const { error } = await supabase
        .from('phases')
        .delete()
        .eq('id', phaseId);

      if (error) throw error;
      await fetchCommissionDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete phase');
    }
  };

  const createVoice = async (
    phaseId: string,
    voice: Omit<Voice, 'id' | 'phase_id' | 'created_at'>
  ): Promise<Voice | null> => {
    try {
      const { data, error } = await supabase
        .from('voices')
        .insert([
          {
            ...voice,
            phase_id: phaseId
          } as Database['public']['Tables']['voices']['Insert']
        ])
        .select('*')
        .single();

      if (error) throw error;
      await fetchCommissionDetail();
      return data as unknown as Voice;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create voice');
      return null;
    }
  };

  const updateVoice = async (
    voiceId: string,
    updates: Partial<Voice>
  ): Promise<Voice | null> => {
    try {
      const { data, error } = await supabase
        .from('voices')
        .update(updates as Database['public']['Tables']['voices']['Update'])
        .eq('id', voiceId)
        .select('*')
        .single();

      if (error) throw error;
      await fetchCommissionDetail();
      return data as unknown as Voice;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update voice');
      return null;
    }
  };

  const deleteVoice = async (voiceId: string) => {
    try {
      const { error } = await supabase
        .from('voices')
        .delete()
        .eq('id', voiceId);

      if (error) throw error;
      await fetchCommissionDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete voice');
    }
  };

  // Calculate totals from voices
  const totals = {
    income: 0,
    outcome: 0,
    net: 0
  };

  Object.values(voices).flat().forEach(voice => {
    if (voice.type === 'income') {
      totals.income += Number(voice.amount);
    } else {
      totals.outcome += Number(voice.amount);
    }
  });

  totals.net = totals.income - totals.outcome;

  return {
    commission,
    phases,
    voices,
    voiceFiles,
    totals,
    loading,
    error,
    createPhase,
    updatePhase,
    deletePhase,
    createVoice,
    updateVoice,
    deleteVoice,
    refetch: fetchCommissionDetail
  };
}