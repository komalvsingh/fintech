import React from 'react';
import useBlockchainData from '../hooks/useBlockchainData';

const RepaymentStatus = ({ contractAddress }) => {
  const status = useBlockchainData(contractAddress, 'getRepaymentStatus');

  return <div className="p-4 border rounded">Repayment Status: {status || 'Fetching...'}</div>;
};

export default RepaymentStatus;
