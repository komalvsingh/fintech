import { ethers } from "ethers";

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const { walletAddress, signature, message } = req.body;

            if (!walletAddress || !signature || !message) {
                return res.status(400).json({ error: "Missing parameters" });
            }

            // Verify the signed message
            const recoveredAddress = ethers.utils.verifyMessage(message, signature);
            
            if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                return res.status(401).json({ error: "Signature verification failed" });
            }

            // Simulate token generation (replace with JWT or session handling)
            const token = `session-${walletAddress}-${Date.now()}`;

            res.status(200).json({ success: true, token, walletAddress });
        } catch (error) {
            res.status(500).json({ error: "Authentication failed", details: error.message });
        }
    } else {
        res.status(405).json({ error: "Method Not Allowed" });
    }
}
