"use client";
import React from "react";
import LoanForm from "../../components/LoanForm";
import dotenv from "dotenv";
dotenv.config();

const LoanPage = () => {
  const contractAddress = "0x9549E4495372831f8A85936a7834F9D587d971ff"; // Replace with deployed contract

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Apply for a Loan</h2>
      <LoanForm contractAddress={contractAddress} />
    </div>
  );
};

export default LoanPage;
