const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Deploy Loan Contract
    console.log("Deploying Loan Contract...");
    const LoanContract = await ethers.getContractFactory("LoanContract");
    const loanContract = await LoanContract.deploy();
    await loanContract.waitForDeployment();
    const loanContractAddress = loanContract.target; // Ensure correct address retrieval
    console.log("Loan Contract deployed at:", loanContractAddress);

    // Deploy Credit Score Contract
//     console.log("Deploying Credit Score Contract...");
//     const CreditScore = await ethers.getContractFactory("CreditScore");
//     const creditScore = await CreditScore.deploy();
//     await creditScore.waitForDeployment();
//     const creditScoreAddress = creditScore.target;
//     console.log("Credit Score Contract deployed at:", creditScoreAddress);

    // Deploy DAO Contract (passing Loan Contract address)
    console.log("Deploying DAO Contract...");
    const DAOContract = await ethers.getContractFactory("DAOContract");
    const daoContract = await DAOContract.deploy(String(loanContractAddress)); // Convert to string
    await daoContract.waitForDeployment();
    const daoContractAddress = daoContract.target;
    console.log("DAO Contract deployed at:", daoContractAddress);

//     console.log("\n✅ Deployment Complete!");
//     console.log(`LOAN_CONTRACT_ADDRESS="${loanContractAddress}"`);
//     console.log(`CREDIT_SCORE_CONTRACT_ADDRESS="${creditScoreAddress}"`);
//     console.log(`DAO_CONTRACT_ADDRESS="${daoContractAddress}"`);
// }
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });