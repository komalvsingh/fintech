// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LoanContract {
    mapping(uint256 => Loan) public loans;

    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 repaymentDue;
        bool isApproved;
        bool isPaid;
    }

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
    }
}
