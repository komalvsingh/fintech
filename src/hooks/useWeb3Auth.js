// src/hooks/useWeb3Auth.js
"use client";
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const useWeb3Auth = () => {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const checkConnection = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return false;
    }

    try {
      // Fix: Use BrowserProvider instead of Web3Provider for ethers v6
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        setAccount(accounts[0]);
        setSigner(signer);
        setProvider(provider);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking connection:", error);
      setError(error.message || "Failed to check wallet connection");
      return false;
    }
  }, []);

  // Connect wallet
  // Connect wallet function - renamed from connect to connectWallet
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError("MetaMask is required to connect. Please install it.");
      return false;
    }

    setIsConnecting(true);
    setError(null);
    
    try {
      // Use BrowserProvider instead of Web3Provider for ethers v6
      const provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setAccount(address);
      setSigner(signer);
      setProvider(provider);
      return true;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError(error.message || "Failed to connect wallet");
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet (this doesn't actually disconnect MetaMask, 
  // but rather resets the state in your app)
  const disconnect = () => {
    setIsConnecting(false);
    setAccount(null);
    setSigner(null);
    return true;
  };

  // Switch network
  const switchNetwork = async (desiredChainId) => {
    try {
      if (!window.ethereum) throw new Error("No Ethereum wallet found");
      
      // Convert to hex if it's a number
      const chainIdHex = (typeof desiredChainId === 'number') 
        ? "0x" + desiredChainId.toString(16) 
        : desiredChainId;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      
      return true;
    } catch (error) {
      console.error("Error switching network:", error);
      setError(error.message);
      return false;
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Set up event listeners for wallet changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setIsConnecting(false);
          setAccount(null);
          setSigner(null);
        } else {
          // Account changed
          setAccount(accounts[0]);
          checkConnection();
        }
      });
      
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [checkConnection]); // Fix: Include checkConnection in dependencies

  return { 
    account, 
    signer, 
    provider,
    isConnecting,
    error,
    connectWallet  // Now this matches the function name
  };
};

export default useWeb3Auth;
