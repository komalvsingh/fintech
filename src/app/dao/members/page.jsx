"use client";
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import DAOContractABI from '../../../lib/DAOContract.json';

const DAOMembersPage = () => {
  const daoContractAddress = "0x123456789..."; // Replace with your deployed DAO contract address
  
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

  // Fetch all members
  const fetchMembers = async () => {
    if (!signer) return;
    
    setIsLoading(true);
    
    try {
      const contract = new ethers.Contract(
        daoContractAddress,
        DAOContractABI.abi,
        signer
      );
      
      // Since the contract doesn't have a function to get all members,
      // we'll need to check recent blockchain events or implement a different approach
      // This is a simplified approach for demo purposes
      
      const memberList = [];
      // In a real implementation, you might use events or a different data structure
      // For now, we'll just add the owner
      const ownerAddress = await contract.owner();
      memberList.push(ownerAddress);
      
      setMembers(memberList);
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("Failed to fetch DAO members");
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
      
      setSuccess(`Successfully added ${newMemberAddress} to the DAO`);
      setNewMemberAddress('');
      
      // Refresh the member list
      fetchMembers();
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
    
    checkConnection();
    
    // Setup event listeners for account changes
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          connectWallet().then(() => checkOwnership());
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
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">DAO Member Management</h2>
      
      {!isConnected ? (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-gray-600 mb-4">Please connect your wallet to manage DAO members.</p>
          <button
            onClick={connectWallet}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full"
          >
            Connect Wallet
          </button>
        </div>
      ) : !isOwner ? (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-yellow-600">Only the DAO owner can manage members.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Member Form */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4">Add New Member</h3>
            
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
            
            <form onSubmit={addMember}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="memberAddress">
                  Member Ethereum Address
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
                disabled={isLoading}
                className={`${
                  isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white px-4 py-2 rounded-md text-sm font-medium w-full`}
              >
                {isLoading ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          </div>
          
          {/* Member List */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4">Current Members</h3>
            
            {isLoading ? (
              <p className="text-gray-600">Loading members...</p>
            ) : members.length > 0 ? (
              <ul className="space-y-2">
                {members.map((address, index) => (
                  <li key={index} className="border p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm truncate">{address}</span>
                      {address.toLowerCase() === account?.toLowerCase() && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">You</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No members found.</p>
            )}
            
            <button
              onClick={fetchMembers}
              className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium w-full"
            >
              Refresh Members
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DAOMembersPage;