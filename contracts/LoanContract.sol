// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LoanContract {
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256) public creditScores;
    mapping(address => bool) public hasCreditScore;

    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 repaymentDue;
        bool isApproved;
        bool isPaid;
    }

    // Add a mapping to track user loans
    mapping(address => uint256[]) private userLoans;
    
    function requestLoan(uint256 amount, uint256 duration) external {
        uint256 loanId = uint256(
            keccak256(abi.encodePacked(msg.sender, block.timestamp))
        );
        loans[loanId] = Loan(
            loanId,
            msg.sender,
            amount,
            block.timestamp + duration,
            false,
            false
        );
        
        // Add loan to user's loan array
        userLoans[msg.sender].push(loanId);
    }

    function voteOnLoan(uint256 loanId, bool vote) external {
        if (vote) {
            loans[loanId].isApproved = true;
        }
    }

    function disburseLoan(uint256 loanId) external payable {
        require(loans[loanId].isApproved, "Loan not approved");
        payable(loans[loanId].borrower).transfer(loans[loanId].amount);
    }

    function repayLoan(uint256 loanId) external payable {
        require(
            msg.value == loans[loanId].amount,
            "Incorrect repayment amount"
        );
        loans[loanId].isPaid = true;
        
        // Update credit score after successful repayment
        updateCreditScore(msg.sender, true);
    }
    
    // New functions for credit score
    function updateCreditScore(address user, bool positiveAction) internal {
        if (!hasCreditScore[user]) {
            // Initialize credit score for new users
            creditScores[user] = 500; // Starting score
            hasCreditScore[user] = true;
        } else {
            // Adjust score based on actions
            if (positiveAction) {
                // Cap at 850 (common max credit score)
                if (creditScores[user] <= 830) {
                    creditScores[user] += 20;
                } else {
                    creditScores[user] = 850;
                }
            } else {
                // Don't go below 300 (common min credit score)
                if (creditScores[user] >= 320) {
                    creditScores[user] -= 20;
                } else {
                    creditScores[user] = 300;
                }
            }
        }
    }
    
    function getCreditScore() external view returns (uint256) {
        require(hasCreditScore[msg.sender], "User does not have a credit score");
        return creditScores[msg.sender];
    }
    
    // Optional: Allow admin to manually adjust credit scores
    // This would need access control mechanisms
    
    function initializeCreditScore() external {
        require(!hasCreditScore[msg.sender], "User already has a credit score");
        
        // Initialize with a lower score than loan repayment would give
        creditScores[msg.sender] = 400; 
        hasCreditScore[msg.sender] = true;
    }
    
    // Add function to get all loans for a user
    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }
    
    // Add function to get multiple loans by their IDs
    function getMultipleLoans(uint256[] calldata loanIds) external view returns (Loan[] memory) {
        Loan[] memory result = new Loan[](loanIds.length);
        
        for (uint256 i = 0; i < loanIds.length; i++) {
            result[i] = loans[loanIds[i]];
        }
        
        return result;
    }
}
