import { create } from 'ipfs-http-client';

const client = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

const uploadToIPFS = async (file) => {
  const added = await client.add(file);
  return `https://ipfs.infura.io/ipfs/${added.path}`;
};

export { uploadToIPFS };