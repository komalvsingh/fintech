// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CreditScore {
    struct Score {
        uint256 creditScore;
        bool exists;
    }

    mapping(address => Score) private scores;
    address public owner;

    event CreditScoreAssigned(address indexed user, uint256 score);
    event CreditScoreUpdated(address indexed user, uint256 newScore);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function assignCreditScore(
        address _user,
        uint256 _score
    ) external onlyOwner {
        require(!scores[_user].exists, "User already has a credit score");

        scores[_user] = Score({creditScore: _score, exists: true});

        emit CreditScoreAssigned(_user, _score);
    }

    function updateCreditScore(
        address _user,
        uint256 _newScore
    ) external onlyOwner {
        require(scores[_user].exists, "User does not have a credit score");

        scores[_user].creditScore = _newScore;

        emit CreditScoreUpdated(_user, _newScore);
    }

    function getCreditScore(address _user) external view returns (uint256) {
        require(scores[_user].exists, "User does not have a credit score");
        return scores[_user].creditScore;
    }
}
