"use client";
import React, { createContext, useContext } from 'react';
import useWeb3Auth from '../hooks/useWeb3Auth';

// Create a context to hold the web3 values
export const Web3Context = createContext(null);

// Provider component that wraps your app
export function Web3Provider({ children }) {
  const web3Values = useWeb3Auth();
  
  return (
    <Web3Context.Provider value={web3Values}>
      {children}
    </Web3Context.Provider>
  );
}

// Custom hook to use the web3 context
export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === null) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}