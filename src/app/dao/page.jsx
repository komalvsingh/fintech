"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import DAOContractABI from "../../lib/DAOContract.json";

const DAOPage = () => {
  const contractAddress = "0x59A139652C16982cec62120854Ffa231f36B2AAD"; // Replace with your deployed DAO contract address
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loanRequests, setLoanRequests] = useState([]);
  const [newMemberAddress, setNewMemberAddress] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
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
      
      const requestCount = await contract.requestCount();
      const requests = [];
      
      for (let i = 1; i <= requestCount; i++) {
        const request = await contract.loanRequests(i);
        requests.push({
          id: i,
          borrower: request.borrower,
          amount: ethers.formatEther(request.amount),
          approved: request.approved,
          votes: Number(request.votes)
        });
      }
      
      setLoanRequests(requests);
    } catch (err) {
      console.error("Error fetching loan requests:", err);
      setError("Failed to fetch loan requests");
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

  // Request a loan
  const handleRequestLoan = async (e) => {
    e.preventDefault();
    
    if (!signer) return;
    if (!loanAmount || isNaN(parseFloat(loanAmount)) || parseFloat(loanAmount) <= 0) {
      setError("Please enter a valid loan amount");
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
      
      // Convert to wei
      const amountInWei = ethers.parseEther(loanAmount);
      
      // First check if the transaction would succeed by estimating gas
      try {
        await contract.requestLoan.estimateGas(amountInWei);
      } catch (estimateError) {
        console.error("Gas estimation failed:", estimateError);
        setError("Transaction would fail: " + (estimateError.reason || "Please check your inputs and try again"));
        setLoading(false);
        return;
      }
      
      // If gas estimation succeeds, proceed with the transaction
      const tx = await contract.requestLoan(amountInWei, {
        gasLimit: 300000 // Set a reasonable gas limit
      });
      
      await tx.wait();
      
      setSuccess("Loan request submitted successfully");
      setLoanAmount("");
      
      // Refresh loan requests
      fetchLoanRequests();
    } catch (err) {
      console.error("Error requesting loan:", err);
      setError(err.message || "Failed to request loan");
    } finally {
      setLoading(false);
    }
  };

  // Vote for a loan
  const handleVote = async (requestId) => {
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
      
      // Check if the loan request exists and is not already approved
      try {
        const loanRequest = await contract.loanRequests(requestId);
        if (loanRequest.approved) {
          setError("This loan request is already approved");
          setLoading(false);
          return;
        }
      } catch (checkError) {
        console.error("Error checking loan request:", checkError);
        setError("Failed to check loan request status");
        setLoading(false);
        return;
      }
      
      // First check if the transaction would succeed by estimating gas
      try {
        await contract.voteForLoan.estimateGas(requestId);
      } catch (estimateError) {
        console.error("Gas estimation failed:", estimateError);
        setError("Transaction would fail: " + (estimateError.reason || "You may have already voted for this loan"));
        setLoading(false);
        return;
      }
      
      // If gas estimation succeeds, proceed with the transaction
      const tx = await contract.voteForLoan(requestId, {
        gasLimit: 300000 // Set a reasonable gas limit
      });
      
      await tx.wait();
      
      setSuccess(`Vote submitted for request #${requestId}`);
      
      // Refresh loan requests
      fetchLoanRequests();
    } catch (err) {
      console.error("Error voting:", err);
      setError(err.message || "Failed to vote");
    } finally {
      setLoading(false);
    }
  };

  // Truncate address for display
  const truncateAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (!isConnected) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">DeFi Credit DAO</h2>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-gray-600 mb-4">Please connect your wallet to interact with the DAO.</p>
          <button
            onClick={connectWallet}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">DeFi Credit DAO</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{success}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div>
          {/* DAO Status */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">Your DAO Status</h3>
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isMember ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p>{isMember ? 'You are a DAO member' : 'You are not a DAO member'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOwner ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <p>{isOwner ? 'You are the DAO owner' : 'You are not the DAO owner'}</p>
            </div>
          </div>
          
          {/* Request Loan Form */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-4">Request a Loan</h3>
            <form onSubmit={handleRequestLoan}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="loanAmount">
                  Loan Amount (ETH)
                </label>
                <input
                  id="loanAmount"
                  type="text"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="0.1"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`${
                  loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white px-4 py-2 rounded-md text-sm font-medium w-full`}
              >
                {loading ? 'Processing...' : 'Submit Loan Request'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Right column */}
        <div>
          {/* Add Member Form (only for owner) */}
          {isOwner && (
            <div className="bg-white p-6 rounded-xl shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-4">Add DAO Member</h3>
              <form onSubmit={handleAddMember}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="memberAddress">
                    Member Address
                  </label>
                  <input
                    id="memberAddress"
                    type="text"
                    value={newMemberAddress}
                    onChange={(e) => setNewMemberAddress(e.target.value)}
                    placeholder="0x..."
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`${
                    loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white px-4 py-2 rounded-md text-sm font-medium w-full`}
                >
                  {loading ? 'Processing...' : 'Add Member'}
                </button>
              </form>
            </div>
          )}
          
          {/* Loan Requests (only for members) */}
          {isMember && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Loan Requests</h3>
                <button
                  onClick={fetchLoanRequests}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  Refresh
                </button>
              </div>
              
              {loading ? (
                <p className="text-gray-600">Loading loan requests...</p>
              ) : loanRequests.length > 0 ? (
                <div className="space-y-4">
                  {loanRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Request #{request.id}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          request.approved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-gray-500">Borrower</p>
                          <p>{truncateAddress(request.borrower)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p>{request.amount} ETH</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Votes</p>
                          <p>{request.votes}</p>
                        </div>
                      </div>
                      {!request.approved && (
                        <button
                          onClick={() => handleVote(request.id)}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full"
                        >
                          Vote to Approve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No loan requests found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DAOPage;