import React, { useState, useEffect } from 'react';
import useBlockchainData from '../hooks/useBlockchainData';

const CreditScoreCard = ({ address }) => {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getCreditScore, initializeCreditScore } = useBlockchainData();

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const creditScore = await getCreditScore(address);
        setScore(creditScore);
      } catch (error) {
        console.error("Error fetching credit score:", error);
        setError("No credit score found. You may need to initialize it.");
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchScore();
    }
  }, [address, getCreditScore]);

  const handleInitializeScore = async () => {
    try {
      setLoading(true);
      const newScore = await initializeCreditScore();
      setScore(newScore);
      setError(null);
    } catch (err) {
      setError("Failed to initialize credit score. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
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

  if (error && !score) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-4">
          <div className="text-red-500 text-xl font-semibold">{error}</div>
        </div>
        <button
          onClick={handleInitializeScore}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
        >
          Initialize Credit Score
        </button>
      </div>
    );
  }

  const scoreLevel = score ? getScoreLevel(score) : 'unknown';
  const scoreColor = getScoreColor(scoreLevel);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
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
    </div>
  );
};

export default CreditScoreCard;