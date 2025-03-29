import { useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import CreditScoreABI from "../../artifacts/contracts/CreditScore.sol/CreditScore.json";
import LoanContractABI from "../../artifacts/contracts/LoanContract.sol/LoanContract.json";
import DAOContractABI from "../../artifacts/contracts/DAOContract.sol/DAOContract.json";

const useBlockchainData = (contractAddress, method) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!contractAddress) {
        setError("Contract address is required");
        setLoading(false);
        return;
      }

      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      try {
        // Check if ethereum object exists
        if (!window.ethereum) {
          setError("MetaMask not installed. Please install MetaMask to use this application.");
          setLoading(false);
          return;
        }

        // Request account access if needed
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider and signer - updated for ethers v6
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Select correct ABI based on method
        let contractABI;
        if (method === "getCreditScore") {
          contractABI = CreditScoreABI.abi;
        } else if (method === "requestLoan") {
          contractABI = LoanContractABI.abi;
        } else if (method === "getLoanStatus" || method === "voteForLoan") {
          contractABI = DAOContractABI.abi;
        } else {
          throw new Error("Invalid method name");
        }

        // Create contract instance and call method - updated for ethers v6
        const contract = new Contract(contractAddress, contractABI, signer);
        
        // Get user address - updated for ethers v6
        const userAddress = await signer.getAddress();
        
        // Call contract method - handle different parameter requirements
        let result;
        if (method === "getCreditScore") {
          result = await contract[method](userAddress);
        } else if (method === "requestLoan") {
          result = await contract[method](); // Assuming no parameters needed or they're passed separately
        } else if (method === "getLoanStatus") {
          // Assumes loan ID is passed separately
          result = await contract[method](userAddress);
        }

        setData(result ? result.toString() : null);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blockchain data:", error);
        setError(error.message || "Error connecting to blockchain");
        setLoading(false);
      }
    };

    fetchData();
  }, [contractAddress, method]);

  return { data, loading, error };
};

export default useBlockchainData;