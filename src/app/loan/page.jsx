"use client";
import React from "react";
import LoanForm from "../../components/LoanForm";
import dotenv from "dotenv";
dotenv.config();

const LoanPage = () => {
  const contractAddress = "0x860B55A2018d591378ceF13A4624fcc67373A3a1"; // Replace with deployed contract

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Apply for a Loan</h2>
      <LoanFormWrapper contractAddress={contractAddress} />
    </div>
  );
};

// Create a wrapper component to handle the object returned by LoanForm
const LoanFormWrapper = ({ contractAddress }) => {
  // Assuming LoanForm is a hook or function that returns {data, loading, error}
  const result = LoanForm({ contractAddress });
  
  if (!result) return <p>No loan form data available</p>;
  
  const { data, loading, error } = result;
  
  if (loading) return <p>Loading loan form...</p>;
  if (error) return <p className="text-red-500">Error: {error.message || String(error)}</p>;
  if (data) {
    return (
      <div className="mt-4">
        {/* Render your loan form data here */}
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
  
  return <p>No loan form data found</p>;
};

export default LoanPage;
