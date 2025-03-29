import { useEffect, useState } from 'react';
import Link from 'next/link';
import useWeb3Auth from '../hooks/useWeb3Auth';
import { BrowserProvider, Contract } from "ethers";
import LoanContractABI from "../lib/LoanContract.json";

function CreditScoreNotification({ contractAddress }) {
  const [hasScore, setHasScore] = useState(false);
  const [loading, setLoading] = useState(true);
  const { account, signer } = useWeb3Auth();
  
  useEffect(() => {
    const checkCreditScore = async () => {
      if (!account || !signer || !contractAddress) {
        setLoading(false);
        return;
      }
      
      try {
        const contract = new Contract(contractAddress, LoanContractABI.abi, signer);
        const result = await contract.hasCreditScore(account);
        setHasScore(result);
        setLoading(false);
      } catch (err) {
        console.error("Error checking credit score:", err);
        setLoading(false);
      }
    };
    
    checkCreditScore();
  }, [account, signer, contractAddress]);
  
  if (loading || !account || hasScore) {
    return null;
  }
  
  return (
    <div className="bg-yellow-100 p-3 text-sm border-b border-yellow-200">
      <div className="container mx-auto flex justify-between items-center">
        <span>You need to initialize your credit score to apply for loans. </span>
        <Link href="/credit-score" className="text-blue-600 hover:text-blue-800 underline font-medium">
          Initialize now
        </Link>
      </div>
    </div>
  );
}

export default CreditScoreNotification;