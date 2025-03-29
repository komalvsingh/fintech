import { ethers } from "ethers";
import loanABI from "../../../../scripts/LoanContract.json"; // Import loan smart contract ABI

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const { walletAddress, loanRequestId, repaymentAmount } = req.body;

            if (!walletAddress || !loanRequestId || !repaymentAmount) {
                return res.status(400).json({ error: "Missing parameters" });
            }

            // Connect to Ethereum
            const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
            const signer = provider.getSigner(walletAddress);
            const loanContract = new ethers.Contract(process.env.LOAN_CONTRACT_ADDRESS, loanABI, signer);

            // Repay loan
            const tx = await loanContract.repayLoan(loanRequestId, {
                value: ethers.utils.parseUnits(repaymentAmount, "ether"),
            });
            await tx.wait();

            res.status(200).json({ success: true, message: "Loan repaid successfully", txHash: tx.hash });
        } catch (error) {
            res.status(500).json({ error: "Loan repayment failed", details: error.message });
        }
    } else {
        res.status(405).json({ error: "Method Not Allowed" });
    }
}
