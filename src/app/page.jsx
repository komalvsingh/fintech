"use client";
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import useWeb3Auth from '../hooks/useWeb3Auth';

const Dashboard = () => {
  const { account, connectWallet, isConnecting } = useWeb3Auth();
  // Define isConnected based on account existence
  const isConnected = !!account;
  // Add loans state
  const [loans, setLoans] = useState([]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      {/* ... existing dashboard content ... */}
      
      {/* Add My Loans section */}
      {isConnected && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">My Loans</h3>
            <Link href="/loan">
              <span className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                View All Loans
              </span>
            </Link>
          </div>
          
          {/* Display recent loans or a message to apply */}
          {loans && loans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {loans.slice(0, 3).map((loan, index) => (
                <Link href={`/loan/${loan.id}`} key={index}>
                  <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Loan #{index + 1}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        loan.isPaid 
                          ? 'bg-green-100 text-green-800' 
                          : loan.isApproved 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {loan.isPaid 
                          ? 'Repaid' 
                          : loan.isApproved 
                            ? 'Approved' 
                            : 'Pending'}
                      </span>
                    </div>
                    <p className="text-lg font-semibold">{loan.amount} ETH</p>
                    <p className="text-sm text-gray-500">Due: {loan.repaymentDue}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <p className="text-gray-600 mb-4">You don't have any active loans.</p>
              <Link href="/loan">
                <span className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Apply for a Loan
                </span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;