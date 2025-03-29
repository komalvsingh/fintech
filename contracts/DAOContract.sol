// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ILoanContract {
    function voteOnLoan(uint256 loanId, bool vote) external;
    function getCreditScoreByDAO(
        address user
    ) external view returns (uint256, bool);
    function loans(
        uint256 loanId
    )
        external
        view
        returns (
            uint256 id,
            address borrower,
            uint256 amount,
            uint256 repaymentDue,
            bool isApproved,
            bool isPaid
        );
    function getPendingLoans() external view returns (uint256[] memory);
    function removePendingLoan(uint256 loanId) external;
}

contract DAOContract {
    address public owner;
    address public loanContract;
    mapping(address => bool) public members;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => uint256) public loanVotes;
    uint256 public requiredVotes = 3; // Configurable threshold

    event MemberAdded(address indexed member);
    event VoteCast(uint256 indexed loanId, address indexed member, bool vote);
    event LoanApproved(uint256 indexed loanId);
    event LoanRejected(uint256 indexed loanId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyMember() {
        require(members[msg.sender], "Not a DAO member");
        _;
    }

    constructor(address _loanContract) {
        owner = msg.sender;
        members[msg.sender] = true; // Owner is the first member
        loanContract = _loanContract;
    }

    function addMember(address _member) external onlyOwner {
        members[_member] = true;
        emit MemberAdded(_member);
    }

    function setRequiredVotes(uint256 _requiredVotes) external onlyOwner {
        requiredVotes = _requiredVotes;
    }

    function voteOnLoan(uint256 loanId, bool vote) external onlyMember {
        require(!hasVoted[loanId][msg.sender], "Already voted on this loan");

        // Mark as voted
        hasVoted[loanId][msg.sender] = true;

        if (vote) {
            loanVotes[loanId]++;
        }

        emit VoteCast(loanId, msg.sender, vote);

        // Check if threshold is reached
        if (loanVotes[loanId] >= requiredVotes) {
            // Approve the loan in the loan contract
            ILoanContract(loanContract).voteOnLoan(loanId, true);
            // Remove from pending loans
            ILoanContract(loanContract).removePendingLoan(loanId);
            emit LoanApproved(loanId);
        }
    }

    function rejectLoan(uint256 loanId) external onlyMember {
        // This function allows members to explicitly reject a loan
        // We could implement a rejection threshold as well
        ILoanContract(loanContract).removePendingLoan(loanId);
        emit LoanRejected(loanId);
    }

    function getPendingLoans() external view returns (uint256[] memory) {
        return ILoanContract(loanContract).getPendingLoans();
    }

    function getLoanDetails(
        uint256 loanId
    )
        external
        view
        returns (
            address borrower,
            uint256 amount,
            uint256 repaymentDue,
            bool isApproved,
            bool isPaid,
            uint256 voteCount
        )
    {
        (, borrower, amount, repaymentDue, isApproved, isPaid) = ILoanContract(
            loanContract
        ).loans(loanId);

        voteCount = loanVotes[loanId];

        return (borrower, amount, repaymentDue, isApproved, isPaid, voteCount);
    }

    function getBorrowerCreditScore(
        address borrower
    ) external view onlyMember returns (uint256, bool) {
        return ILoanContract(loanContract).getCreditScoreByDAO(borrower);
    }

    function hasUserVoted(
        uint256 loanId,
        address user
    ) external view returns (bool) {
        return hasVoted[loanId][user];
    }
}
