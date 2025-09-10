export interface Commission {
  id: string;
  title: string;
  protocol_number_reference: string;
  income: number;
  outcome: number;
  created_at: string;
  user_id: string | null;
}

export interface Phase {
  id: string;
  commission_id: string;
  title: string;
  created_at: string;
}

export interface Voice {
  id: string;
  phase_id: string;
  type: 'income' | 'outcome';
  amount: number;
  description: string | null;
  created_at: string;
}

export interface VoiceFile {
  id: string;
  voice_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

export interface CommissionWithTotals extends Commission {
  totalIncome: number;
  totalOutcome: number;
  netTotal: number;
}