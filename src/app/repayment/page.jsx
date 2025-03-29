"use client";
import React from "react";
import RepaymentStatus from "../../components/RepaymentStatus";

const RepaymentPage = () => {
  const contractAddress = "0x860B55A2018d591378ceF13A4624fcc67373A3a1"; // Replace with deployed contract

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Repayment Status</h2>
      <div>
        <RepaymentStatusWrapper contractAddress={contractAddress} />
      </div>
    </div>
  );
};

// Create a wrapper component to handle the object returned by RepaymentStatus
const RepaymentStatusWrapper = ({ contractAddress }) => {
  // Assuming RepaymentStatus is a hook or function that returns {data, loading, error}
  const result = RepaymentStatus({ contractAddress });
  
  if (!result) return <p>No data available</p>;
  
  const { data, loading, error } = result;
  
  if (loading) return <p>Loading repayment status...</p>;
  if (error) return <p className="text-red-500">Error: {error.message || String(error)}</p>;
  if (data) {
    return (
      <div className="mt-4">
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
  
  return <p>No repayment data found</p>;
};

export default RepaymentPage;
