"use client";
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import DAOContractABI from '../../../lib/DAOContract.json';

const DAOMembersPage = () => {
  const daoContractAddress = "0x59A139652C16982cec62120854Ffa231f36B2AAD";
  
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Check if user is the DAO owner
  const checkOwnership = async () => {
    if (!signer) return;
    
    try {
      const contract = new ethers.Contract(
        daoContractAddress,
        DAOContractABI.abi,
        signer
      );
      
      const ownerAddress = await contract.owner();
      const currentAddress = await signer.getAddress();
      
      setIsOwner(ownerAddress.toLowerCase() === currentAddress.toLowerCase());
    } catch (err) {
      console.error("Error checking ownership:", err);
    }
  };

  // Optimized approach for fetching members
  const fetchMembers = async () => {
    if (!signer) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(
        daoContractAddress,
        DAOContractABI.abi,
        signer
      );
      
      // Get cached members first to show something immediately
      const cachedMembersStr = localStorage.getItem('daoMembers');
      if (cachedMembersStr) {
        try {
          const cachedMembers = JSON.parse(cachedMembersStr);
          setMembers(cachedMembers);
        } catch (parseError) {
          console.error("Error parsing cached members:", parseError);
        }
      }
      
      // Since getMemberCount doesn't exist, we'll use events directly
      try {
        const provider = contract.runner.provider;
        const currentBlock = await provider.getBlockNumber();
        // Only look back ~10000 blocks (roughly 1-2 days) to speed up query
        const fromBlock = Math.max(0, currentBlock - 10000);
        
        const filter = contract.filters.MemberAdded();
        const events = await contract.queryFilter(filter, fromBlock, currentBlock);
        
        // Get owner address
        const ownerAddress = await contract.owner();
        
        // Combine with existing cached members for completeness
        const memberSet = new Set();
        memberSet.add(ownerAddress);  // Always include owner
        
        events.forEach(event => {
          if (event.args && event.args.member) {
            memberSet.add(event.args.member);
          }
        });
        
        // Add cached members
        if (cachedMembersStr) {
          try {
            const cachedMembers = JSON.parse(cachedMembersStr);
            cachedMembers.forEach(member => memberSet.add(member));
          } catch (parseError) {
            console.error("Error parsing cached members:", parseError);
          }
        }
        
        const memberList = [...memberSet];
        
        // Check each address to verify they are actually members
        const verifiedMembers = [];
        for (const address of memberList) {
          try {
            const isMember = await contract.members(address);
            if (isMember) {
              verifiedMembers.push(address);
            }
          } catch (err) {
            console.error(`Error verifying member ${address}:`, err);
          }
        }
        
        setMembers(verifiedMembers);
        
        // Update cache
        localStorage.setItem('daoMembers', JSON.stringify(verifiedMembers));
      } catch (err) {
        console.error("Error fetching members with events:", err);
        throw err;
      }
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("Failed to fetch DAO members. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new member
  const addMember = async (e) => {
    e.preventDefault();
    
    if (!signer || !isOwner) {
      setError("You must be the DAO owner to add members");
      return;
    }
    
    if (!ethers.isAddress(newMemberAddress)) {
      setError("Please enter a valid Ethereum address");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const contract = new ethers.Contract(
        daoContractAddress,
        DAOContractABI.abi,
        signer
      );
      
      const tx = await contract.addMember(newMemberAddress);
      await tx.wait();
      
      // Add the new member to our local state immediately
      setMembers(prevMembers => {
        const lowerNewMember = newMemberAddress.toLowerCase();
        if (!prevMembers.some(addr => addr.toLowerCase() === lowerNewMember)) {
          const updatedMembers = [...prevMembers, newMemberAddress];
          
          // Cache members in local storage
          try {
            localStorage.setItem('daoMembers', JSON.stringify(updatedMembers));
          } catch (cacheError) {
            console.error("Error caching members:", cacheError);
          }
          
          return updatedMembers;
        }
        return prevMembers;
      });
      
      setSuccess(`Successfully added ${newMemberAddress} to the DAO`);
      setNewMemberAddress('');
    } catch (err) {
      console.error("Error adding member:", err);
      setError(err.message || "Failed to add member to DAO");
    } finally {
      setIsLoading(false);
    }
  };

  // Check connection and ownership on load
  useEffect(() => {
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
    
    // Load cached members if available
    const cachedMembersStr = localStorage.getItem('daoMembers');
    if (cachedMembersStr) {
      try {
        const cachedMembers = JSON.parse(cachedMembersStr);
        setMembers(cachedMembers);
      } catch (parseError) {
        console.error("Error parsing cached members:", parseError);
      }
    }
    
    checkConnection();
    
    // Setup event listeners for account changes
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          connectWallet().then(() => {
            checkOwnership();
            fetchMembers();
          });
        } else {
          setAccount(null);
          setSigner(null);
          setIsConnected(false);
          setIsOwner(false);
        }
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  // Check ownership and fetch members when connected
  useEffect(() => {
    if (isConnected && signer) {
      checkOwnership();
      fetchMembers();
    }
  }, [isConnected, signer]);

  return (
    <div className="min-h-screen bg-gray-900 text-white transition-colors duration-200 mt-10">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">DAO Member Management</h2>
        </div>
        
        {!isConnected ? (
          <div className="bg-gray-800 shadow-lg p-6 rounded-xl transition-all duration-200">
            <p className="text-gray-300 mb-4">
              Please connect your wallet to manage DAO members.
            </p>
            <button
              onClick={connectWallet}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full transition-colors duration-200"
            >
              Connect Wallet
            </button>
          </div>
        ) : !isOwner ? (
          <div className="bg-gray-800 shadow-lg p-6 rounded-xl transition-all duration-200">
            <p className="text-yellow-500">Only the DAO owner can manage members.</p>
            <p className="mt-2 text-gray-300">
              Connected as: <span className="font-mono">{account}</span>
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 shadow-lg p-4 rounded-xl mb-6 transition-all duration-200">
              <p className="text-gray-300">
                Connected as: <span className="font-mono">{account}</span>
                <span className="ml-2 inline-block bg-green-600 text-white text-xs px-2 py-1 rounded">Owner</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add Member Form */}
              <div className="bg-gray-800 shadow-lg p-6 rounded-xl transition-all duration-200">
                <h3 className="text-xl font-semibold mb-4">Add New Member</h3>
                
                {error && (
                  <div className="bg-red-900/30 border-red-700 text-red-400 border px-4 py-3 rounded mb-4">
                    <p>{error}</p>
                  </div>
                )}
                
                {success && (
                  <div className="bg-green-900/30 border-green-700 text-green-400 border px-4 py-3 rounded mb-4">
                    <p>{success}</p>
                  </div>
                )}
                
                <form onSubmit={addMember}>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" htmlFor="memberAddress">
                      Member Ethereum Address
                    </label>
                    <input
                      id="memberAddress"
                      type="text"
                      value={newMemberAddress}
                      onChange={(e) => setNewMemberAddress(e.target.value)}
                      placeholder="0x..."
                      className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white focus:border-teal-500"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`${
                      isLoading ? 'bg-teal-700/50' : 'bg-teal-600 hover:bg-teal-700 text-white'
                    } px-4 py-2 rounded-md text-sm font-medium w-full transition-colors duration-200`}
                  >
                    {isLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </form>
              </div>
              
              {/* Member List */}
              <div className="bg-gray-800 shadow-lg p-6 rounded-xl transition-all duration-200">
                <h3 className="text-xl font-semibold mb-4">Current Members</h3>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                    <p className="ml-2">Loading members...</p>
                  </div>
                ) : members.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {members.map((address, index) => (
                      <div key={index} className="border-gray-700 bg-gray-700 p-3 rounded-lg transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm truncate">{address}</span>
                          {address.toLowerCase() === account?.toLowerCase() && (
                            <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded ml-2">You</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-300">No members found.</p>
                )}
                
                <button
                  onClick={fetchMembers}
                  className="mt-4 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md text-sm font-medium w-full transition-colors duration-200"
                >
                  Refresh Members
                </button>
              </div>
            </div>
          </>
        )}
        
        {/* Add this after the member management section */}
        {isConnected && (
          <div className="mt-8">
            <div className="bg-gray-800 shadow-lg p-6 rounded-xl transition-all duration-200">
              <h3 className="text-xl font-semibold mb-4">Pending Loans</h3>
              
              {error && (
                <div className="bg-red-900/30 border-red-700 text-red-400 border px-4 py-3 rounded mb-4">
                  <p>{error}</p>
                </div>
              )}
              
              {success && (
                <div className="bg-green-900/30 border-green-700 text-green-400 border px-4 py-3 rounded mb-4">
                  <p>{success}</p>
                </div>
              )}
              
              <button
                onClick={fetchPendingLoans}
                className="mb-4 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Refresh Pending Loans
              </button>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                  <p className="ml-2">Loading loans...</p>
                </div>
              ) : pendingLoans && pendingLoans.length > 0 ? (
                <div className="space-y-4">
                  {pendingLoans.map((loan, index) => (
                    <div key={index} className="border border-gray-700 bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Loan ID: {loan.id.toString().substring(0, 8)}...</span>
                        <span className="bg-yellow-900/60 text-yellow-300 text-xs px-2 py-1 rounded">
                          {loan.voteCount}/{requiredVotes} Votes
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-gray-400">Borrower</p>
                          <p className="font-mono text-xs truncate">{loan.borrower}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Amount</p>
                          <p>{loan.amount} ETH</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Due Date</p>
                          <p>{new Date(loan.repaymentDue * 1000).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => voteOnLoan(loan.id)}
                          disabled={isLoading || loan.hasVoted}
                          className={`${
                            isLoading || loan.hasVoted
                              ? 'bg-green-800/30 cursor-not-allowed'
                              : 'bg-green-700 hover:bg-green-600'
                          } text-white px-3 py-1.5 rounded text-sm font-medium flex-1 transition-colors duration-200`}
                        >
                          {loan.hasVoted ? 'Already Voted' : 'Approve'}
                        </button>
                        
                        <button
                          onClick={() => rejectLoan(loan.id)}
                          disabled={isLoading || loan.hasVoted}
                          className={`${
                            isLoading || loan.hasVoted
                              ? 'bg-red-800/30 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600'
                          } text-white px-3 py-1.5 rounded text-sm font-medium flex-1 transition-colors duration-200`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No pending loans to approve.</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
    </div>
  );
};

export default DAOMembersPage;

// Add these state variables at the top with your other state variables
const [pendingLoans, setPendingLoans] = useState([]);
const [requiredVotes, setRequiredVotes] = useState(3);

// Add this function to fetch pending loans
const fetchPendingLoans = async () => {
  if (!signer) return;
  
  setIsLoading(true);
  setError(null);
  
  try {
    const contract = new ethers.Contract(
      daoContractAddress,
      DAOContractABI.abi,
      signer
    );
    
    // Get required votes
    try {
      const votes = await contract.requiredVotes();
      setRequiredVotes(Number(votes));
    } catch (err) {
      console.error("Error fetching required votes:", err);
    }
    
    // Get pending loan IDs
    const pendingLoanIds = await contract.getPendingLoans();
    console.log("Pending loan IDs:", pendingLoanIds);
    
    if (pendingLoanIds.length === 0) {
      setPendingLoans([]);
      setIsLoading(false);
      return;
    }
    
    // Get current user address
    const userAddress = await signer.getAddress();
    
    // Fetch details for each loan
    const loanDetailsPromises = pendingLoanIds.map(async (loanId) => {
      try {
        const details = await contract.getLoanDetails(loanId);
        const hasVoted = await contract.hasUserVoted(loanId, userAddress);
        
        return {
          id: loanId,
          borrower: details.borrower,
          amount: ethers.formatEther(details.amount),
          repaymentDue: Number(details.repaymentDue),
          isApproved: details.isApproved,
          isPaid: details.isPaid,
          voteCount: Number(details.voteCount),
          hasVoted: hasVoted
        };
      } catch (err) {
        console.error(`Error fetching details for loan ${loanId}:`, err);
        return null;
      }
    });
    
    const loanDetails = await Promise.all(loanDetailsPromises);
    const validLoans = loanDetails.filter(loan => loan !== null);
    
    console.log("Fetched loan details:", validLoans);
    setPendingLoans(validLoans);
    
  } catch (err) {
    console.error("Error fetching pending loans:", err);
    setError("Failed to fetch pending loans: " + (err.message || "Unknown error"));
  } finally {
    setIsLoading(false);
  }
};

// Add this function to vote on a loan
const voteOnLoan = async (loanId) => {
  if (!signer) {
    setError("Please connect your wallet first");
    return;
  }
  
  setIsLoading(true);
  setError(null);
  setSuccess(null);
  
  try {
    const contract = new ethers.Contract(
      daoContractAddress,
      DAOContractABI.abi,
      signer
    );
    
    console.log(`Voting on loan ${loanId}...`);
    
    // First check if the user is a member
    const userAddress = await signer.getAddress();
    const isMember = await contract.members(userAddress);
    if (!isMember) {
      setError("You must be a DAO member to vote on loans");
      setIsLoading(false);
      return;
    }
    
    // Check if user has already voted
    const hasVoted = await contract.hasUserVoted(loanId, userAddress);
    if (hasVoted) {
      setError("You have already voted on this loan");
      setIsLoading(false);
      return;
    }
    
    // Use the voteOnLoan function with proper parameters
    const tx = await contract.voteOnLoan(loanId, true, {
      gasLimit: 500000 // Increase gas limit to prevent out of gas errors
    });
    
    console.log("Transaction sent:", tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
    
    setSuccess(`Successfully voted on loan ${loanId}`);
    
    // Refresh the pending loans list
    setTimeout(() => {
      fetchPendingLoans();
    }, 2000);
    
  } catch (err) {
    console.error("Error voting on loan:", err);
    
    // Provide more helpful error messages
    if (err.message.includes("execution reverted")) {
      setError("Transaction reverted: " + (err.reason || "Unknown reason. This could be because the loan is already approved or you don't have permission."));
    } else if (err.message.includes("user rejected")) {
      setError("Transaction was rejected in your wallet.");
    } else {
      setError(err.message || "Failed to vote on loan");
    }
  } finally {
    setIsLoading(false);
  }
};

// Add this function to reject a loan
const rejectLoan = async (loanId) => {
  if (!signer) {
    setError("Please connect your wallet first");
    return;
  }
  
  setIsLoading(true);
  setError(null);
  setSuccess(null);
  
  try {
    const contract = new ethers.Contract(
      daoContractAddress,
      DAOContractABI.abi,
      signer
    );
    
    console.log(`Rejecting loan ${loanId}...`);
    
    // Check if the user is a member
    const userAddress = await signer.getAddress();
    const isMember = await contract.members(userAddress);
    if (!isMember) {
      setError("You must be a DAO member to reject loans");
      setIsLoading(false);
      return;
    }
    
    // Use the rejectLoan function
    const tx = await contract.rejectLoan(loanId, {
      gasLimit: 500000 // Increase gas limit
    });
    
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
    
    setSuccess(`Successfully rejected loan ${loanId}`);
    
    // Refresh the pending loans list
    setTimeout(() => {
      fetchPendingLoans();
    }, 2000);
    
  } catch (err) {
    console.error("Error rejecting loan:", err);
    setError(err.message || "Failed to reject loan");
  } finally {
    setIsLoading(false);
  }
};

// Update your useEffect to also fetch pending loans when connected
useEffect(() => {
  if (isConnected && signer) {
    checkOwnership();
    fetchMembers();
    fetchPendingLoans(); // Add this line
  }
}, [isConnected, signer]);