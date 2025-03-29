"use client";
import React from "react";
import CreditScoreCard from "../../components/CreditScoreCard";

const CreditScorePage = () => {
  const contractAddress = "0x78522f1F905Ad6f0b679F064a79D48eBf24a57d4"; // Replace with deployed contract

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Your Credit Score</h2>
      <CreditScoreCard contractAddress={contractAddress} />
    </div>
  );
};

export default CreditScorePage;
