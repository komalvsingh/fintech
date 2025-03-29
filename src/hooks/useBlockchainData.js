// src/hooks/useBlockchainData.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CreditScoreABI from '../lib/CreditScore.json';
import LoanContractABI from '../lib/LoanContract.json';
import DAOContractABI from '../lib/DAOContract.json';

export default function useBlockchainData() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [creditScoreContract, setCreditScoreContract] = useState(null);
  const [loanContract, setLoanContract] = useState(null);
  const [daoContract, setDaoContract] = useState(null);
  const [creditScore, setCreditScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Contract addresses - you'd need to replace these with actual deployed addresses
  const CREDIT_SCORE_ADDRESS = process.env.NEXT_PUBLIC_CREDIT_SCORE_ADDRESS;
  const LOAN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LOAN_CONTRACT_ADDRESS;
  const DAO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS;

  // Initialize contracts
  const initContracts = async () => {
    try {
      if (!window.ethereum) throw new Error("No Ethereum wallet found");
      
      // Updated to use ethers v6 syntax
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
      
      const signer = await provider.getSigner();
      setSigner(signer);
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      
      // Initialize contracts with the correct addresses
      if (CREDIT_SCORE_ADDRESS) {
        const creditScoreContract = new ethers.Contract(
          CREDIT_SCORE_ADDRESS,
          CreditScoreABI.abi,
          signer
        );
        setCreditScoreContract(creditScoreContract);
      }
      
      if (LOAN_CONTRACT_ADDRESS) {
        const loanContract = new ethers.Contract(
          LOAN_CONTRACT_ADDRESS,
          LoanContractABI.abi,
          signer
        );
        setLoanContract(loanContract);
        
        // Fetch credit score if available
        try {
          const score = await loanContract.getCreditScore();
          setCreditScore(Number(score));
        } catch (error) {
          console.log("Credit score not available yet:", error.message);
        }
      }
      
      if (DAO_CONTRACT_ADDRESS) {
        const daoContract = new ethers.Contract(
          DAO_CONTRACT_ADDRESS,
          DAOContractABI.abi,
          signer
        );
        setDaoContract(daoContract);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to initialize contracts:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Credit score functions
  const initializeCreditScore = async () => {
    try {
      if (!loanContract) throw new Error("Loan contract not initialized");
      
      const tx = await loanContract.initializeCreditScore();
      await tx.wait();
      const score = await loanContract.getCreditScore();
      setCreditScore(Number(score));
      return Number(score);
    } catch (error) {
      console.error("Failed to initialize credit score:", error);
      throw error;
    }
  };

  const getCreditScore = async (address = null) => {
    try {
      let score;
      if (address && creditScoreContract) {
        score = await creditScoreContract.getCreditScore(address);
      } else if (loanContract) {
        score = await loanContract.getCreditScore();
      } else {
        throw new Error("No contract available to get credit score");
      }
      setCreditScore(Number(score));
      return Number(score);
    } catch (error) {
      console.error("Failed to get credit score:", error);
      return null;
    }
  };

  // Loan functions
  const requestLoan = async (amount, duration) => {
    try {
      if (!loanContract) throw new Error("Loan contract not initialized");
      
      const tx = await loanContract.requestLoan(
        ethers.parseEther(amount.toString()),
        duration
      );
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to request loan:", error);
      throw error;
    }
  };

  const voteOnLoan = async (loanId, vote) => {
    try {
      if (!loanContract) throw new Error("Loan contract not initialized");
      
      const tx = await loanContract.voteOnLoan(loanId, vote);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to vote on loan:", error);
      throw error;
    }
  };

  const disburseLoan = async (loanId, amount) => {
    try {
      if (!loanContract) throw new Error("Loan contract not initialized");
      
      const tx = await loanContract.disburseLoan(loanId, {
        value: ethers.parseEther(amount.toString())
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to disburse loan:", error);
      throw error;
    }
  };

  const repayLoan = async (loanId, amount) => {
    try {
      if (!loanContract) throw new Error("Loan contract not initialized");
      
      // For ethers v6, we need to ensure amount is a BigInt if it's not already
      let value;
      if (typeof amount === 'string') {
        value = ethers.parseEther(amount);
      } else {
        value = amount; // Assume it's already a BigInt
      }
      
      const tx = await loanContract.repayLoan(loanId, {
        value: value
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to repay loan:", error);
      throw error;
    }
  };

  // Add getUserLoans function
  const getUserLoans = async (userAddress = null) => {
    try {
      if (!loanContract) throw new Error("Loan contract not initialized");
      
      const address = userAddress || account;
      if (!address) throw new Error("No address provided");
      
      // Call the getUserLoans function from the contract
      const loanIds = await loanContract.getUserLoans(address);
      return loanIds;
    } catch (error) {
      console.error("Failed to get user loans:", error);
      throw error;
    }
  };

  // Add getMultipleLoans function
  const getMultipleLoans = async (loanIds) => {
    try {
      if (!loanContract) throw new Error("Loan contract not initialized");
      if (!loanIds || loanIds.length === 0) return [];
      
      // Call the getMultipleLoans function from the contract
      const loans = await loanContract.getMultipleLoans(loanIds);
      return loans;
    } catch (error) {
      console.error("Failed to get multiple loans:", error);
      throw error;
    }
  };

  // DAO functions
  const requestDAOLoan = async (amount) => {
    try {
      if (!daoContract) throw new Error("DAO contract not initialized");
      
      const tx = await daoContract.requestLoan(
        ethers.parseEther(amount.toString())
      );
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to request DAO loan:", error);
      throw error;
    }
  };

  const voteForDAOLoan = async (requestId) => {
    try {
      if (!daoContract) throw new Error("DAO contract not initialized");
      
      const tx = await daoContract.voteForLoan(requestId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to vote for DAO loan:", error);
      throw error;
    }
  };

  const getLoanStatus = async (requestId) => {
    try {
      if (!daoContract) throw new Error("DAO contract not initialized");
      
      const status = await daoContract.getLoanStatus(requestId);
      return status;
    } catch (error) {
      console.error("Failed to get loan status:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      initContracts();
      
      // Set up event listeners for wallet changes
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
        initContracts();
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
  }, []);

  return {
    provider,
    signer,
    account,
    creditScoreContract,
    loanContract,
    daoContract,
    creditScore,
    loading,
    error,
    initializeCreditScore,
    getCreditScore,
    requestLoan,
    voteOnLoan,
    disburseLoan,
    repayLoan,
    getUserLoans,
    getMultipleLoans,
    requestDAOLoan,
    voteForDAOLoan,
    getLoanStatus
  };
}