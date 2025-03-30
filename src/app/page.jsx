"use client";
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import useWeb3Auth from '../hooks/useWeb3Auth';
import { motion } from 'framer-motion';
import DaoMembershipInfo from '../components/DaoMembershipInfo';

const Dashboard = () => {
  const { account, connectWallet, isConnecting } = useWeb3Auth();
  // Define isConnected based on account existence
  const isConnected = !!account;
  // Add loans state
  const [loans, setLoans] = useState([]);
  // Add state for DAO membership info modal
  const [showDaoInfo, setShowDaoInfo] = useState(false);
  
  // Demo data for UI preview (remove in production)
  useEffect(() => {
    if (isConnected && loans.length === 0) {
      setLoans([
        { id: '0x1', amount: 1.5, repaymentDue: '15 Apr 2025', isApproved: true, isPaid: false },
        { id: '0x2', amount: 0.75, repaymentDue: '30 Apr 2025', isApproved: true, isPaid: false },
        { id: '0x3', amount: 2.0, repaymentDue: '10 Mar 2025', isApproved: false, isPaid: false }
      ]);
    }
  }, [isConnected, loans.length]);

  // Stats for the dashboard
  const stats = [
    { title: "Total Value Locked", value: "245.8 ETH", change: "+12.5%" },
    { title: "Active Loans", value: "156", change: "+8.2%" },
    { title: "DAO Members", value: "1,247", change: "+15.3%" },
    { title: "Avg. Interest Rate", value: "5.2%", change: "-0.8%" }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 mt-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">DeFi Credit DAO Dashboard</h2>
          
          {!isConnected ? (
            <motion.button
              onClick={connectWallet}
              disabled={isConnecting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-blue-500/20 disabled:opacity-70"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </motion.button>
          ) : (
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="font-medium text-gray-300 mr-2">Connected:</span>
              <span className="bg-gray-800 text-gray-200 px-4 py-2 rounded-lg font-mono">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
            </div>
          )}
        </div>
        
        {/* Stats Overview */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 15px 30px -5px rgba(59, 130, 246, 0.3)"
              }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 transition-all duration-300"
            >
              <h3 className="text-gray-400 text-sm font-medium mb-2">{stat.title}</h3>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'} font-medium`}>
                  {stat.change}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Main Dashboard Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Recent Activity */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg shadow-blue-900/10"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Recent DAO Activity</h3>
              <Link href="/activity">
                <span className="text-blue-400 hover:text-teal-400 text-sm font-medium transition-colors duration-300">
                  View All Activity →
                </span>
              </Link>
            </div>
            
            {/* Activity Timeline */}
            <div className="space-y-4">
              {[1, 2, 3].map((_, index) => (
                <motion.div 
                  key={index}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + (index * 0.1) }}
                  className="flex items-start p-4 bg-gray-750 bg-opacity-50 rounded-lg"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-200">
                      {index === 0 ? "Loan #125 approved by community vote" : 
                       index === 1 ? "New governance proposal submitted" :
                       "5 ETH repaid to liquidity pool"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {index === 0 ? "15 minutes ago" : 
                       index === 1 ? "2 hours ago" :
                       "5 hours ago"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* DAO Metrics */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg shadow-blue-900/10"
          >
            <h3 className="text-xl font-semibold mb-6">DAO Metrics</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Approval Rate</span>
                  <span className="text-gray-200 font-medium">72%</span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '72%' }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full"
                  ></motion.div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Liquidity Utilization</span>
                  <span className="text-gray-200 font-medium">58%</span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '58%' }}
                    transition={{ duration: 1, delay: 0.7 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full"
                  ></motion.div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Repayment Rate</span>
                  <span className="text-gray-200 font-medium">94%</span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '94%' }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full"
                  ></motion.div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDaoInfo(true)}
                className="bg-gradient-to-r from-blue-500/20 to-teal-500/20 border border-blue-500/30 p-4 rounded-lg text-center hover:from-blue-500/30 hover:to-teal-500/30 transition-all duration-300 cursor-pointer"
              >
                <p className="text-gray-200 font-medium">Get DAO Membership</p>
                <p className="text-sm text-gray-400 mt-1">Access exclusive features</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* My Loans Section */}
        {isConnected && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                My Loans
              </h3>
              <Link href="/loan">
                <span className="text-blue-400 hover:text-teal-400 text-sm font-medium transition-colors duration-300">
                  View All Loans →
                </span>
              </Link>
            </div>
            
            {/* Display recent loans or a message to apply */}
            {loans && loans.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {loans.slice(0, 3).map((loan, index) => (
                  <Link href={`/loan/${loan.id}`} key={index}>
                    <motion.div
                      variants={itemVariants}
                      whileHover={{ 
                        y: -8,
                        boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.4)"
                      }}
                      className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-300">Loan #{index + 1}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          loan.isPaid 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : loan.isApproved 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {loan.isPaid 
                            ? 'Repaid' 
                            : loan.isApproved 
                              ? 'Approved' 
                              : 'Pending'}
                        </span>
                      </div>
                      <div className="mt-4 mb-3">
                        <p className="text-3xl font-bold text-white">{loan.amount} ETH</p>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Due: {loan.repaymentDue}</p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 }}
                className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center shadow-lg shadow-blue-900/10"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-6">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-300 mb-6">You don't have any active loans.</p>
                <Link href="/loan">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/20"
                  >
                    Apply for a Loan
                  </motion.span>
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
      
      {/* DAO Membership Info Modal */}
      {showDaoInfo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <DaoMembershipInfo onDismiss={() => setShowDaoInfo(false)} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;