"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LoanContractABI from "../../lib/LoanContract.json";

const CreditPage = () => {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [creditScore, setCreditScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasScore, setHasScore] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const contractAddress = "0x860B55A2018d591378ceF13A4624fcc67373A3a1"; // Replace with your deployed contract address

  // Connect to MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const newSigner = await provider.getSigner();
        const address = await newSigner.getAddress();
        
        setAccount(address);
        setSigner(newSigner);
        setIsConnected(true);
        return true;
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError(error.message || "Failed to connect wallet");
        return false;
      }
    } else {
      setError("MetaMask is not installed. Please install it to use this app.");
      return false;
    }
  };

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      }
    };
    
    checkConnection();
    
    // Setup event listeners for account changes
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          setAccount(null);
          setSigner(null);
          setIsConnected(false);
        }
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  useEffect(() => {
    if (isConnected && signer) {
      checkCreditScore();
    }
  }, [isConnected, signer]);

  const checkCreditScore = async () => {
    if (!signer) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      // First check if user has a credit score
      const hasCredit = await contract.hasCreditScore(account);
      setHasScore(hasCredit);
      
      if (hasCredit) {
        const score = await contract.getCreditScore();
        setCreditScore(Number(score));
      }
    } catch (err) {
      console.error("Error checking credit score:", err);
      setError(err.message || "Failed to check credit score");
    } finally {
      setLoading(false);
    }
  };

  const initializeCreditScore = async () => {
    if (!signer) return;
    
    setInitializing(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      const tx = await contract.initializeCreditScore();
      await tx.wait();
      
      // After initialization, check the score
      await checkCreditScore();
    } catch (err) {
      console.error("Error initializing credit score:", err);
      setError(err.message || "Failed to initialize credit score");
    } finally {
      setInitializing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">Credit Score</h2>
        <p className="text-gray-600 mb-4">Please connect your wallet to view your credit score.</p>
        <button
          onClick={connectWallet}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Credit Score</h2>
      
      {loading && <p className="text-gray-600">Loading your credit score...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <>
          {hasScore ? (
            <div className="mt-4">
              <div className="text-center p-6 bg-gray-100 rounded-lg">
                <p className="text-gray-600 mb-2">Your Credit Score</p>
                <p className="text-5xl font-bold text-indigo-600">{creditScore}</p>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">What affects your score?</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Timely loan repayments increase your score</li>
                  <li>Defaulting on loans decreases your score</li>
                  <li>Higher scores give you access to larger loans</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="mb-4">You don't have a credit score yet. Initialize your credit profile to apply for loans.</p>
              <button
                onClick={initializeCreditScore}
                disabled={initializing}
                className={`${
                  initializing ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white px-4 py-2 rounded-md text-sm font-medium w-full`}
              >
                {initializing ? 'Initializing...' : 'Initialize Credit Score'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CreditPage;