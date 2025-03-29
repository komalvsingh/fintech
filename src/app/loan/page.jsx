"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LoanContractABI from "../../lib/LoanContract.json";
import Link from 'next/link';

const LoanPage = () => {
  // Existing state variables
  const contractAddress = "0x860B55A2018d591378ceF13A4624fcc67373A3a1";
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("30"); // Default 30 days
  // Add missing state variables
  const [purpose, setPurpose] = useState("");
  const [collateral, setCollateral] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // New state for loans
  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  // Connect to MetaMask - existing function
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

  // New function to fetch loans
  const fetchLoans = async () => {
    if (!signer || !account) return;
    
    setLoadingLoans(true);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      const userLoans = [];
      
      // This is a placeholder - you'll need to implement a way to get loan IDs
      for (let i = 0; i < 10; i++) {
        try {
          // Generate a simple hash for demo purposes
          const loanId = ethers.keccak256(
            ethers.solidityPacked(
              ['address', 'uint256'],
              [account, i]
            )
          );
          
          const loan = await contract.loans(loanId);
          
          // Check if this is a valid loan for this user
          if (loan.borrower.toLowerCase() === account.toLowerCase() && loan.amount > 0) {
            // Basic loan data from blockchain
            const loanData = {
              id: loanId,
              amount: ethers.formatEther(loan.amount),
              repaymentDue: new Date(Number(loan.repaymentDue) * 1000).toLocaleDateString(),
              isApproved: loan.isApproved,
              isPaid: loan.isPaid
            };
            
            // Try to fetch IPFS data if available
            try {
              // Check if your contract stores IPFS hash
              if (loan.ipfsHash) {
                const ipfsData = await fetchLoanApplication(loan.ipfsHash);
                // Merge blockchain data with IPFS data
                loanData.purpose = ipfsData.purpose;
                loanData.collateral = ipfsData.collateral;
              }
            } catch (ipfsErr) {
              console.error("Error fetching IPFS data:", ipfsErr);
              // Continue with just blockchain data
            }
            
            userLoans.push(loanData);
          }
        } catch (err) {
          console.log("Error fetching loan", i, err);
          // Continue to next loan
        }
      }
      
      setLoans(userLoans);
    } catch (err) {
      console.error("Error fetching loans:", err);
      setError("Failed to fetch loans");
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
      // First, store loan data on IPFS if you have the IPFS functions imported
      // For now, we'll just use the blockchain
      
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      // Convert amount to wei (assuming amount is in ETH)
      const amountInWei = ethers.parseEther(amount);
      
      // Convert duration to seconds
      const durationInSeconds = parseInt(duration) * 24 * 60 * 60;
      
      const tx = await contract.requestLoan(amountInWei, durationInSeconds);
      await tx.wait();
      
      setSuccess(true);
      setAmount("");
      setDuration("30");
      setPurpose(""); // Reset purpose field
      setCollateral(""); // Reset collateral field
      
      // Fetch updated loans after successful submission
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Apply for a Loan</h2>
      
      {!isConnected ? (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-gray-600 mb-4">Please connect your wallet to apply for a loan.</p>
          <button
            onClick={connectWallet}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4">Apply for a New Loan</h3>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <p>Loan request submitted successfully!</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                  Loan Amount (ETH)
                </label>
                <input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.1"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
                  Loan Duration (Days)
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">365 days</option>
                </select>
              </div>
              
              {/* Add purpose field */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="purpose">
                  Loan Purpose
                </label>
                <textarea
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="What will you use this loan for?"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                />
              </div>
              
              {/* Add collateral field */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collateral">
                  Collateral (Optional)
                </label>
                <input
                  id="collateral"
                  type="text"
                  value={collateral}
                  onChange={(e) => setCollateral(e.target.value)}
                  placeholder="Any assets you're offering as collateral"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${
                  isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white px-4 py-2 rounded-md text-sm font-medium w-full`}
              >
                {isSubmitting ? 'Submitting...' : 'Apply for Loan'}
              </button>
            </form>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4">Your Loans</h3>
            
            {loadingLoans ? (
              <p className="text-gray-600">Loading your loans...</p>
            ) : loans.length > 0 ? (
              <div className="space-y-4">
                {loans.map((loan, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Loan #{index + 1}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        loan.isPaid 
                          ? 'bg-green-100 text-green-800' 
                          : loan.isApproved 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {loan.isPaid 
                          ? 'Repaid' 
                          : loan.isApproved 
                            ? 'Approved' 
                            : 'Pending'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p>{loan.amount} ETH</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Due Date</p>
                        <p>{loan.repaymentDue}</p>
                      </div>
                      
                      {/* Display IPFS data if available */}
                      {loan.purpose && (
                        <div className="col-span-2">
                          <p className="text-gray-500">Purpose</p>
                          <p className="truncate">{loan.purpose}</p>
                        </div>
                      )}
                      
                      {loan.collateral && (
                        <div className="col-span-2">
                          <p className="text-gray-500">Collateral</p>
                          <p>{loan.collateral}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Add View Details link */}
                    <div className="mt-3 flex justify-end">
                      <Link href={`/loan/${loan.id}`}>
                        <span className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                          View Details →
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">You don't have any loans yet.</p>
            )}
            
            <button
              onClick={fetchLoans}
              className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium w-full"
            >
              Refresh Loans
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanPage;
