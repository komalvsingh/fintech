"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LoanContractABI from "../../lib/LoanContract.json";

const RepaymentPage = () => {
  const contractAddress = "0x0A3a169934947589340A00219DEf18bE078C0a24";
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [repaying, setRepaying] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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

  // Fetch loans when account changes
  useEffect(() => {
    if (isConnected && account) {
      fetchLoans();
    }
  }, [isConnected, account]);

  const fetchLoans = async () => {
    if (!signer || !account) return;
    
    setLoadingLoans(true);
    setError(null);
    
    try {
      console.log("Fetching loans for account:", account);
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      // Use the getUserLoans function from the contract
      const loanIds = await contract.getUserLoans(account);
      console.log("User loan IDs from getUserLoans:", loanIds);
      
      const formattedLoans = [];
      
      // Process each loan ID
      for (let i = 0; i < loanIds.length; i++) {
        try {
          const loanId = loanIds[i];
          const loan = await contract.loans(loanId);
          
          // Verify this loan belongs to the current user
          if (loan.borrower.toLowerCase() === account.toLowerCase() && loan.amount > 0n) {
            formattedLoans.push({
              id: loanId,
              borrower: loan.borrower,
              amount: ethers.formatEther(loan.amount),
              rawAmount: loan.amount,
              repaymentDue: new Date(Number(loan.repaymentDue) * 1000).toLocaleDateString(),
              isApproved: loan.isApproved,
              isPaid: loan.isPaid
            });
          }
        } catch (err) {
          console.log(`Error fetching loan details for ID ${loanIds[i]}:`, err.message);
        }
      }
      
      console.log("Formatted loans before filtering:", formattedLoans);
      
      // Filter for approved, unpaid loans
      const activeLoans = formattedLoans.filter(loan => 
        loan.isApproved && !loan.isPaid
      );
      
      console.log("Active loans after filtering:", activeLoans);
      setLoans(activeLoans);
      
      if (activeLoans.length === 0) {
        console.log("No active loans found for this account");
      }
      
    } catch (err) {
      console.error("Error fetching loans:", err);
      setError("Failed to fetch loans: " + (err.message || "Unknown error"));
      
      // Try direct loan lookup through events as fallback
      try {
        await fetchLoansThroughEvents();
      } catch (eventErr) {
        console.error("Fallback fetch also failed:", eventErr);
      }
    } finally {
      setLoadingLoans(false);
    }
  };
  
  const fetchLoansThroughEvents = async () => {
    if (!signer || !account) return;
    
    console.log("Trying fallback method to fetch loans through events...");
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        provider
      );
      
      // Look for loan events in recent blocks (last 5000 blocks)
      const currentBlock = await provider.getBlockNumber();
      const formattedLoans = [];
      
      // Define loan events to look for - assuming there might be a LoanRequested event
      // This is speculative and depends on your actual contract events
      const fromBlock = Math.max(0, currentBlock - 5000);
      const toBlock = 'latest';
      
      // Get all past events and filter manually
      const events = await provider.getLogs({
        address: contractAddress,
        fromBlock,
        toBlock
      });
      
      console.log("Found events:", events);
      
      // For each event, check if it's related to a loan for this user
      for (const event of events) {
        try {
          // Check all loans to find this user's loans
          const loanId = event.topics[1]; // This is speculative
          if (loanId) {
            const loan = await contract.loans(loanId);
            
            if (loan.borrower.toLowerCase() === account.toLowerCase() && 
                loan.amount > 0n && 
                loan.isApproved && 
                !loan.isPaid) {
              
              formattedLoans.push({
                id: loanId,
                borrower: loan.borrower,
                amount: ethers.formatEther(loan.amount),
                rawAmount: loan.amount,
                repaymentDue: new Date(Number(loan.repaymentDue) * 1000).toLocaleDateString(),
                isApproved: loan.isApproved,
                isPaid: loan.isPaid
              });
            }
          }
        } catch (err) {
          console.log("Error processing event:", err);
        }
      }
      
      console.log("Loans found through events:", formattedLoans);
      if (formattedLoans.length > 0) {
        setLoans(formattedLoans);
      }
      
    } catch (err) {
      console.error("Error in event-based loan fetching:", err);
      throw err;
    }
  };

  const handleRepay = async (loanId, amount) => {
    if (!signer) return;
    
    setRepaying(true);
    setError(null);
    setSuccess(false);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      console.log("Repaying loan:", loanId, "Amount:", amount.toString());
      
      // Call repayLoan function with the loan ID and exact amount as value
      // Matching the contract's function signature: function repayLoan(uint256 loanId) external payable
      const tx = await contract.repayLoan(loanId, {
        value: amount
      });
      
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      setSuccess(true);
      
      // Refresh loans after successful repayment
      setTimeout(() => {
        fetchLoans();
      }, 2000);
    } catch (err) {
      console.error("Error repaying loan:", err);
      setError(err.message || "Failed to repay loan");
    } finally {
      setRepaying(false);
    }
  };

  // Truncate address for display
  const truncateAddress = (address) => {
    if (!address) return "";
    return address.slice(0, 6) + "..." + address.slice(-4);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 mt-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-400">
            Repay Your Loans
          </h2>
          
          {isConnected && (
            <div className="bg-gray-800 py-2 px-4 rounded-full text-sm">
              {truncateAddress(account)}
            </div>
          )}
        </div>
        
        {!isConnected ? (
          <div className="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center rounded-full bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Wallet Connection Required</h3>
              <p className="text-gray-400 mb-6">
                Connect your Ethereum wallet to view your active loans and manage your repayments.
              </p>
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-medium py-3 px-6 rounded-lg w-full transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700">
            {error && (
              <div className="bg-red-900/50 border border-red-800 text-red-100 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p>{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-teal-900/50 border border-teal-800 text-teal-100 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Loan repaid successfully! Your credit score has been updated.</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-cyan-400">Your Active Loans</h3>
              <button
                onClick={fetchLoans}
                disabled={loadingLoans}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm flex items-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${loadingLoans ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loadingLoans ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {loadingLoans ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading your loans...</p>
                </div>
              </div>
            ) : loans.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {loans.map((loan, index) => (
                  <div key={index} className="border border-gray-700 bg-gray-800/50 rounded-xl p-6 hover:bg-gray-750 transition-colors backdrop-blur-sm shadow-lg hover:shadow-cyan-500/10">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center mr-3">
                          <span className="font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Loan #{index + 1}</h4>
                          <p className="text-xs text-gray-400 truncate w-32">{loan.id}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-900/50 text-cyan-300 border border-cyan-800">
                        Active
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount Due</span>
                        <span className="font-semibold text-white">{loan.amount} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Due Date</span>
                        <span className="text-white">{loan.repaymentDue}</span>
                      </div>
                      
                      {/* Progress bar for time remaining - just UI, not functional */}
                      <div className="pt-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2 rounded-full" style={{ width: "65%" }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRepay(loan.id, loan.rawAmount)}
                      disabled={repaying}
                      className={`
                        ${repaying ? 'bg-teal-700' : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600'}
                        text-white px-4 py-3 rounded-lg text-sm font-medium w-full transition-all duration-200
                        flex items-center justify-center shadow-lg hover:shadow-cyan-500/25
                      `}
                    >
                      {repaying ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Repay {loan.amount} ETH
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-300 font-medium mb-2">No Active Loans Found</p>
                <p className="text-sm text-gray-400 text-center max-w-xs">You don't have any active loans to repay at the moment. Apply for a loan on the Loans page.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepaymentPage;