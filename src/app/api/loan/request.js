import { ethers } from 'ethers';
import LoanContractABI from '../../../lib/LoanContract.json';
import { storeLoanApplication } from '../../../lib/ipfsStorage';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, duration, purpose, signature, address } = req.body;

    if (!amount || !duration || !signature || !address) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Store additional loan details on IPFS
    const ipfsHash = await storeLoanApplication({
      borrower: address,
      amount,
      duration,
      purpose,
      requestDate: new Date().toISOString()
    });

    // Connect to the loan contract
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const loanContract = new ethers.Contract(
      process.env.LOAN_CONTRACT_ADDRESS,
      LoanContractABI.abi,
      wallet
    );

    // Convert amount to wei
    const amountInWei = ethers.utils.parseEther(amount.toString());

    // Request the loan
    const tx = await loanContract.requestLoan(amountInWei, duration);
    await tx.wait();

    return res.status(200).json({ 
      success: true,
      message: 'Loan requested successfully',
      transactionHash: tx.hash,
      ipfsHash
    });
  } catch (error) {
    console.error('Loan request error:', error);
    return res.status(500).json({ error: 'Failed to request loan' });
  }
}