import React from 'react';
import CreditScoreGuide from '../components/CreditScoreGuide';

export default function CreditGuidePage() {
  // You'll need to replace this with your actual contract address
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x23187E285929405A9E28eAEa245efc22dbbD8C61";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Understanding Your Credit Score</h1>
      <CreditScoreGuide contractAddress={contractAddress} />
      
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800">Why do I need a credit score?</h3>
            <p className="text-gray-600 mt-1">A good credit score helps you qualify for better loan terms and higher loan amounts in our DeFi platform.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800">How long does it take to improve my score?</h3>
            <p className="text-gray-600 mt-1">Your score updates immediately after each successful loan repayment.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800">Can my credit score decrease?</h3>
            <p className="text-gray-600 mt-1">Currently, your score only increases with positive actions. Future updates may include penalties for late payments.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800">Is my credit score visible to others?</h3>
            <p className="text-gray-600 mt-1">Your credit score is stored on the blockchain but is only accessible to you and authorized lenders.</p>
          </div>
        </div>
      </div>
    </div>
  );
}