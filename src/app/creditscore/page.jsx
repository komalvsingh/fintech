"use client";
import React from "react";
import CreditScoreCard from "../../components/CreditScoreCard";

const CreditScorePage = () => {
  const contractAddress = "0x85b27c7631B8985001c8a5E3F18f3f9841A75e4E"; // Replace with deployed contract

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Your Credit Score</h2>
      <CreditScoreCard contractAddress={contractAddress} />
    </div>
  );
};

export default CreditScorePage;
