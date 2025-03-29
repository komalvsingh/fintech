"use client";
import React from "react";
import WalletConnect from "../../components/WalletConnect";

const WalletPage = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
      <WalletConnect />
    </div>
  );
};

export default WalletPage;
