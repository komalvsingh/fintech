import React from 'react';
import useBlockchainData from '../hooks/useBlockchainData';

const CreditScoreCard = ({ contractAddress }) => {
  const creditScore = useBlockchainData(contractAddress, 'getCreditScore');

  return <div className="p-4 border rounded">Credit Score: {creditScore || 'Loading...'}</div>;
};

export default CreditScoreCard;
