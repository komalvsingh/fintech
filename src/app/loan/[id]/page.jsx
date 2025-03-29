"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import LoanContractABI from '../../../lib/LoanContract.json';
import LoanDetails from '../../../components/LoanDetails';
import Link from 'next/link';

const LoanDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const loanId = params.id;
  const contractAddress = "0x1E6c3c940b8C9Fd7d6546EbA6105237e508b4201";
  
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ipfsUrl, setIpfsUrl] = useState(null);
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isRepaying, setIsRepaying] = useState(false);
  const [success, setSuccess] = useState(false);

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const newSigner = await provider.getSigner();
        const address = await newSigner.getAddress();
        
        setAccount(address);
        setSigner(newSigner);
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

  // Handle loan repayment
  const handleRepay = async () => {
    if (!signer || !loan) {
      setError("Please connect your wallet first");
      return;
    }
    
    setIsRepaying(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        signer
      );
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(loan.amount);
      
      const tx = await contract.repayLoan(loanId, { value: amountInWei });
      await tx.wait();
      
      // Show success message and refresh loan details
      setSuccess(true);
      setTimeout(() => {
        fetchLoanDetails();
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error repaying loan:", err);
      setError(err.message || "Failed to repay loan");
    } finally {
      setIsRepaying(false);
    }
  };

  // Fetch loan details function
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
    fetchLoanDetails();
    
    // Setup event listeners for account changes
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          setAccount(null);
          setSigner(null);
        }
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, [loanId]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading loan details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <button 
          onClick={() => router.push('/loan')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
        >
          Back to Loans
        </button>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Loan not found</p>
        </div>
        <button 
          onClick={() => router.push('/loan')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
        >
          Back to Loans
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Loan Details</h2>
        <Link href="/loan">
          <span className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
            Back to Loans
          </span>
        </Link>
      </div>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>Loan repaid successfully!</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Loan #{loan.id.substring(0, 8)}...</h3>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-600 text-sm">Borrower</p>
            <p className="font-medium truncate">{loan.borrower}</p>
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
                  ? 'Approved' 
                  : 'Pending Approval'}
            </p>
          </div>
        </div>
        
        {/* Show repay button only if the loan is approved, not paid, and user is the borrower */}
        {loan.isApproved && 
         !loan.isPaid && 
         account && 
         account.toLowerCase() === loan.borrower.toLowerCase() && (
          <div className="mt-4">
            <button
              onClick={handleRepay}
              disabled={isRepaying}
              className={`${
                isRepaying ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
              } text-white px-4 py-2 rounded-md text-sm font-medium w-full`}
            >
              {isRepaying ? 'Processing...' : `Repay ${loan.amount} ETH`}
            </button>
          </div>
        )}
        
        {/* Show connect wallet button if not connected */}
        {!account && (
          <div className="mt-4">
            <button
              onClick={connectWallet}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
      
      {/* Display IPFS data if available */}
      {ipfsUrl && <LoanDetails ipfsUrl={ipfsUrl} />}
    </div>
  );
};

export default LoanDetailPage;