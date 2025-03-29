"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ethers } from 'ethers';
import LoanContractABI from '../../../lib/LoanContract.json';

const LoanDetailPage = () => {
  const params = useParams();
  const loanId = params.id;
  const contractAddress = "0x463942083D67Fe0fF490D6Bd1F4c6e671c0C309a";
  
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const connectAndFetchLoan = async () => {
      if (!loanId) {
        setError("No loan ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Check if ethereum object exists
        if (!window.ethereum) {
          throw new Error("Ethereum provider not found. Please install MetaMask or another Web3 wallet.");
        }
        
        // Connect to provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Get accounts
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length === 0) {
          throw new Error("No Ethereum accounts found. Please connect your wallet.");
        }
        
        setAccount(accounts[0]);
        
        // Get signer for transaction capabilities
        const signer = await provider.getSigner();
        
        // Create contract instance
        const contract = new ethers.Contract(
          contractAddress,
          LoanContractABI.abi,
          signer
        );
        
        console.log("Fetching loan ID:", loanId);
        
        // Get loan details from contract
        const loanDetails = await contract.loans(loanId);
        console.log("Raw loan details:", loanDetails);
        
        // Format loan data - handle BigInt conversions properly
        const formattedLoan = {
          id: loanId,
          borrower: loanDetails.borrower,
          amount: ethers.formatEther(loanDetails.amount.toString()),
          repaymentDue: new Date(Number(loanDetails.repaymentDue) * 1000).toLocaleDateString(),
          isApproved: loanDetails.isApproved,
          isPaid: loanDetails.isPaid
        };
        
        console.log("Formatted loan:", formattedLoan);
        setLoan(formattedLoan);
        
        // Check if current user is the loan owner
        setIsOwner(accounts[0].toLowerCase() === loanDetails.borrower.toLowerCase());
        
      } catch (err) {
        console.error("Error fetching loan:", err);
        setError("Failed to fetch loan details: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    connectAndFetchLoan();
  }, [loanId, contractAddress]);

  const handleLoanAction = async (action) => {
    if (!window.ethereum || !loan) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      let tx;
      
      switch (action) {
        case 'approve':
          tx = await contract.voteOnLoan(loanId, true);
          break;
        case 'repay':
          // For repayment, we need to send ETH with the transaction
          tx = await contract.repayLoan(loanId, {
            value: ethers.parseEther(loan.amount)
          });
          break;
        default:
          throw new Error("Unknown action");
      }
      
      await tx.wait();
      
      // Refresh loan data
      window.location.reload();
      
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      setError(`Failed to ${action} loan: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading loan details...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!loan) {
    return <div className="p-6 text-center">Loan not found</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Loan Details</h2>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Loan ID: {loan.id.substring(0, 10)}...</h3>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-600 text-sm">Borrower</p>
            <p className="font-medium break-all">{loan.borrower}</p>
          </div>
          
          <div>
            <p className="text-gray-600 text-sm">Amount</p>
            <p className="font-medium">{loan.amount} ETH</p>
          </div>
          
          <div>
            <p className="text-gray-600 text-sm">Repayment Due</p>
            <p className="font-medium">{loan.repaymentDue}</p>
          </div>
          
          <div>
            <p className="text-gray-600 text-sm">Status</p>
            <p className="font-medium">
              {loan.isPaid 
                ? 'Repaid' 
                : loan.isApproved 
                  ? 'Approved - Awaiting Repayment'
                  : 'Pending Approval'}
            </p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-4">
          {/* Approval button for non-owners when loan is pending */}
          {!isOwner && !loan.isApproved && !loan.isPaid && (
            <button
              onClick={() => handleLoanAction('approve')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Approve Loan
            </button>
          )}
          
          {/* Repay button for owners when loan is approved but not paid */}
          {isOwner && loan.isApproved && !loan.isPaid && (
            <button
              onClick={() => handleLoanAction('repay')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Repay Loan
            </button>
          )}
          
          {/* Back button */}
          <button
            onClick={() => window.history.back()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Loans
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoanDetailPage;