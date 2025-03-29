// src/app/api/auth/login.js
import { ethers } from 'ethers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { signature, message, address } = req.body;

    if (!signature || !message || !address) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Generate a JWT token or session
    // This is a simplified example - in a real app, you'd use a proper JWT library
    const token = Buffer.from(JSON.stringify({ 
      address, 
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    })).toString('base64');

    return res.status(200).json({ 
      token,
      user: {
        address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}