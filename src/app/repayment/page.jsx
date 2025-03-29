"use client";
import React from "react";
import RepaymentStatus from "@/components/RepaymentStatus";

const RepaymentPage = () => {
  const contractAddress = "0x9549E4495372831f8A85936a7834F9D587d971ff"; // Replace with deployed contract

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Repayment Status</h2>
      <RepaymentStatus contractAddress={contractAddress} />
    </div>
  );
};

export default RepaymentPage;
