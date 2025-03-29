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

    // Connect to the loan contract
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const loanContract = new ethers.Contract(
      process.env.LOAN_CONTRACT_ADDRESS,
      LoanContractABI.abi,
      signer
    );

    // Get loan details
    const loan = await loanContract.loans(loanId);

    // Ensure loan is approved and not yet repaid
    if (!loan.isApproved) {
      return res.status(400).json({ error: 'Loan is not approved' });
    }

    if (loan.isPaid) {
      return res.status(400).json({ error: 'Loan has already been repaid' });
    }

    // Ensure the borrower is the one repaying
    if (loan.borrower.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({ error: 'Only the borrower can repay this loan' });
    }

    // The repayment will be handled client-side since it requires the user's wallet

    return res.status(200).json({ 
      success: true,
      loanAmount: ethers.utils.formatEther(loan.amount),
      borrower: loan.borrower
    });
  } catch (error) {
    console.error('Loan repayment error:', error);
    return res.status(500).json({ error: 'Failed to process loan repayment' });
  }
}