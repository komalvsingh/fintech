"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import LoanContractABI from '../../../lib/LoanContract.json';
import LoanDetails from '../../../components/LoanDetails';
import Link from 'next/link';
import { CalendarIcon, WalletIcon, CoinsIcon, ClockIcon } from 'lucide-react';

const LoanDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const loanId = params.id;
  const contractAddress = "0x0A3a169934947589340A00219DEf18bE078C0a24";
  
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ipfsUrl, setIpfsUrl] = useState(null);
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isRepaying, setIsRepaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

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

  // Calculate time left until repayment due
  const calculateTimeLeft = (dueDate) => {
    if (!dueDate) return 'Unknown';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;
    
    if (diff <= 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days} days, ${hours} hours`;
  };

  // Fetch loan details function
  const fetchLoanDetails = async () => {
    if (!loanId) return;
    
    try {
      setLoading(true);
      
      let provider;
      if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        // Fallback to a public provider if MetaMask is not available
        provider = ethers.getDefaultProvider("sepolia");
      }
      
      const contract = new ethers.Contract(
        contractAddress,
        LoanContractABI.abi,
        provider
      );
      
      // Get loan details from contract
      const loanDetails = await contract.loans(loanId);
      
      // Format loan data
      const repaymentDueDate = new Date(Number(loanDetails.repaymentDue) * 1000);
      const formattedLoan = {
        id: loanId,
        borrower: loanDetails.borrower,
        amount: ethers.formatEther(loanDetails.amount),
        repaymentDue: repaymentDueDate.toLocaleDateString(),
        rawRepaymentDue: repaymentDueDate,
        isApproved: loanDetails.isApproved,
        isPaid: loanDetails.isPaid,
        ipfsHash: loanDetails.ipfsHash || null
      };
      
      setLoan(formattedLoan);
      setTimeLeft(calculateTimeLeft(formattedLoan.rawRepaymentDue));
      
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
        } finally {
          // Fetch loan details regardless of connection status
          fetchLoanDetails();
        }
      } else {
        // Fetch loan details even if MetaMask is not installed
        fetchLoanDetails();
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
        }
      });
    }
    
    // Update time left every minute
    const timer = setInterval(() => {
      if (loan && loan.rawRepaymentDue) {
        setTimeLeft(calculateTimeLeft(loan.rawRepaymentDue));
      }
    }, 60000);
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
      clearInterval(timer);
    };
  }, [loanId]); // Only run when loanId changes, not when loan changes

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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => router.push('/loan')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Loans
        </button>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg shadow mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p>Loan not found</p>
        </div>
        <button 
          onClick={() => router.push('/loan')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Loans
        </button>
      </div>
    );
  }

  const getStatusColor = () => {
    if (loan.isPaid) return 'bg-green-100 text-green-800 border-green-200';
    if (loan.isApproved) {
      const now = new Date();
      const due = loan.rawRepaymentDue;
      if (now > due) return 'bg-red-100 text-red-800 border-red-200';
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getStatusText = () => {
    if (loan.isPaid) return 'Repaid';
    if (loan.isApproved) {
      const now = new Date();
      const due = loan.rawRepaymentDue;
      if (now > due) return 'Overdue';
      return 'Approved';
    }
    return 'Pending';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto mt-5">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Loan #{loan.id.substring(0, 6)}...</h2>
        <Link href="/loan">
          <span className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Loans
          </span>
        </Link>
      </div>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow mb-4 flex items-center animate-pulse">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p>Loan repaid successfully!</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main loan information card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">Loan Information</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()} border`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <WalletIcon className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-gray-500 text-sm">Borrower</p>
                  <p className="font-medium text-gray-800 truncate">{`${loan.borrower.substring(0, 8)}...${loan.borrower.substring(loan.borrower.length - 6)}`}</p>
                  <p className="text-xs text-gray-500 mt-1 cursor-pointer hover:text-indigo-600" 
                     onClick={() => {navigator.clipboard.writeText(loan.borrower); alert('Address copied to clipboard');}}>
                    Click to copy full address
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CoinsIcon className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-gray-500 text-sm">Loan Amount</p>
                  <p className="font-medium text-gray-800">{loan.amount} ETH</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CalendarIcon className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-gray-500 text-sm">Repayment Due</p>
                  <p className="font-medium text-gray-800">{loan.repaymentDue}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <ClockIcon className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-gray-500 text-sm">Time Remaining</p>
                  <p className={`font-medium ${timeLeft === 'Overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                    {timeLeft || 'Calculating...'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Show repay button only if the loan is approved, not paid, and user is the borrower */}
            {loan.isApproved && 
             !loan.isPaid && 
             account && 
             account.toLowerCase() === loan.borrower.toLowerCase() && (
              <div className="mt-6">
                <button
                  onClick={handleRepay}
                  disabled={isRepaying}
                  className={`${
                    isRepaying 
                      ? 'bg-green-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white px-6 py-3 rounded-md font-medium w-full transition duration-150 ease-in-out transform hover:scale-105 flex justify-center items-center space-x-2`}
                >
                  {isRepaying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{`Repay ${loan.amount} ETH`}</span>
                    </>
                  )}
                </button>
                {!loan.isPaid && loan.rawRepaymentDue && new Date() > loan.rawRepaymentDue && (
                  <div className="mt-2 text-red-600 text-sm text-center">
                    <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    This loan is overdue. Please repay as soon as possible.
                  </div>
                )}
              </div>
            )}
            
            {/* Show connect wallet button if not connected */}
            {!account && (
              <div className="mt-6">
                <button
                  onClick={connectWallet}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium w-full transition duration-150 ease-in-out transform hover:scale-105 flex justify-center items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Connect Wallet</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h3 className="text-xl font-semibold text-gray-800">Loan Status</h3>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col space-y-6">
              {/* Status timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>
                
                <div className="relative flex items-start mb-6">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center mr-4 z-10 bg-green-500">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Created</h4>
                    <p className="text-sm text-gray-500">Loan request submitted</p>
                  </div>
                </div>
                
                <div className="relative flex items-start mb-6">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-4 z-10 ${loan.isApproved ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {loan.isApproved ? (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-white text-xs">2</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Approved</h4>
                    <p className="text-sm text-gray-500">Loan approved and funded</p>
                  </div>
                </div>
                
                <div className="relative flex items-start">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-4 z-10 ${loan.isPaid ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {loan.isPaid ? (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-white text-xs">3</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Repaid</h4>
                    <p className="text-sm text-gray-500">Loan repaid in full</p>
                  </div>
                </div>
              </div>
              
              {loan.isApproved && !loan.isPaid && loan.rawRepaymentDue && (
                <div className={`p-4 rounded-lg ${new Date() > loan.rawRepaymentDue ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <h4 className={`font-medium ${new Date() > loan.rawRepaymentDue ? 'text-red-700' : 'text-blue-700'}`}>
                    Payment Status
                  </h4>
                  <p className="text-sm mt-1">
                    {new Date() > loan.rawRepaymentDue 
                      ? 'This loan is past due. Please repay as soon as possible to avoid penalties.'
                      : 'Payment is due soon. Make sure to repay on time to maintain good standing.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Display IPFS data if available */}
      {ipfsUrl && (
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h3 className="text-xl font-semibold text-gray-800">Loan Documentation</h3>
          </div>
          <div className="p-6">
            <LoanDetails ipfsUrl={ipfsUrl} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDetailPage;