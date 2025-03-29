import { ethers } from "ethers";
import daoABI from "../../../../scripts/DAOContract.json"; // Import DAO contract ABI

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const { loanRequestId, voterAddress, vote } = req.body; // vote: true (approve), false (reject)

            if (!loanRequestId || !voterAddress || vote === undefined) {
                return res.status(400).json({ error: "Missing parameters" });
            }

            // Connect to Ethereum
            const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
            const signer = provider.getSigner(voterAddress);
            const daoContract = new ethers.Contract(process.env.DAO_CONTRACT_ADDRESS, daoABI, signer);

            // Cast vote on loan approval
            const tx = await daoContract.voteOnLoan(loanRequestId, vote);
            await tx.wait();

            res.status(200).json({ success: true, message: "Vote cast successfully", txHash: tx.hash });
        } catch (error) {
            res.status(500).json({ error: "Loan approval failed", details: error.message });
        }
    } else {
        res.status(405).json({ error: "Method Not Allowed" });
    }
}
