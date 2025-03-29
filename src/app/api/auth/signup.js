import { ethers } from 'ethers';
import { storeJSONOnIPFS } from '../../../lib/ipfsStorage';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { signature, message, address, userData } = req.body;

    if (!signature || !message || !address) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Store user data on IPFS
    if (userData) {
      const ipfsHash = await storeJSONOnIPFS({
        address,
        ...userData,
        createdAt: Date.now()
      });
      
      // In a production app, you'd store the IPFS hash in a database
      console.log(`User data stored on IPFS: ${ipfsHash}`);
    }

    // Generate a JWT token or session
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
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
}