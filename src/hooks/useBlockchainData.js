import { useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import CreditScoreABI from "../lib/CreditScore.json";
import LoanContractABI from "../lib/LoanContract.json";
import DAOContractABI from "../lib/DAOContract.json";

const useBlockchainData = (contractAddress, method, params = []) => {
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
        } else if (method === "requestLoan" || method === "voteOnLoan" || method === "disburseLoan" || method === "repayLoan" || method === "loans") {
          contractABI = LoanContractABI.abi;
        } else if (method === "getLoanStatus" || method === "voteForLoan") {
          contractABI = DAOContractABI.abi;
        } else {
          // Instead of throwing an error, try to determine appropriate ABI
          // Default to LoanContractABI if unsure
          contractABI = LoanContractABI.abi;
          console.warn(`Method '${method}' not explicitly mapped to an ABI, using LoanContractABI`);
        }

        // Create contract instance and call method - updated for ethers v6
        const contract = new Contract(contractAddress, contractABI, signer);
        
        // Get user address - updated for ethers v6
        const userAddress = await signer.getAddress();
        
        // Call contract method based on what it is
        let result;
        
        // Check if method exists on contract
        if (typeof contract[method] !== 'function') {
          setError(`Method '${method}' does not exist on the contract`);
          setLoading(false);
          return;
        }
        
        // Handle methods based on your contract
        switch(method) {
          case "getCreditScore":
            result = await contract[method](userAddress);
            break;
            
          case "requestLoan":
            // From your contract: function requestLoan(uint256 amount, uint256 duration)
            if (params.length >= 2) {
              // If parameters are provided, use them
              result = await contract[method](params[0], params[1]);
            } else {
              // Backward compatibility with your original code
              result = await contract[method]();
            }
            break;
            
          case "voteOnLoan":
            // From your contract: function voteOnLoan(uint256 loanId, bool vote)
            result = await contract[method](params[0], params[1]);
            break;
            
          case "disburseLoan":
            // From your contract: function disburseLoan(uint256 loanId)
            result = await contract[method](params[0]);
            break;
            
          case "repayLoan":
            // From your contract: function repayLoan(uint256 loanId)
            if (params.length >= 2) {
              // If payment amount is provided
              result = await contract[method](params[0], { value: params[1] });
            } else {
              result = await contract[method](params[0]);
            }
            break;
            
          case "loans":
            // For accessing the loans mapping
            result = await contract[method](params[0]);
            break;
            
          case "getLoanStatus":
            // Original method from your code
            result = await contract[method](userAddress);
            break;
            
          default:
            // Generic method call with spread parameters
            result = await contract[method](...params);
        }

        // Handle transaction response
        if (result && result.wait) {
          // This is a transaction, wait for confirmation
          const receipt = await result.wait();
          setData(receipt);
        } else {
          // This is a call that returns data
          setData(result);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blockchain data:", error);
        setError(error.message || "Error connecting to blockchain");
        setLoading(false);
      }
    };

    fetchData();
  }, [contractAddress, method, JSON.stringify(params)]);

  return { data, loading, error };
};

export default useBlockchainData;