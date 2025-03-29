import React, { useState } from 'react';
import { ethers } from 'ethers';
import useBlockchainData from '../hooks/useBlockchainData';
import { storeLoanApplication } from '../utils/ipfs';

const LoanForm = ({ onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(30); // 30 days default
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { requestLoan, account } = useBlockchainData();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid loan amount');
      }

      if (!duration || duration < 1) {
        throw new Error('Please enter a valid loan duration');
      }

      // Convert amount to Wei
      const amountInWei = ethers.utils.parseEther(amount);
      
      // Convert duration to seconds (frontend uses days for user-friendliness)
      const durationInSeconds = duration * 24 * 60 * 60;

      // Store additional loan metadata on IPFS
      const ipfsHash = await storeLoanApplication({
        borrower: account,
        amount,
        duration,
        purpose,
        requestDate: new Date().toISOString()
      });

      console.log(`Loan application metadata stored on IPFS: ${ipfsHash}`);

      // Submit the loan request to the blockchain
      await requestLoan(amountInWei, durationInSeconds);

      // Clear form
      setAmount('');
      setDuration(30);
      setPurpose('');

      // Notify parent component of success
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error requesting loan:", err);
      setError(err.message || "Failed to request loan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Request a Loan</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Loan Amount (ETH)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
            Loan Duration (Days)
          </label>
          <input
            id="duration"
            type="number"
            min="1"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            required
            disabled={loading}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="purpose">
            Loan Purpose
          </label>
          <textarea
            id="purpose"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows="3"
            disabled={loading}
          ></textarea>
        </div>
        
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Submit Loan Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;