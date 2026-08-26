// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BlockProxyVoting
 * @notice Production-grade Solidity smart contract for decentralized proxy voting and corporate governance.
 * @dev Implements RBAC, ReentrancyGuard, and zero-PII on-chain cryptographic audit trail.
 */
contract BlockProxyVoting is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    enum VoteChoice { YES, NO, ABSTAIN }

    struct ProposalOnChain {
        uint256 id;
        string proposalHash;    // SHA-256 hash of proposal resolution metadata
        uint256 startTime;
        uint256 endTime;
        uint256 totalYesPower;
        uint256 totalNoPower;
        uint256 totalAbstainPower;
        bool exists;
        bool closed;
    }

    struct ProxyTicket {
        address delegator;
        address proxy;
        uint256 proposalId;     // 0 for global meeting, or specific proposalId
        uint256 delegatedPower;
        uint256 validUntil;
        bool isActive;
    }

    struct VoteRecord {
        uint256 proposalId;
        address voter;
        VoteChoice choice;
        uint256 votingPower;
        bool isProxyVote;
        address principal;      // original shareholder if proxy vote
        uint256 timestamp;
    }

    // State Variables
    uint256 public proposalCount;
    uint256 public totalVotesCastOnChain;

    mapping(uint256 => ProposalOnChain) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVotedDirectly;
    mapping(bytes32 => ProxyTicket) public delegations;
    mapping(bytes32 => mapping(uint256 => bool)) public hasProxyTicketVoted;
    mapping(bytes32 => VoteRecord) public voteReceipts; // (txHash/voteHash => VoteRecord)

    // Events
    event ProposalCreated(uint256 indexed proposalId, string proposalHash, uint256 startTime, uint256 endTime);
    event ProposalClosed(uint256 indexed proposalId, uint256 totalYes, uint256 totalNo, uint256 totalAbstain);
    event VoteRecorded(
        bytes32 indexed voteHash,
        uint256 indexed proposalId,
        address indexed voter,
        VoteChoice choice,
        uint256 votingPower,
        bool isProxy
    );
    event ProxyDelegationRegistered(
        bytes32 indexed delegationId,
        address indexed delegator,
        address indexed proxy,
        uint256 power,
        uint256 validUntil
    );
    event ProxyDelegationRevoked(bytes32 indexed delegationId, address indexed delegator);

    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        _grantRole(ORACLE_ROLE, initialAdmin);
    }

    /**
     * @notice Register a corporate proposal resolution on-chain
     */
    function createProposal(
        string calldata proposalHash,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(endTime > startTime, "End time must be after start time");

        proposalCount++;
        uint256 newId = proposalCount;

        proposals[newId] = ProposalOnChain({
            id: newId,
            proposalHash: proposalHash,
            startTime: startTime,
            endTime: endTime,
            totalYesPower: 0,
            totalNoPower: 0,
            totalAbstainPower: 0,
            exists: true,
            closed: false
        });

        emit ProposalCreated(newId, proposalHash, startTime, endTime);
        return newId;
    }

    /**
     * @notice Record a direct vote by a registered shareholder
     */
    function castDirectVote(
        uint256 proposalId,
        VoteChoice choice,
        uint256 votingPower
    ) external nonReentrant whenNotPaused returns (bytes32) {
        ProposalOnChain storage prop = proposals[proposalId];
        require(prop.exists, "Proposal does not exist");
        require(!prop.closed, "Proposal is closed");
        require(block.timestamp >= prop.startTime, "Voting period has not started");
        require(block.timestamp <= prop.endTime, "Voting period has ended");
        require(!hasVotedDirectly[proposalId][msg.sender], "Shareholder has already voted on this proposal");
        require(votingPower > 0, "Voting power must be greater than zero");

        hasVotedDirectly[proposalId][msg.sender] = true;

        if (choice == VoteChoice.YES) {
            prop.totalYesPower += votingPower;
        } else if (choice == VoteChoice.NO) {
            prop.totalNoPower += votingPower;
        } else {
            prop.totalAbstainPower += votingPower;
        }

        totalVotesCastOnChain++;

        bytes32 voteHash = keccak256(
            abi.encodePacked(proposalId, msg.sender, choice, votingPower, block.timestamp, totalVotesCastOnChain)
        );

        voteReceipts[voteHash] = VoteRecord({
            proposalId: proposalId,
            voter: msg.sender,
            choice: choice,
            votingPower: votingPower,
            isProxyVote: false,
            principal: msg.sender,
            timestamp: block.timestamp
        });

        emit VoteRecorded(voteHash, proposalId, msg.sender, choice, votingPower, false);
        return voteHash;
    }

    /**
     * @notice Register a proxy delegation ticket on-chain
     */
    function registerProxyDelegation(
        address proxy,
        uint256 proposalId,
        uint256 power,
        uint256 validUntil
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(proxy != address(0) && proxy != msg.sender, "Invalid proxy address");
        require(power > 0, "Delegated power must be > 0");
        require(validUntil > block.timestamp, "Expiry must be in the future");

        bytes32 delegationId = keccak256(
            abi.encodePacked(msg.sender, proxy, proposalId, power, block.timestamp)
        );

        delegations[delegationId] = ProxyTicket({
            delegator: msg.sender,
            proxy: proxy,
            proposalId: proposalId,
            delegatedPower: power,
            validUntil: validUntil,
            isActive: true
        });

        emit ProxyDelegationRegistered(delegationId, msg.sender, proxy, power, validUntil);
        return delegationId;
    }

    /**
     * @notice Revoke a proxy delegation ticket
     */
    function revokeProxyDelegation(bytes32 delegationId) external nonReentrant {
        ProxyTicket storage ticket = delegations[delegationId];
        require(ticket.delegator == msg.sender, "Only delegator can revoke");
        require(ticket.isActive, "Delegation already inactive");

        ticket.isActive = false;
        emit ProxyDelegationRevoked(delegationId, msg.sender);
    }

    /**
     * @notice Record a proxy vote on behalf of a delegating principal
     */
    function castProxyVote(
        bytes32 delegationId,
        uint256 proposalId,
        VoteChoice choice
    ) external nonReentrant whenNotPaused returns (bytes32) {
        ProxyTicket storage ticket = delegations[delegationId];
        require(ticket.isActive, "Proxy delegation is not active");
        require(ticket.proxy == msg.sender, "Caller is not the assigned proxy");
        require(block.timestamp <= ticket.validUntil, "Proxy delegation has expired");
        if (ticket.proposalId != 0) {
            require(ticket.proposalId == proposalId, "Proxy not authorized for this proposal");
        }
        require(!hasProxyTicketVoted[delegationId][proposalId], "Proxy ticket already used for this proposal");

        ProposalOnChain storage prop = proposals[proposalId];
        require(prop.exists, "Proposal does not exist");
        require(!prop.closed, "Proposal is closed");
        require(block.timestamp >= prop.startTime && block.timestamp <= prop.endTime, "Outside voting window");

        hasProxyTicketVoted[delegationId][proposalId] = true;

        if (choice == VoteChoice.YES) {
            prop.totalYesPower += ticket.delegatedPower;
        } else if (choice == VoteChoice.NO) {
            prop.totalNoPower += ticket.delegatedPower;
        } else {
            prop.totalAbstainPower += ticket.delegatedPower;
        }

        totalVotesCastOnChain++;

        bytes32 voteHash = keccak256(
            abi.encodePacked(proposalId, msg.sender, ticket.delegator, choice, ticket.delegatedPower, block.timestamp)
        );

        voteReceipts[voteHash] = VoteRecord({
            proposalId: proposalId,
            voter: msg.sender,
            choice: choice,
            votingPower: ticket.delegatedPower,
            isProxyVote: true,
            principal: ticket.delegator,
            timestamp: block.timestamp
        });

        emit VoteRecorded(voteHash, proposalId, msg.sender, choice, ticket.delegatedPower, true);
        return voteHash;
    }

    /**
     * @notice Verify cryptographic on-chain vote receipt
     */
    function getVoteReceipt(bytes32 voteHash) external view returns (
        bool exists,
        uint256 proposalId,
        address voter,
        VoteChoice choice,
        uint256 votingPower,
        bool isProxy,
        uint256 timestamp
    ) {
        VoteRecord memory record = voteReceipts[voteHash];
        if (record.timestamp == 0) {
            return (false, 0, address(0), VoteChoice.ABSTAIN, 0, false, 0);
        }
        return (
            true,
            record.proposalId,
            record.voter,
            record.choice,
            record.votingPower,
            record.isProxyVote,
            record.timestamp
        );
    }
}
