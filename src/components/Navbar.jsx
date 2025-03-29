"use client";
import React from 'react';
import Link from 'next/link';
// Fix the import path - use the correct relative path
import { useWeb3 } from './Web3Provider';

const Navbar = () => {
  // Update to use useWeb3 instead of useWeb3Auth
  const { account, connectWallet, isConnecting } = useWeb3();
  
  const isConnected = !!account;

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-indigo-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <span className="text-white font-bold text-xl cursor-pointer">
                  DeFi Credit
                </span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/">
                  <span className="text-gray-300 hover:bg-indigo-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
                    Dashboard
                  </span>
                </Link>
                <Link href="/credit">
                  <span className="text-gray-300 hover:bg-indigo-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
                    Credit Score
                  </span>
                </Link>
                <Link href="/loan">
                  <span className="text-gray-300 hover:bg-indigo-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
                    Loans
                  </span>
                </Link>
                {/* Add the new Repay link */}
                <Link href="/repay">
                  <span className="text-gray-300 hover:bg-indigo-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
                    Repay
                  </span>
                </Link>
                <Link href="/dao">
                  <span className="text-gray-300 hover:bg-indigo-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
                    DAO
                  </span>
                </Link>
                {/* Add DAO Members link */}
                <Link href="/dao/members">
                  <span className="text-gray-300 hover:bg-indigo-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer">
                    DAO Members
                  </span>
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            {account ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-300 bg-indigo-800 px-3 py-2 rounded-md text-sm font-medium">
                  {truncateAddress(account)}
                </span>
                {/* For now, we'll just refresh the page to disconnect */}
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className={`${
                  isConnecting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white px-4 py-2 rounded-md text-sm font-medium`}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;