"use client"; // Ensures it runs on the client side in Next.js

import React, { useState, useEffect } from "react";
import LoanABI from "../../artifacts/contracts/LoanContract.sol/LoanContract.json";
import useWeb3Auth from "../hooks/useWeb3Auth";

const LoanForm = ({ contractAddress }) => {
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [ethersLib, setEthersLib] = useState(null);
  const { signer } = useWeb3Auth(); // Hook to get the connected wallet signer

  // Dynamically load ethers library on client-side only
  useEffect(() => {
    const loadEthers = async () => {
      if (typeof window !== "undefined") {
        try {
          const ethersModule = await import("ethers");
          setEthersLib(ethersModule);
          console.log("Ethers v6 library loaded:", ethersModule);
        } catch (error) {
          console.error("Failed to load ethers:", error);
        }
      }
    };

    loadEthers();
  }, []);

  // Check if MetaMask is installed
  useEffect(() => {
    if (typeof window !== "undefined" && !window.ethereum) {
      console.warn("MetaMask is required to use this feature.");
    }
  }, []);

  const requestLoan = async () => {
    if (!ethersLib) {
      alert("Blockchain library is still loading. Please try again in a moment.");
      return;
    }

    if (!signer) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!contractAddress) {
      alert("Contract address is not configured!");
      return;
    }

    try {
      // Validate inputs before sending transaction
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        alert("Please enter a valid amount.");
        return;
      }

      if (!duration || isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
        alert("Please enter a valid duration in days.");
        return;
      }

      // Create contract instance - ethers v6 syntax
      const contract = new ethersLib.Contract(
        contractAddress, 
        LoanABI.abi, 
        signer
      );

      // Convert amount to Wei - ethers v6 uses parseUnits instead of parseEther
      const amountInWei = ethersLib.parseEther(amount.toString());
      const durationInDays = parseInt(duration);

      // Send transaction
      const tx = await contract.requestLoan(amountInWei, durationInDays);

      alert("Transaction submitted! Waiting for confirmation...");
      await tx.wait(); // Wait for transaction confirmation

      alert("Loan Requested Successfully!");

      // Reset form
      setAmount("");
      setDuration("");
    } catch (error) {
      console.error("Loan request failed:", error);
      alert(`Error: ${error.message || "Unknown error occurred"}`);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="mb-4 font-medium">Request a Loan</h3>
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <input
          type="text"
          placeholder="Amount (ETH)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Duration (days)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="p-2 border rounded"
        />
        <button
          onClick={requestLoan}
          disabled={!ethersLib || !signer}
          className="p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Apply for Loan
        </button>
      </div>
    </div>
  );
};

export default LoanForm;