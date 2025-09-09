import React from 'react';
import { useState } from 'react';
import { Layout } from './components/Layout';
import { CommissionList } from './components/CommissionList';
import { CommissionDetail } from './components/CommissionDetail';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [selectedCommissionId, setSelectedCommissionId] = useState<string | null>(null);

  const handleSelectCommission = (id: string) => {
    setSelectedCommissionId(id);
  };

  const handleBackToList = () => {
    setSelectedCommissionId(null);
  };

  return (
    <Layout>
      {selectedCommissionId ? (
        <CommissionDetail
          commissionId={selectedCommissionId}
          onBack={handleBackToList}
        />
      ) : (
        <ErrorBoundary>
          <CommissionList onSelectCommission={handleSelectCommission} />
        </ErrorBoundary>
      )}
    </Layout>
  );
}

export default App;
