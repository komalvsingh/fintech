import { ethers } from "ethers";

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const { walletAddress, signature, message, userData } = req.body;

            if (!walletAddress || !signature || !message || !userData) {
                return res.status(400).json({ error: "Missing parameters" });
            }

            // Verify the signed message
            const recoveredAddress = ethers.utils.verifyMessage(message, signature);

            if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                return res.status(401).json({ error: "Signature verification failed" });
            }

            // Simulate user storage (Replace this with a real database)
            const newUser = {
                walletAddress,
                username: userData.username,
                email: userData.email,
                createdAt: new Date(),
                creditScore: 600 // Default starting credit score
            };

            // Simulated response
            res.status(201).json({ success: true, message: "User signed up successfully", user: newUser });
        } catch (error) {
            res.status(500).json({ error: "Signup failed", details: error.message });
        }
    } else {
        res.status(405).json({ error: "Method Not Allowed" });
    }
}
