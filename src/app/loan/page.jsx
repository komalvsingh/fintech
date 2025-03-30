"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LoanContractABI from "../../lib/LoanContract.json";
import Link from 'next/link';

const LoanPage = () => {
  // Contract and wallet state
  const contractAddress = "0x1E6c3c940b8C9Fd7d6546EbA6105237e508b4201";
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("30"); // Default 30 days
  const [purpose, setPurpose] = useState("");
  const [collateral, setCollateral] = useState("");
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Loans state
  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  
  // Tab state for mobile view
  const [activeTab, setActiveTab] = useState("apply");

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

  // Fetch loans using the contract's getUserLoans function
  const fetchLoans = async () => {
    if (!signer || !account) return;
    
    setLoadingLoans(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      console.log("Fetching loans for account:", account);
      
      // Get loan IDs associated with this user
      const loanIds = await contract.getUserLoans(account);
      console.log("User loan IDs:", loanIds);
      
      if (loanIds.length === 0) {
        setLoans([]);
        setLoadingLoans(false);
        return;
      }
      
      // Convert BigInts to strings for each loan ID
      const loanIdStrings = loanIds.map(id => id.toString());
      console.log("Loan IDs as strings:", loanIdStrings);
      
      // Fetch each loan's details
      const userLoans = await Promise.all(
        loanIds.map(async (id) => {
          try {
            const loan = await contract.loans(id);
            console.log(`Loan ${id.toString()} details:`, loan);
            
            return {
              id: id.toString(),
              borrower: loan.borrower,
              amount: ethers.formatEther(loan.amount),
              repaymentDue: new Date(Number(loan.repaymentDue) * 1000).toLocaleDateString(),
              isApproved: loan.isApproved,
              isPaid: loan.isPaid,
              // You could add purpose and collateral here if stored in IPFS
            };
          } catch (err) {
            console.error(`Error fetching loan ${id.toString()}:`, err);
            return null;
          }
        })
      );
      
      // Filter out any null values from failed fetches
      const validLoans = userLoans.filter(loan => loan !== null);
      console.log("Fetched loans:", validLoans);
      
      setLoans(validLoans);
    } catch (err) {
      console.error("Error fetching loans:", err);
      setError("Failed to fetch loans: " + err.message);
    } finally {
      setLoadingLoans(false);
    }
  };

  // Fetch loans when account changes or after a successful submission
  useEffect(() => {
    if (isConnected && account) {
      fetchLoans();
    }
  }, [isConnected, account, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!signer) {
      setError("Please connect your wallet first");
      return;
    }
    
    if (!amount || !duration) {
      setError("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      // Convert amount to wei (assuming amount is in ETH)
      const amountInWei = ethers.parseEther(amount);
      
      // Convert duration to seconds
      const durationInSeconds = parseInt(duration) * 24 * 60 * 60;
      
      console.log(`Requesting loan of ${amount} ETH for ${duration} days (${durationInSeconds} seconds)`);
      
      // Call the requestLoan function
      const tx = await contract.requestLoan(amountInWei, durationInSeconds);
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction to be mined
      console.log("Waiting for transaction confirmation...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      setSuccess(true);
      setAmount("");
      setDuration("30");
      setPurpose(""); 
      setCollateral("");
      
      // Fetch updated loans after successful submission
      console.log("Waiting before refreshing loans...");
      setTimeout(() => {
        fetchLoans();
      }, 2000); // Give the blockchain some time to process
    } catch (err) {
      console.error("Error requesting loan:", err);
      setError(err.message || "Failed to request loan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add repay loan function
  const handleRepay = async (loanId, amount) => {
    if (!signer) {
      setError("Please connect your wallet first");
      return;
    }
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount.toString());
      
      const tx = await contract.repayLoan(loanId, { value: amountInWei });
      await tx.wait();
      
      // Update the loans list
      fetchLoans();
      
      // Show success message
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Error repaying loan:", err);
      setError(err.message || "Failed to repay loan");
    }
  };

  // Function to format wallet address
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          {/* <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">DeFi Lending Platform</h1>
            <p className="text-gray-400">Secure, transparent P2P lending on blockchain</p>
          </div> */}
          
          {/* {isConnected && (
            <div className="mt-4 md:mt-0 flex items-center bg-gray-800 shadow-md rounded-full py-2 px-4 border border-gray-700">
              <div className="h-3 w-3 rounded-full bg-teal-400 mr-2"></div>
              <span className="text-gray-300 text-sm font-medium">{formatAddress(account)}</span>
            </div>
          )} */}
        </div>
        
        {/* Mobile Tabs */}
        <div className="md:hidden flex rounded-lg overflow-hidden shadow-md mb-6">
          <button 
            className={`flex-1 py-3 text-center font-medium text-sm ${activeTab === 'apply' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            onClick={() => setActiveTab('apply')}
          >
            Apply for Loan
          </button>
          <button 
            className={`flex-1 py-3 text-center font-medium text-sm ${activeTab === 'loans' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            onClick={() => setActiveTab('loans')}
          >
            Your Loans
          </button>
        </div>
        
        {!isConnected ? (
          <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-blue-600 to-teal-500 py-6 px-6">
              <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
              <p className="text-blue-100 mt-1">To access the DeFi lending platform</p>
            </div>
            <div className="p-6">
              <div className="flex items-center bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-600 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-gray-300">Connect your Web3 wallet to apply for or manage loans on our decentralized platform.</p>
                </div>
              </div>
              
              <button
                onClick={connectWallet}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 transition-colors duration-200 text-white py-3 rounded-lg text-sm font-semibold shadow-md flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Connect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Apply for Loan Section */}
            <div className={`md:col-span-2 ${activeTab !== 'apply' && 'hidden md:block'}`}>
              <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden h-full border border-gray-700">
                <div className="bg-gradient-to-r from-blue-600 to-teal-500 py-4 px-6">
                  <h2 className="text-xl font-bold text-white">Apply for a Loan</h2>
                  <p className="text-blue-100 mt-1">Fill in the details below</p>
                </div>
                
                <div className="p-6">
                  {error && (
                    <div className="bg-red-900/30 border-l-4 border-red-500 text-red-300 p-4 mb-6 rounded-md">
                      <div className="flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p>{error}</p>
                      </div>
                    </div>
                  )}
                  
                  {success && (
                    <div className="bg-teal-900/30 border-l-4 border-teal-500 text-teal-300 p-4 mb-6 rounded-md">
                      <div className="flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p>Loan request submitted successfully!</p>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="amount">
                        Loan Amount (ETH)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-sm">Ξ</span>
                        </div>
                        <input
                          id="amount"
                          type="text"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.1"
                          className="block w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="duration">
                        Loan Duration
                      </label>
                      <select
                        id="duration"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="block w-full py-2.5 px-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        required
                      >
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">365 days</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="purpose">
                        Loan Purpose
                      </label>
                      <textarea
                        id="purpose"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="What will you use this loan for?"
                        className="block w-full py-2.5 px-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        rows="3"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="collateral">
                        Collateral (Optional)
                      </label>
                      <input
                        id="collateral"
                        type="text"
                        value={collateral}
                        onChange={(e) => setCollateral(e.target.value)}
                        placeholder="Any assets you're offering as collateral"
                        className="block w-full py-2.5 px-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`${
                        isSubmitting ? 'bg-blue-500/50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600'
                      } w-full text-white py-3 px-4 rounded-lg font-medium shadow-md transition-colors duration-200`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        'Apply for Loan'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
            
            {/* Loans Display Section - Improved */}
            <div className={`md:col-span-3 ${activeTab !== 'loans' && 'hidden md:block'}`}>
              <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden h-full border border-gray-700">
                <div className="bg-gradient-to-r from-blue-600 to-teal-500 py-4 px-6">
                  <h2 className="text-xl font-bold text-white">Your Loans</h2>
                  <p className="text-blue-100 mt-1">View and manage your active loans</p>
                </div>
                
                <div className="p-6">
                  {loadingLoans ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <svg className="animate-spin h-10 w-10 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-400">Loading your loans...</p>
                    </div>
                  ) : loans && loans.length > 0 ? (
                    <div className="space-y-5 max-h-96 overflow-y-auto pr-2">
                      {loans.map((loan, index) => (
                        <div key={loan.id} className="border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-gray-800">
                          <div className="bg-gray-700 px-4 py-3 border-b border-gray-600 flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="text-cyan-400 font-semibold">Loan #{index + 1}</span>
                              <span className={`ml-3 text-xs px-2.5 py-0.5 rounded-full font-medium 
                                ${loan.isPaid 
                                  ? 'bg-teal-900 text-teal-300' 
                                  : loan.isApproved 
                                    ? 'bg-blue-900 text-blue-300'
                                    : 'bg-yellow-900 text-yellow-300'
                                }`}
                              >
                                {loan.isPaid 
                                  ? 'Repaid' 
                                  : loan.isApproved 
                                    ? 'Approved' 
                                    : 'Pending'}
                              </span>
                            </div>
                            <div className="text-gray-400 text-sm">ID: {loan.id}</div>
                          </div>
                          
                          <div className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-700 rounded-lg p-3">
                                <div className="text-xs text-cyan-400 font-medium mb-1">Amount</div>
                                <div className="text-lg font-semibold text-gray-100">{loan.amount} ETH</div>
                              </div>
                              
                              <div className="bg-gray-700 rounded-lg p-3">
                                <div className="text-xs text-cyan-400 font-medium mb-1">Due Date</div>
                                <div className="text-gray-100 font-medium">{loan.repaymentDue}</div>
                              </div>
                            </div>
                            
                            {loan.purpose && (
                              <div className="mt-4">
                                <div className="text-xs text-gray-400 font-medium mb-1">Purpose</div>
                                <div className="text-gray-300">{loan.purpose}</div>
                              </div>
                            )}
                            
                            {loan.collateral && (
                              <div className="mt-4">
                                <div className="text-xs text-gray-400 font-medium mb-1">Collateral</div>
                                <div className="text-gray-300">{loan.collateral}</div>
                              </div>
                            )}
                            
                            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                              <Link href={`/loan/${loan.id}`}>
                                <span className="inline-flex items-center text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors duration-200">
                                  View Details
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </span>
                              </Link>
                              
                              {loan.isApproved && !loan.isPaid && (
                                <button
                                  onClick={() => handleRepay(loan.id, loan.amount)}
                                  className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-200"
                                >
                                  Repay Loan
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-gray-300 font-medium mb-1">No loans yet</p>
                      <p className="text-sm text-gray-400 text-center max-w-xs">
                        You haven't applied for any loans yet. Use the form to submit your first loan application.
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={fetchLoans}
                    className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Loans
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanPage;