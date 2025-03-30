"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import DAOContractABI from "../../lib/DAOContract.json";

const DAOPage = () => {
  const contractAddress = "0x78dAfdDCa52A7DD3d130e7a0f4100b4972A32E8F";
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loanRequests, setLoanRequests] = useState([]);
  const [newMemberAddress, setNewMemberAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  // Check if user is a member and/or owner
  useEffect(() => {
    const checkMemberStatus = async () => {
      if (!signer || !account) return;
      
      try {
        const contract = new ethers.Contract(
          contractAddress,
          DAOContractABI.abi,
          signer
        );
        
        const memberStatus = await contract.members(account);
        setIsMember(memberStatus);
        
        const ownerAddress = await contract.owner();
        setIsOwner(ownerAddress.toLowerCase() === account.toLowerCase());
        
        // If user is a member, fetch loan requests
        if (memberStatus) {
          fetchLoanRequests();
        }
      } catch (err) {
        console.error("Error checking member status:", err);
      }
    };
    
    if (isConnected) {
      checkMemberStatus();
    }
  }, [isConnected, account, signer]);

  // Fetch all loan requests
  const fetchLoanRequests = async () => {
    if (!signer || !isMember) return;
    
    setLoading(true);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        DAOContractABI.abi,
        signer
      );
      
      // Get the list of pending loans
      const pendingLoanIds = await contract.getPendingLoans();
      const requests = [];
      
      for (let i = 0; i < pendingLoanIds.length; i++) {
        const loanId = pendingLoanIds[i];
        const loanDetails = await contract.getLoanDetails(loanId);
        
        // Extract the data from the returned tuple
        const borrower = loanDetails[0];
        const amount = loanDetails[1];
        const repaymentDue = loanDetails[2];
        const isApproved = loanDetails[3];
        const isPaid = loanDetails[4];
        const voteCount = loanDetails[5];
        
        requests.push({
          id: loanId,
          borrower: borrower,
          amount: ethers.formatEther(amount),
          repaymentDue: new Date(Number(repaymentDue) * 1000).toLocaleDateString(),
          approved: isApproved,
          paid: isPaid,
          votes: Number(voteCount)
        });
      }
      
      setLoanRequests(requests);
    } catch (err) {
      console.error("Error fetching loan requests:", err);
      setError("Failed to fetch loan requests: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Add a new member (only owner)
  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!signer || !isOwner) return;
    if (!ethers.isAddress(newMemberAddress)) {
      setError("Invalid Ethereum address");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        DAOContractABI.abi,
        signer
      );
      
      const tx = await contract.addMember(newMemberAddress);
      await tx.wait();
      
      setSuccess(`Added ${newMemberAddress} as a DAO member`);
      setNewMemberAddress("");
    } catch (err) {
      console.error("Error adding member:", err);
      setError(err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  // Vote for a loan
  const handleVote = async (loanId) => {
    if (!signer || !isMember) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        DAOContractABI.abi,
        signer
      );
      
      // Check if the user has already voted
      const hasVoted = await contract.hasUserVoted(loanId, account);
      if (hasVoted) {
        setError("You have already voted for this loan");
        setLoading(false);
        return;
      }
      
      // First check if the transaction would succeed by estimating gas
      try {
        await contract.voteOnLoan.estimateGas(loanId, true);
      } catch (estimateError) {
        console.error("Gas estimation failed:", estimateError);
        setError("Transaction would fail: " + (estimateError.reason || "You may have already voted for this loan"));
        setLoading(false);
        return;
      }
      
      // If gas estimation succeeds, proceed with the transaction
      const tx = await contract.voteOnLoan(loanId, true, {
        gasLimit: 300000 // Set a reasonable gas limit
      });
      
      await tx.wait();
      
      setSuccess(`Vote submitted for loan #${loanId.toString().substring(0, 8)}...`);
      
      // Refresh loan requests
      fetchLoanRequests();
    } catch (err) {
      console.error("Error voting:", err);
      setError(err.message || "Failed to vote");
    } finally {
      setLoading(false);
    }
  };

  // Reject a loan
  const handleRejectLoan = async (loanId) => {
    if (!signer || !isMember) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        DAOContractABI.abi,
        signer
      );
      
      // First check if the transaction would succeed by estimating gas
      try {
        await contract.rejectLoan.estimateGas(loanId);
      } catch (estimateError) {
        console.error("Gas estimation failed:", estimateError);
        setError("Transaction would fail: " + (estimateError.reason || "Unable to reject loan"));
        setLoading(false);
        return;
      }
      
      // If gas estimation succeeds, proceed with the transaction
      const tx = await contract.rejectLoan(loanId, {
        gasLimit: 300000 // Set a reasonable gas limit
      });
      
      await tx.wait();
      
      setSuccess(`Loan #${loanId.toString().substring(0, 8)}... rejected`);
      
      // Refresh loan requests
      fetchLoanRequests();
    } catch (err) {
      console.error("Error rejecting loan:", err);
      setError(err.message || "Failed to reject loan");
    } finally {
      setLoading(false);
    }
  };

  // Truncate address for display
  const truncateAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Truncate loan ID for display
  const truncateLoanId = (id) => {
    if (!id) return "";
    const idStr = id.toString();
    return idStr.length > 10 ? `#${idStr.substring(0, 10)}...` : `#${idStr}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6 mt-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-500 bg-clip-text text-transparent">DeFi Credit DAO</h1>
          </div>
          
          <div className="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Welcome to DeFi Credit DAO</h2>
              <p className="text-gray-300 mb-6">Connect your wallet to manage loans, vote on proposals, and participate in decentralized lending.</p>
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Connect Wallet
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center hover:border-cyan-500 transition-all duration-200">
                <h3 className="text-xl font-semibold mb-3 text-cyan-400">Manage Loans</h3>
                <p className="text-gray-400">Request and manage loans through our decentralized platform.</p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center hover:border-teal-500 transition-all duration-200">
                <h3 className="text-xl font-semibold mb-3 text-teal-400">Vote on Proposals</h3>
                <p className="text-gray-400">Have your say in loan approvals and governance decisions.</p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center hover:border-blue-500 transition-all duration-200">
                <h3 className="text-xl font-semibold mb-3 text-blue-400">Join the DAO</h3>
                <p className="text-gray-400">Become a member and participate in our decentralized organization.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 mt-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-500 bg-clip-text text-transparent">DeFi Credit DAO</h1>
          
          <div className="flex items-center space-x-4">
            <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Connected as:</p>
              <p className="text-sm font-medium">{truncateAddress(account)}</p>
            </div>
            <button
              onClick={connectWallet}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm border border-gray-700 transition-colors"
            >
              Switch Wallet
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>{success}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - DAO Status */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-6">
              <h3 className="text-xl font-semibold mb-6 text-cyan-400">Your DAO Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 ${isMember ? 'bg-teal-500' : 'bg-red-500'}`}></div>
                  <p className="text-gray-300">{isMember ? 'Active DAO Member' : 'Not a DAO Member'}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 ${isOwner ? 'bg-teal-500' : 'bg-gray-600'}`}></div>
                  <p className="text-gray-300">{isOwner ? 'DAO Administrator' : 'Regular Member'}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-lg font-medium mb-4 text-gray-300">Actions</h4>
                <button
                  onClick={fetchLoanRequests}
                  disabled={loading || !isMember}
                  className={`w-full ${
                    loading || !isMember
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white'
                  } px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-3`}
                >
                  {loading ? 'Loading...' : 'Refresh Loan Data'}
                </button>
                
                {!isMember && (
                  <p className="text-sm text-gray-500 mt-2">
                    Contact the DAO administrator to request membership.
                  </p>
                )}
              </div>
            </div>
            
            {/* Add Member Form (only for owner) */}
            {isOwner && (
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-6 text-cyan-400">Add DAO Member</h3>
                <form onSubmit={handleAddMember}>
                  <div className="mb-4">
                    <label className="block text-gray-400 text-sm font-medium mb-2" htmlFor="memberAddress">
                      Ethereum Address
                    </label>
                    <input
                      id="memberAddress"
                      type="text"
                      value={newMemberAddress}
                      onChange={(e) => setNewMemberAddress(e.target.value)}
                      placeholder="0x..."
                      className="bg-gray-700 border border-gray-600 rounded-lg w-full py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full ${
                      loading
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white'
                    } px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                  >
                    {loading ? 'Processing...' : 'Add Member'}
                  </button>
                </form>
              </div>
            )}
          </div>
          
          {/* Right column - Loan Requests (2 columns wide) */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-cyan-400">Pending Loan Requests</h3>
                <button
                  onClick={fetchLoanRequests}
                  disabled={loading || !isMember}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              {!isMember ? (
                <div className="text-center p-8">
                  <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-300">Members Only</h3>
                  <p className="mt-2 text-gray-400">You need to be a DAO member to view and vote on loan requests.</p>
                </div>
              ) : loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
              ) : loanRequests.length > 0 ? (
                <div className="space-y-4">
                  {loanRequests.map((request) => (
                    <div key={request.id.toString()} className="bg-gray-700 rounded-lg p-5 border border-gray-600 hover:border-cyan-500 transition-colors">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-100">Loan {truncateLoanId(request.id)}</span>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs ${
                            request.approved 
                              ? 'bg-teal-900 text-teal-300 border border-teal-500' 
                              : 'bg-yellow-900 text-yellow-300 border border-yellow-500'
                          }`}>
                            {request.approved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                        <div className="text-xs text-yellow-400">Votes: {request.votes}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-400">Borrower</p>
                          <p className="text-sm text-gray-200 font-mono">{truncateAddress(request.borrower)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Amount</p>
                          <p className="text-sm text-teal-400 font-medium">{request.amount} ETH</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Repayment Due</p>
                          <p className="text-sm text-gray-200">{request.repaymentDue}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Status</p>
                          <p className="text-sm text-gray-200">{request.paid ? 'Repaid' : 'Outstanding'}</p>
                        </div>
                      </div>
                      
                      {!request.approved && (
                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-600">
                          <button
                            onClick={() => handleVote(request.id)}
                            disabled={loading}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectLoan(request.id)}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8">
                  <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-300">No Pending Loans</h3>
                  <p className="mt-2 text-gray-400">There are currently no loan requests that need your vote.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>DeFi Credit DAO © 2025 - Running on Ethereum</p>
          <p className="mt-1">Contract Address: {truncateAddress(contractAddress)}</p>
        </footer>
      </div>
    </div>
  );
};

export default DAOPage;