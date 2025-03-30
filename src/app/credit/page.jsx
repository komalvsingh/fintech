"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LoanContractABI from "../../lib/LoanContract.json";

const CreditPage = () => {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [creditScore, setCreditScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasScore, setHasScore] = useState(false);
  const [notification, setNotification] = useState(null);

  const contractAddress = "0x860B55A2018d591378ceF13A4624fcc67373A3a1";

  // Connect to MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const newSigner = await provider.getSigner();
        const address = await newSigner.getAddress();
        
        // Create contract instance
        const loanContract = new ethers.Contract(
          contractAddress,
          LoanContractABI.abi,
          newSigner
        );
        
        setAccount(address);
        setSigner(newSigner);
        setContract(loanContract);
        setIsConnected(true);
        
        // Set up event listeners for real-time updates
        setupEventListeners(loanContract, address);
        
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

  // Set up blockchain event listeners
  const setupEventListeners = (contract, userAddress) => {
    if (!contract) return;
    
    // Add event listener for LoanRepaid events
    contract.removeAllListeners("LoanRepaid");
    contract.on("LoanRepaid", (loanId) => {
      console.log("Loan repaid event detected for loan ID:", loanId);
      // After a loan is repaid, check for updated credit score
      checkCreditScore();
      showNotification("Loan repaid successfully! Your credit score has been updated.");
    });
    
    // Let's add a custom event listener for CreditScoreUpdated
    // Note: You'll need to add this event to your smart contract
    contract.removeAllListeners("CreditScoreUpdated");
    contract.on("CreditScoreUpdated", (user, newScore) => {
      if (user.toLowerCase() === userAddress.toLowerCase()) {
        console.log("Credit score updated event detected:", newScore);
        setCreditScore(Number(newScore));
        showNotification("Your credit score has been updated!");
      }
    });
    
    console.log("Event listeners set up for address:", userAddress);
  };

  // Show notification
  const showNotification = (message) => {
    setNotification(message);
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
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
          setContract(null);
          setIsConnected(false);
        }
      });
    }
    
    return () => {
      // Clean up event listeners
      if (contract) {
        contract.removeAllListeners();
      }
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);
  
  const repayLoan = async (loanId, amount) => {
    if (!signer || !contract) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert amount to ethers if it's a string
      let value;
      if (typeof amount === 'string') {
        value = ethers.parseEther(amount);
      } else {
        value = amount; // Assume it's already in the correct format
      }
      
      // Repay the loan
      const tx = await contract.repayLoan(loanId, {
        value: value
      });
      
      console.log("Loan repayment transaction:", tx.hash);
      showNotification("Loan repayment submitted. Waiting for confirmation...");
      
      // Wait for transaction to be mined
      await tx.wait();
      console.log("Loan repayment confirmed");
      
      // The contract event listener will update credit score automatically
      // But let's check in case the event listener missed it
      setTimeout(() => {
        checkCreditScore();
      }, 2000);
      
    } catch (err) {
      console.error("Error repaying loan:", err);
      setError(err.message || "Failed to repay loan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && signer && contract) {
      checkCreditScore();
    }
  }, [isConnected, signer, contract]);

  // Update the checkCreditScore function to properly interact with the contract
  const checkCreditScore = async () => {
    if (!signer || !contract) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First check if user has a credit score
      const hasCredit = await contract.hasCreditScore(account);
      console.log("Has credit score:", hasCredit);
      setHasScore(hasCredit);
      
      if (hasCredit) {
        // Get the credit score
        const score = await contract.getCreditScore();
        console.log("Credit score:", Number(score));
        setCreditScore(Number(score));
      }
    } catch (err) {
      console.error("Error checking credit score:", err);
      setError(err.message || "Failed to check credit score");
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getScoreColor = () => {
    if (!creditScore) return "text-gray-300";
    if (creditScore < 300) return "text-red-400";
    if (creditScore < 600) return "text-yellow-400";
    if (creditScore < 750) return "text-cyan-400";
    return "text-emerald-400";
  };

  if (!isConnected) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-gray-900 rounded-xl shadow-lg border border-gray-800 mt-20">
        <h2 className="text-3xl font-bold mb-6 text-white">DeFi Credit Score</h2>
        <div className="mb-8 bg-gray-800 p-6 rounded-lg">
          <p className="text-gray-300 mb-4">Connect your wallet to view your on-chain credit profile.</p>
          <button
            onClick={connectWallet}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-md text-sm font-medium w-full transition-colors duration-200 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8h8V6z" clipRule="evenodd" />
            </svg>
            Connect Wallet
          </button>
        </div>
        <div className="text-gray-400 text-sm">
          <p>Your credit data is stored securely on the blockchain and belongs only to you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-lg mx-auto bg-gray-900 rounded-xl shadow-lg border border-gray-800 mt-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">DeFi Credit Profile</h2>
        <div className="bg-gray-800 px-3 py-1 rounded-full text-gray-300 text-sm flex items-center">
          <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
          {formatAddress(account)}
        </div>
      </div>
      
      {/* Real-time notification */}
      {notification && (
        <div className="bg-cyan-900/30 border border-cyan-700 text-cyan-400 px-4 py-3 rounded-lg mb-6 animate-pulse">
          <p>{notification}</p>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
          <p>Error: {error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <>
          {hasScore ? (
            <div className="mt-4">
              <div className="text-center p-8 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-gray-400 mb-2">Your Credit Score</p>
                <p className={`text-6xl font-bold ${getScoreColor()}`}>{creditScore}</p>
                
                <div className="mt-4 w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (creditScore / 850) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
              </div>
              
              <div className="mt-8 bg-gray-800/30 p-6 rounded-lg border border-gray-800">
                <h3 className="text-lg font-semibold mb-4 text-cyan-400">Factors Affecting Your Score</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="mr-3 mt-1 text-emerald-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-300">Timely loan repayments increase your score</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mr-3 mt-1 text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-300">Defaulting on loans decreases your score</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mr-3 mt-1 text-cyan-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-300">Higher scores give you access to larger loans with better rates</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={checkCreditScore}
                  className="bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Refresh Score
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 bg-gray-800/30 p-6 rounded-lg border border-gray-800">
              <div className="text-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mb-6 text-gray-300 text-center">You don't have a credit score yet. Your credit score will be established when you repay your first loan.</p>
              <div className="mt-4 text-gray-500 text-sm text-center">
                <p>Credit scores are automatically created when you interact with the lending protocol.</p>
                <p className="mt-2">Apply for a loan and repay it to establish your credit history.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CreditPage;