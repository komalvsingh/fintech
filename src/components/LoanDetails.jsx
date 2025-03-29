import React, { useState, useEffect } from 'react';
import { fetchLoanApplication } from '../utils/ipfs';

const LoanDetails = ({ ipfsUrl }) => {
  const [loanData, setLoanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getLoanData = async () => {
      if (!ipfsUrl) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchLoanApplication(ipfsUrl);
        setLoanData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch loan data:', err);
        setError('Failed to load loan details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getLoanData();
  }, [ipfsUrl]);

  if (loading) {
    return <div className="p-4 text-center">Loading loan details...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!loanData) {
    return <div className="p-4 text-center">No loan data available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Loan Application Details</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600 text-sm">Amount</p>
          <p className="font-medium">{loanData.amount} ETH</p>
        </div>
        
        <div>
          <p className="text-gray-600 text-sm">Duration</p>
          <p className="font-medium">{loanData.duration} days</p>
        </div>
        
        {loanData.purpose && (
          <div className="col-span-2">
            <p className="text-gray-600 text-sm">Purpose</p>
            <p className="font-medium">{loanData.purpose}</p>
          </div>
        )}
        
        {loanData.collateral && (
          <div className="col-span-2">
            <p className="text-gray-600 text-sm">Collateral</p>
            <p className="font-medium">{loanData.collateral}</p>
          </div>
        )}
        
        <div className="col-span-2">
          <p className="text-gray-600 text-sm">Timestamp</p>
          <p className="font-medium">{new Date(loanData.timestamp).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default LoanDetails;