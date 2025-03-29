import React, { useState } from "react";
import { ethers } from "ethers";
import useWeb3Auth from "../hooks/useWeb3Auth";
import { useRouter } from 'next/navigation';

const RequestCreditScore = ({ contractAddress, onSuccess }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const { signer } = useWeb3Auth();
  const router = useRouter();

  const navigateToLoanApplication = () => {
    router.push('/loan');
  };

  const requestCreditScore = async () => {
    if (!signer) {
      setRequestError("Wallet not connected. Please connect your wallet first.");
      return;
    }

    setIsRequesting(true);
    setRequestError(null);
    setRequestSuccess(false);
    
    try {
      // You'll need your contract ABI - this is just a placeholder
      const contractABI = ["function requestCreditScore() public returns (bool)"];
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      // Call the contract function to request a credit score
      const tx = await contract.requestCreditScore();
      await tx.wait();
      
      setRequestSuccess(true);
      
      // Call the onSuccess callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (error) {
      console.error("Error requesting credit score:", error);
      
      // Check if the error is about not having a credit score
      const errorMessage = error.message || "Failed to request credit score";
      const isNoCreditScoreError = 
        errorMessage.includes("User does not have a credit score") || 
        (error.reason && error.reason.includes("User does not have a credit score"));
      
      if (isNoCreditScoreError) {
        setRequestError("You don't have a credit score yet. You need to take out and repay a loan first.");
      } else {
        setRequestError(errorMessage);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="mt-4">
      {!requestSuccess ? (
        <div>
          <button 
            onClick={requestCreditScore}
            disabled={isRequesting || !signer}
            className={`${isRequesting || !signer ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded mr-2`}
          >
            {isRequesting ? 'Processing...' : 'Check Credit Score'}
          </button>
          
          <button
            onClick={navigateToLoanApplication}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Apply for a Loan
          </button>
          
          {!signer && (
            <p className="mt-2 text-yellow-600">Please connect your wallet first</p>
          )}
          
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>How to establish a credit score:</strong> Take out a loan and repay it on time to build your credit history.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-2 bg-green-100 text-green-800 rounded">
          Credit score request successful! Your credit score will be calculated shortly.
        </div>
      )}
      
      {requestError && (
        <div className="mt-2 text-red-500">
          <p>{requestError}</p>
          {requestError.includes("don't have a credit score") && (
            <button
              onClick={navigateToLoanApplication}
              className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Apply for a Loan Now
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestCreditScore;