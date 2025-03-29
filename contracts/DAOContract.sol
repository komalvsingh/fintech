// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DAOContract {
    address public owner;
    address public loanContract; // Added loanContract address storage
    mapping(address => bool) public members;
    mapping(uint256 => LoanRequest) public loanRequests;
    uint256 public requestCount;

    struct LoanRequest {
        address borrower;
        uint256 amount;
        bool approved;
        uint256 votes;
    }

    event LoanRequested(
        uint256 requestId,
        address indexed borrower,
        uint256 amount
    );
    event LoanApproved(uint256 requestId);

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
        loanContract = _loanContract; // Store the loan contract address
    }

    function addMember(address _member) external onlyOwner {
        members[_member] = true;
    }

    function requestLoan(uint256 _amount) external {
        requestCount++;
        loanRequests[requestCount] = LoanRequest({
            borrower: msg.sender,
            amount: _amount,
            approved: false,
            votes: 0
        });

        emit LoanRequested(requestCount, msg.sender, _amount);
    }

    function voteForLoan(uint256 _requestId) external onlyMember {
        require(!loanRequests[_requestId].approved, "Already approved");

        loanRequests[_requestId].votes++;

        if (loanRequests[_requestId].votes >= 3) {
            // Example threshold
            loanRequests[_requestId].approved = true;
            emit LoanApproved(_requestId);
        }
    }

    function getLoanStatus(uint256 _requestId) external view returns (bool) {
        return loanRequests[_requestId].approved;
    }
}
