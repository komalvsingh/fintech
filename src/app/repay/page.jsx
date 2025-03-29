"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import LoanContractABI from "../../lib/LoanContract.json";

const RepaymentPage = () => {
  const contractAddress = "0x463942083D67Fe0fF490D6Bd1F4c6e671c0C309a";
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
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      // Get user's loans
      const loanIds = await contract.getUserLoans(account);
      
      if (loanIds.length > 0) {
        // Get details for all loans
        const loanDetails = await contract.getMultipleLoans(loanIds);
        
        // Create new objects from the read-only objects returned by the contract
        const formattedLoans = Array.from(loanDetails).map((loan) => {
          return {
            id: BigInt(loan.id),
            amount: ethers.formatEther(loan.amount),
            rawAmount: loan.amount,
            repaymentDue: new Date(Number(loan.repaymentDue) * 1000).toLocaleDateString(),
            isApproved: loan.isApproved,
            isPaid: loan.isPaid
          };
        });
        
        // Filter for approved, unpaid loans
        const activeLoans = formattedLoans.filter(loan => 
          loan.isApproved && !loan.isPaid
        );
        
        setLoans(activeLoans);
      } else {
        setLoans([]);
      }
    } catch (err) {
      console.error("Error fetching loans:", err);
      setError("Failed to fetch loans: " + err.message);
    } finally {
      setLoadingLoans(false);
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
      
      // Call repayLoan function with the exact amount
      const tx = await contract.repayLoan(loanId, {
        value: amount
      });
      
      await tx.wait();
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Repay Your Loans</h2>
      
      {!isConnected ? (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-gray-600 mb-4">Please connect your wallet to view and repay your loans.</p>
          <button
            onClick={connectWallet}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-md">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p>Loan repaid successfully! Your credit score has been updated.</p>
            </div>
          )}
          
          <h3 className="text-lg font-semibold mb-4">Your Active Loans</h3>
          
          {loadingLoans ? (
            <p className="text-gray-600">Loading your loans...</p>
          ) : loans.length > 0 ? (
            <div className="space-y-4">
              {loans.map((loan, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Loan #{index + 1}</span>
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p>{loan.amount} ETH</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Due Date</p>
                      <p>{loan.repaymentDue}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRepay(loan.id, loan.rawAmount)}
                    disabled={repaying}
                    className={`${
                      repaying ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
                    } text-white px-4 py-2 rounded-md text-sm font-medium w-full`}
                  >
                    {repaying ? 'Processing...' : `Repay ${loan.amount} ETH`}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">You don't have any active loans to repay.</p>
          )}
          
          <button
            onClick={fetchLoans}
            className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium w-full"
          >
            Refresh Loans
          </button>
        </div>
      )}
    </div>
  );
};

export default RepaymentPage;