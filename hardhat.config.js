require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Ensure environment variables are loaded

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    holesky: {  // Replacing "goerli" with "holesky"
        url: process.env.ALCHEMY_API_URL,
        accounts: [process.env.PRIVATE_KEY]
    }
  }
};
