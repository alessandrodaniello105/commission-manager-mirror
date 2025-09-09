/*
  # Commission Management System Database Schema

  1. New Tables
    - `commissions`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `protocol_number` (text, optional reference)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `phases`
      - `id` (uuid, primary key)
      - `commission_id` (uuid, foreign key to commissions)
      - `title` (text, required)
      - `order_index` (integer, for ordering)
      - `created_at` (timestamp)
    
    - `voices`
      - `id` (uuid, primary key)
      - `phase_id` (uuid, foreign key to phases)
      - `description` (text, required)
      - `amount` (numeric, required)
      - `type` (text, either 'income' or 'outcome')
      - `order_index` (integer, for ordering)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since auth is skipped for now)

  3. Constraints
    - Amount validation (0 to 999999999)
    - Voice type validation (income/outcome only)
*/

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  protocol_number text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create phases table
CREATE TABLE IF NOT EXISTS phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create voices table
CREATE TABLE IF NOT EXISTS voices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0 AND amount <= 999999999),
  type text NOT NULL CHECK (type IN ('income', 'outcome')),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth for now)
CREATE POLICY "Public access to commissions"
  ON commissions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to phases"
  ON phases
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to voices"
  ON voices
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phases_commission_id ON phases(commission_id);
CREATE INDEX IF NOT EXISTS idx_phases_order ON phases(commission_id, order_index);
CREATE INDEX IF NOT EXISTS idx_voices_phase_id ON voices(phase_id);
CREATE INDEX IF NOT EXISTS idx_voices_order ON voices(phase_id, order_index);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for commissions
DROP TRIGGER IF EXISTS update_commissions_updated_at ON commissions;
CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();