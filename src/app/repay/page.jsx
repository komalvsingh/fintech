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
      console.log("Fetching loans for account:", account);
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      // Try different approaches to fetch loans
      let loanIds = [];
      
      try {
        // First approach: Use getUserLoans function
        const rawLoanIds = await contract.getUserLoans(account);
        loanIds = [...rawLoanIds];
        console.log("User loan IDs from getUserLoans:", loanIds);
      } catch (err) {
        console.warn("getUserLoans failed:", err.message);
        
        try {
          // Second approach: Try to get loans count first
          const loansCount = await contract.getUserLoansCount(account);
          console.log("User loans count:", loansCount);
          
          // Then fetch each loan ID
          for (let i = 0; i < loansCount; i++) {
            const loanId = await contract.userLoans(account, i);
            loanIds.push(loanId);
          }
          console.log("User loan IDs from userLoans mapping:", loanIds);
        } catch (err2) {
          console.warn("getUserLoansCount/userLoans approach failed:", err2.message);
          
          // Third approach: Try to get all loans and filter
          try {
            const allLoansCount = await contract.getLoansCount();
            console.log("Total loans count:", allLoansCount);
            
            for (let i = 0; i < allLoansCount; i++) {
              try {
                const loanId = await contract.allLoans(i);
                const loan = await contract.loans(loanId);
                
                if (loan.borrower.toLowerCase() === account.toLowerCase()) {
                  loanIds.push(loanId);
                }
              } catch (err3) {
                console.log(`Error checking loan at index ${i}:`, err3.message);
              }
            }
            console.log("User loan IDs from scanning all loans:", loanIds);
          } catch (err3) {
            console.warn("All loans scanning approach failed:", err3.message);
          }
        }
      }
      
      // If we still don't have loan IDs, try a direct approach
      if (loanIds.length === 0) {
        console.log("No loan IDs found, trying direct loan fetching...");
        
        // Try to directly fetch loans by generating potential IDs
        // This is a fallback approach that might work depending on how your contract generates loan IDs
        const formattedLoans = [];
        
        // Try to fetch recent loans (last 10 blocks)
        const provider = new ethers.BrowserProvider(window.ethereum);
        const currentBlock = await provider.getBlockNumber();
        
        // Look for loan events in recent blocks
        try {
          const loanRequestedFilter = contract.filters.LoanRequested(account);
          const loanEvents = await contract.queryFilter(loanRequestedFilter, currentBlock - 5000, currentBlock);
          
          console.log("Found loan events:", loanEvents);
          
          for (const event of loanEvents) {
            try {
              const loanId = event.args.loanId;
              loanIds.push(loanId);
            } catch (err) {
              console.log("Error processing loan event:", err);
            }
          }
          
          console.log("Loan IDs from events:", loanIds);
        } catch (err) {
          console.warn("Event filtering failed:", err.message);
        }
      }
      
      // Process the loan IDs we found
      if (loanIds.length > 0) {
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
      } else {
        console.log("No loans found for this account");
        setLoans([]);
      }
    } catch (err) {
      console.error("Error fetching loans:", err);
      setError("Failed to fetch loans: " + (err.message || "Unknown error"));
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
      
      console.log("Repaying loan:", loanId, "Amount:", amount.toString());
      
      // Call repayLoan function with the exact amount
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
            <div className="flex justify-center items-center h-40">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your loans...</p>
              </div>
            </div>
          ) : loans.length > 0 ? (
            <div className="space-y-4">
              {loans.map((loan, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Loan #{index + 1}</span>
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className="font-semibold">{loan.amount} ETH</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Due Date</p>
                      <p>{loan.repaymentDue}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Loan ID</p>
                      <p className="text-xs truncate">{loan.id}</p>
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
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-gray-600 mb-2">You don't have any active loans to repay.</p>
              <p className="text-sm text-gray-500">Apply for a loan on the Loans page.</p>
            </div>
          )}
          
          <button
            onClick={fetchLoans}
            disabled={loadingLoans}
            className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium w-full"
          >
            {loadingLoans ? 'Refreshing...' : 'Refresh Loans'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RepaymentPage;