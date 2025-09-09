import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Commission, CommissionWithTotals } from '../types';

export function useCommissions() {
  const [commissions, setCommissions] = useState<CommissionWithTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch commissions with their phases and voices
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select(`
          *,
          phases (
            id,
            voices (
              amount,
              type
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;

      // Calculate totals for each commission
      const commissionsWithTotals: CommissionWithTotals[] = (commissionsData || []).map(commission => {
        let totalIncome = 0;
        let totalOutcome = 0;

        commission.phases?.forEach(phase => {
          phase.voices?.forEach(voice => {
            if (voice.type === 'income') {
              totalIncome += Number(voice.amount);
            } else {
              totalOutcome += Number(voice.amount);
            }
          });
        });

        return {
          ...commission,
          totalIncome,
          totalOutcome,
          netTotal: totalIncome - totalOutcome
        };
      });

      setCommissions(commissionsWithTotals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const createCommission = async (commission: Omit<Commission, 'id' | 'created_at' | 'user_id' | 'income' | 'outcome'>) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .insert([{
          ...commission,
          income: 0,
          outcome: 0,
          user_id: null
        }]);

      if (error) throw error;
      await fetchCommissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create commission');
    }
  };

  const updateCommission = async (id: string, updates: Partial<Pick<Commission, 'title' | 'protocol_number_reference'>>) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchCommissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update commission');
    }
  };

  const deleteCommission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCommissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete commission');
    }
  };

  const updateCommissionTotals = async (commissionId: string, totalIncome: number, totalOutcome: number) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .update({
          income: totalIncome,
          outcome: totalOutcome
        })
        .eq('id', commissionId);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update commission totals');
    }
  };

  return {
    commissions,
    loading,
    error,
    createCommission,
    updateCommission,
    deleteCommission,
    updateCommissionTotals,
    refetch: fetchCommissions
  };
}