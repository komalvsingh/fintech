import React, { useState, useEffect } from 'react';
import useBlockchainData from '../hooks/useBlockchainData';

const CreditScoreCard = ({ address, loanId }) => {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState(null);
  const { getCreditScore, loanContract, signer, hasScore } = useBlockchainData();

  // Show notification message
  const showNotification = (message) => {
    setNotification(message);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Setup event listeners for real-time updates
  useEffect(() => {
    if (!loanContract || !address) return;

    // Setup event listener for credit score updates
    const setupListeners = async () => {
      // Remove existing listeners to prevent duplicates
      loanContract.removeAllListeners("LoanRepaid");
      loanContract.removeAllListeners("CreditScoreUpdated");
      
      // Listen for loan repayments
      loanContract.on("LoanRepaid", async (repaidLoanId) => {
        console.log("Loan repaid event detected:", repaidLoanId);
        
        try {
          // Get the loan details to check if it belongs to this user
          const loan = await loanContract.loans(repaidLoanId);
          
          if (loan.borrower.toLowerCase() === address.toLowerCase()) {
            showNotification("Loan repaid! Updating credit score...");
            // Small delay to allow blockchain to update
            setTimeout(async () => {
              const newScore = await getCreditScore(address);
              setScore(newScore);
              showNotification("Credit score updated!");
            }, 2000);
          }
        } catch (err) {
          console.error("Error processing loan repaid event:", err);
        }
      });
      
      // Listen for credit score updates (if you added this event to your contract)
      loanContract.on("CreditScoreUpdated", (user, newScore) => {
        if (user.toLowerCase() === address.toLowerCase()) {
          console.log("Credit score updated event detected:", Number(newScore));
          setScore(Number(newScore));
          showNotification("Your credit score has been updated!");
        }
      });
      
      console.log("Event listeners set up for address:", address);
    };
    
    setupListeners();
    
    // Cleanup function to remove listeners when component unmounts
    return () => {
      if (loanContract) {
        loanContract.removeAllListeners("LoanRepaid");
        loanContract.removeAllListeners("CreditScoreUpdated");
      }
    };
  }, [loanContract, address]);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        setLoading(true);
        // Get credit score - if user doesn't have one, we'll handle that in the UI
        const creditScore = await getCreditScore(address);
        setScore(creditScore);
        
        if (creditScore === null) {
          setError("No credit score found. Complete a loan repayment to establish credit.");
        }
      } catch (error) {
        console.error("Error fetching credit score:", error);
        setError("Failed to retrieve credit score. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (address && signer) {
      fetchScore();
    }
  }, [address, getCreditScore, signer]);

  const handleUpdateScore = async (positive) => {
    try {
      setUpdating(true);
      
      // If loanId is provided, check if the loan is repaid before updating
      if (loanId && loanContract) {
        const loan = await loanContract.loans(loanId);
        
        // Only update credit score if loan is repaid (for positive updates)
        // or if loan is not repaid (for negative updates)
        if ((positive && !loan.isPaid) || (!positive && loan.isPaid)) {
          setError(positive 
            ? "Cannot increase score: loan not repaid yet" 
            : "Cannot decrease score: loan already repaid");
          setUpdating(false);
          return;
        }
      }
      
      // Since we can't directly call the internal updateCreditScore function,
      // This is a demonstration of how the UI would update. In a real app,
      // credit score updates would happen through contract interactions like loan repayments
      showNotification("Simulating credit score update...");
      
      if (score === null) {
        // If no score exists, set a default starting score
        setScore(positive ? 520 : 480);
      } else {
        // Update existing score
        let newScore = score;
        if (positive) {
          newScore = Math.min(850, score + 20);
        } else {
          newScore = Math.max(300, score - 20);
        }
        setScore(newScore);
      }
      
      setError(null);
    } catch (err) {
      setError("Failed to update credit score. Please try again.");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Determine score level for styling
  const getScoreLevel = (score) => {
    if (score >= 750) return 'excellent';
    if (score >= 650) return 'good';
    if (score >= 550) return 'fair';
    return 'poor';
  };

  const getScoreColor = (level) => {
    switch(level) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="h-24 bg-gray-200 rounded-full w-24 mx-auto"></div>
        <div className="h-8 bg-gray-200 rounded mt-4"></div>
        <div className="h-4 bg-gray-200 rounded mt-4 w-3/4 mx-auto"></div>
      </div>
    );
  }

  const scoreLevel = score ? getScoreLevel(score) : 'unknown';
  const scoreColor = getScoreColor(scoreLevel);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Notification alert */}
      {notification && (
        <div className="mb-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative">
          {notification}
        </div>
      )}
      
      <div className="text-center mb-4">
        <div className={`${scoreColor} text-white text-4xl font-bold rounded-full w-24 h-24 flex items-center justify-center mx-auto`}>
          {score}
        </div>
        <h2 className="text-2xl font-semibold mt-4 capitalize">{scoreLevel} Credit</h2>
        <p className="text-gray-600 mt-2">
          {scoreLevel === 'excellent' && 'You have exceptional credit. Most lenders will offer you their best rates.'}
          {scoreLevel === 'good' && 'You have good credit. Most lenders will approve your applications.'}
          {scoreLevel === 'fair' && 'You have fair credit. You may qualify for most loans but not at the best rates.'}
          {scoreLevel === 'poor' && 'You have poor credit. You may have difficulty getting approved for loans.'}
        </p>
      </div>
      
      {/* Credit score update buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => handleUpdateScore(true)}
          disabled={updating}
          className="flex-1 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-200 disabled:opacity-50"
        >
          {updating ? 'Updating...' : 'Increase Score (+20)'}
        </button>
        <button
          onClick={() => handleUpdateScore(false)}
          disabled={updating}
          className="flex-1 py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-200 disabled:opacity-50"
        >
          {updating ? 'Updating...' : 'Decrease Score (-20)'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 text-red-500 text-center">{error}</div>
      )}
    </div>
  );
};

export default CreditScoreCard;