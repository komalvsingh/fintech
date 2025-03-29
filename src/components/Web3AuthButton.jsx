import React from 'react';
import useWeb3Auth from '../hooks/useWeb3Auth';

const Web3AuthButton = () => {
  const { account, connectWallet } = useWeb3Auth();

  return (
    <button onClick={connectWallet} className="p-2 bg-blue-600 text-white rounded">
      {account ? `Connected: ${account.substring(0, 6)}...` : 'Connect Wallet'}
    </button>
  );
};

export default Web3AuthButton;