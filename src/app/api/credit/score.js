// src/app/api/credit/score.js
import { ethers } from 'ethers';
import CreditScoreABI from '../../../lib/CreditScore.json';
import LoanContractABI from '../../../lib/LoanContract.json';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Missing address parameter' });
    }

    // Connect to contracts
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    
    // First try getting score from CreditScore contract
    const creditScoreContract = new ethers.Contract(
      process.env.CREDIT_SCORE_ADDRESS,
      CreditScoreABI.abi,
      provider
    );

    try {
      const score = await creditScoreContract.getCreditScore(address);
      return res.status(200).json({ 
        score: score.toNumber(),
        source: 'CreditScore'
      });
    } catch (error) {
      console.log('Score not found in CreditScore contract, trying LoanContract...');
      
      // If that fails, try the LoanContract
      const loanContract = new ethers.Contract(
        process.env.LOAN_CONTRACT_ADDRESS,
        LoanContractABI.abi,
        provider
      );
      
      try {
        // We need to call this as the user, so we use callStatic
        const score = await loanContract.callStatic.getCreditScore({ from: address });
        return res.status(200).json({ 
          score: score.toNumber(),
          source: 'LoanContract'
        });
      } catch (loanError) {
        // No score found in either contract
        return res.status(404).json({ 
          error: 'No credit score found for this address',
          message: 'User may need to initialize their credit score'
        });
      }
    }
  } catch (error) {
    console.error('Credit score fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch credit score' });
  }
}