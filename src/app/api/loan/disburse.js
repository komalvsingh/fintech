import { ethers } from 'ethers';
import LoanContractABI from '../../../lib/LoanContract.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { loanId, signature, address } = req.body;

    if (!loanId || !signature || !address) {
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

    // Get loan details
    const loan = await loanContract.loans(loanId);

    // Ensure loan is approved but not yet disbursed
    if (!loan.isApproved) {
      return res.status(400).json({ error: 'Loan is not approved' });
    }

    if (loan.isPaid) {
      return res.status(400).json({ error: 'Loan has already been disbursed or repaid' });
    }

    // Disburse the loan
    const tx = await loanContract.disburseLoan(loanId, {
      value: loan.amount
    });
    await tx.wait();

    return res.status(200).json({ 
      success: true,
      message: 'Loan disbursed successfully',
      transactionHash: tx.hash
    });
  } catch (error) {
    console.error('Loan disbursement error:', error);
    return res.status(500).json({ error: 'Failed to disburse loan' });
  }
}