
// src/app/api/loan/approve.js
import { ethers } from 'ethers';
import LoanContractABI from '../../../lib/LoanContract.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { loanId, vote, signature, address } = req.body;

    if (!loanId || vote === undefined || !signature || !address) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify user is authenticated
    // In a real app, you'd use a JWT verification middleware
    
    // Connect to the loan contract
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const loanContract = new ethers.Contract(
      process.env.LOAN_CONTRACT_ADDRESS,
      LoanContractABI.abi,
      wallet
    );

    // Vote on the loan
    const tx = await loanContract.voteOnLoan(loanId, vote);
    await tx.wait();

    return res.status(200).json({ 
      success: true,
      message: 'Vote recorded successfully',
      transactionHash: tx.hash
    });
  } catch (error) {
    console.error('Loan approval error:', error);
    return res.status(500).json({ error: 'Failed to approve loan' });
  }
}