"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ethers } from 'ethers';
import LoanContractABI from '../../../lib/LoanContract.json';
import LoanDetails from '../../../components/LoanDetails';

const LoanDetailPage = () => {
  const params = useParams();
  const loanId = params.id;
  const contractAddress = "0x860B55A2018d591378ceF13A4624fcc67373A3a1";
  
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ipfsUrl, setIpfsUrl] = useState(null);

  useEffect(() => {
    const fetchLoanDetails = async () => {
      if (!loanId) return;
      
      try {
        setLoading(true);
        
        // Connect to provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          contractAddress,
          LoanContractABI.abi,
          provider
        );
        
        // Get loan details from contract
        const loanDetails = await contract.loans(loanId);
        
        // Format loan data
        const formattedLoan = {
          id: loanId,
          borrower: loanDetails.borrower,
          amount: ethers.formatEther(loanDetails.amount),
          repaymentDue: new Date(Number(loanDetails.repaymentDue) * 1000).toLocaleDateString(),
          isApproved: loanDetails.isApproved,
          isPaid: loanDetails.isPaid,
          // Assuming you've added an ipfsHash field to your Loan struct
          ipfsHash: loanDetails.ipfsHash || null
        };
        
        setLoan(formattedLoan);
        
        // If there's an IPFS hash, set it to fetch the detailed data
        if (formattedLoan.ipfsHash) {
          setIpfsUrl(formattedLoan.ipfsHash);
        }
        
      } catch (err) {
        console.error("Error fetching loan:", err);
        setError("Failed to fetch loan details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLoanDetails();
  }, [loanId]);

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
          <h3 className="text-xl font-semibold">Loan #{loan.id}</h3>
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
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Borrower</p>
            <p className="font-medium">{loan.borrower}</p>
          </div>
          
          <div>
            <p className="text-gray-600 text-sm">Amount</p>
            <p className="font-medium">{loan.amount} ETH</p>
          </div>
          
          <div>
            <p className="text-gray-600 text-sm">Repayment Due</p>
            <p className="font-medium">{loan.repaymentDue}</p>
          </div>
        </div>
      </div>
      
      {ipfsUrl && <LoanDetails ipfsUrl={ipfsUrl} />}
    </div>
  );
};

export default LoanDetailPage;