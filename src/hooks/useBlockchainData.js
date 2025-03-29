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
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
      
      const signer = provider.getSigner();
      setSigner(signer);
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      
      const creditScoreContract = new ethers.Contract(
        CREDIT_SCORE_ADDRESS,
        CreditScoreABI.abi,
        signer
      );
      setCreditScoreContract(creditScoreContract);
      
      const loanContract = new ethers.Contract(
        LOAN_CONTRACT_ADDRESS,
        LoanContractABI.abi,
        signer
      );
      setLoanContract(loanContract);
      
      const daoContract = new ethers.Contract(
        DAO_CONTRACT_ADDRESS,
        DAOContractABI.abi,
        signer
      );
      setDaoContract(daoContract);
      
      // Fetch credit score if available
      try {
        const score = await loanContract.getCreditScore();
        setCreditScore(score.toNumber());
      } catch (error) {
        console.log("Credit score not available yet:", error.message);
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
      const tx = await loanContract.initializeCreditScore();
      await tx.wait();
      const score = await loanContract.getCreditScore();
      setCreditScore(score.toNumber());
      return score.toNumber();
    } catch (error) {
      console.error("Failed to initialize credit score:", error);
      throw error;
    }
  };

  const getCreditScore = async (address = null) => {
    try {
      let score;
      if (address) {
        score = await creditScoreContract.getCreditScore(address);
      } else {
        score = await loanContract.getCreditScore();
      }
      setCreditScore(score.toNumber());
      return score.toNumber();
    } catch (error) {
      console.error("Failed to get credit score:", error);
      return null;
    }
  };

  // Loan functions
  const requestLoan = async (amount, duration) => {
    try {
      const tx = await loanContract.requestLoan(
        ethers.utils.parseEther(amount.toString()),
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
      const tx = await loanContract.disburseLoan(loanId, {
        value: ethers.utils.parseEther(amount.toString())
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
      const tx = await loanContract.repayLoan(loanId, {
        value: ethers.utils.parseEther(amount.toString())
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to repay loan:", error);
      throw error;
    }
  };

  // DAO functions
  const requestDAOLoan = async (amount) => {
    try {
      const tx = await daoContract.requestLoan(
        ethers.utils.parseEther(amount.toString())
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
    requestDAOLoan,
    voteForDAOLoan,
    getLoanStatus
  };
}