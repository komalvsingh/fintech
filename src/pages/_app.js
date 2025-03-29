import { useEffect } from 'react';
import '../app/globals.css';

// Create a simple Web3 context provider
import { createContext, useState, useContext } from 'react';
import { ethers } from 'ethers';

// Create Web3 context
const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeWeb3 = async () => {
      // Check if window is defined (browser environment)
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Use BrowserProvider instead of Web3Provider for ethers v6
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          
          // Get accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            setAccount(accounts[0]);
            setSigner(signer);
            setIsConnected(true);
          }
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', (newAccounts) => {
            if (newAccounts.length > 0) {
              setAccount(newAccounts[0]);
              provider.getSigner().then(setSigner);
              setIsConnected(true);
            } else {
              setAccount(null);
              setSigner(null);
              setIsConnected(false);
            }
          });
        } catch (error) {
          console.error("Failed to initialize Web3:", error);
        }
      }
    };
    
    initializeWeb3();
    
    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        setAccount(accounts[0]);
        setSigner(signer);
        setProvider(provider);
        setIsConnected(true);
        
        return true;
      } catch (error) {
        console.error("Error connecting wallet:", error);
        return false;
      }
    } else {
      console.error("Ethereum object not found, install MetaMask.");
      return false;
    }
  };

  return (
    <Web3Context.Provider value={{ account, signer, provider, isConnected, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
}

// Custom hook to use the Web3 context
export function useWeb3() {
  return useContext(Web3Context);
}

// Create a simple notification component
function CreditScoreNotification({ contractAddress }) {
  const { account, isConnected } = useWeb3();
  
  if (!isConnected || !account) {
    return null;
  }
  
  return (
    <div className="bg-yellow-100 p-3 text-sm border-b border-yellow-200">
      <div className="container mx-auto">
        <span>You need to initialize your credit score to apply for loans. </span>
        <a href="/credit-score" className="text-blue-600 hover:text-blue-800 underline font-medium">
          Initialize now
        </a>
      </div>
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  // You'll need to replace this with your actual contract address
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x23187E285929405A9E28eAEa245efc22dbbD8C61";

  return (
    <Web3Provider>
      <CreditScoreNotification contractAddress={contractAddress} />
      <Component {...pageProps} />
    </Web3Provider>
  );
}

export default MyApp;