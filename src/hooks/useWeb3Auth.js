import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const useWeb3Auth = () => {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Use ethers.BrowserProvider for ethers v6
        const provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setAccount(address);
        setSigner(signer);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("MetaMask is required to connect. Please install it.");
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return { account, signer, connectWallet };
};

export default useWeb3Auth;