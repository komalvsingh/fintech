// src/lib/ipfsStorage.js
import { create } from 'ipfs-http-client';

// Create an IPFS client with the right configuration for browser use
const projectId = process.env.NEXT_PUBLIC_INFURA_IPFS_PROJECT_ID; 
const projectSecret = process.env.NEXT_PUBLIC_INFURA_IPFS_PROJECT_SECRET;
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth
  }
});

// Upload file to IPFS
const uploadToIPFS = async (file) => {
  try {
    const added = await client.add(file);
    return `https://ipfs.infura.io/ipfs/${added.path}`;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw error;
  }
};

// Store JSON data on IPFS
const storeJSONOnIPFS = async (jsonData) => {
  try {
    const jsonString = JSON.stringify(jsonData);
    const jsonBuffer = Buffer.from(jsonString);
    const added = await client.add(jsonBuffer);
    return `https://ipfs.infura.io/ipfs/${added.path}`;
  } catch (error) {
    console.error('Error storing JSON on IPFS:', error);
    throw error;
  }
};

// Store loan application data
const storeLoanApplication = async (loanData) => {
  try {
    return await storeJSONOnIPFS({
      ...loanData,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error storing loan application on IPFS:', error);
    throw error;
  }
};

// Store credit history data
const storeCreditHistory = async (historyData) => {
  try {
    return await storeJSONOnIPFS({
      ...historyData,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error storing credit history on IPFS:', error);
    throw error;
  }
};

// New functions to retrieve data from IPFS

// Extract CID from IPFS URL
const extractCIDFromURL = (ipfsUrl) => {
  // Handle different IPFS URL formats
  if (ipfsUrl.includes('/ipfs/')) {
    return ipfsUrl.split('/ipfs/')[1];
  }
  return ipfsUrl;
};

// Fetch data from IPFS using the URL or CID
const fetchFromIPFS = async (ipfsUrl) => {
  try {
    const cid = extractCIDFromURL(ipfsUrl);
    
    // Use fetch API to get the data from the IPFS gateway
    const response = await fetch(`https://ipfs.infura.io/ipfs/${cid}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw error;
  }
};

// Fetch loan application data
const fetchLoanApplication = async (ipfsUrl) => {
  try {
    return await fetchFromIPFS(ipfsUrl);
  } catch (error) {
    console.error('Error fetching loan application from IPFS:', error);
    throw error;
  }
};

// Fetch credit history data
const fetchCreditHistory = async (ipfsUrl) => {
  try {
    return await fetchFromIPFS(ipfsUrl);
  } catch (error) {
    console.error('Error fetching credit history from IPFS:', error);
    throw error;
  }
};

export { 
  uploadToIPFS, 
  storeJSONOnIPFS, 
  storeLoanApplication, 
  storeCreditHistory,
  fetchFromIPFS,
  fetchLoanApplication,
  fetchCreditHistory
};