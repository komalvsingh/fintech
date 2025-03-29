import React from "react";
import Link from "next/link";
import WalletConnect from "./WalletConnect";

const Navbar = () => {
  return (
    <nav className="p-4 bg-gray-800 text-white flex justify-between">
      <h1 className="text-xl font-bold">Decentralized Credit System</h1>
      <div className="flex space-x-4">
        <Link href="/" className="text-white">Home</Link>
        <Link href="/creditscore" className="text-white">Credit Score</Link>
        <Link href="/loan" className="text-white">Apply Loan</Link>
        <Link href="/repayment" className="text-white">Repayment</Link>
        <Link href="/wallet" className="text-white">Wallet</Link>
      </div>
      <WalletConnect/>
    </nav>
  );
};

export default Navbar;
