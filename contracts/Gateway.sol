// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import "./interfaces/IGateway.sol";

import "hardhat/console.sol";

contract Gateway is IGateway {
    mapping(bytes32 => bool) public certificates;
    mapping(bytes32 => uint256) public certificateAddVotes;
    mapping(bytes32 => uint256) public certificateRemoveVotes;
    mapping(bytes32 => mapping(address => bool)) public hasVotedAddCertificate;
    mapping(bytes32 => mapping(address => bool))
        public hasVotedRemoveCertificate;

    mapping(address => bool) public validators;
    address[] public validatorsList;
    mapping(address => uint256) public validatorAddVotes;
    mapping(address => uint256) public validatorRemoveVotes;
    mapping(address => mapping(address => bool)) public hasVotedAddValidator;
    mapping(address => mapping(address => bool)) public hasVotedRemoveValidator;
    uint256 public numberOfValidators;
    uint256 public constant minimalNumberOfValidators = 3;

    constructor(address _validator1, address _validator2, address _validator3) {
        validators[_validator1] = true;
        validatorsList.push(_validator1);
        numberOfValidators++;
        validators[_validator2] = true;
        validatorsList.push(_validator2);
        numberOfValidators++;
        validators[_validator3] = true;
        validatorsList.push(_validator3);
        numberOfValidators++;
    }

    function submitCertificate(
        Certificate calldata _certificate
    ) external onlyValidator {
        bytes32 _hash = keccak256(abi.encode(_certificate));
        console.logBytes32(_hash);
        if (certificates[_hash]) revert CertificateAlreadyAdded(_certificate);

        if (hasVotedAddCertificate[_hash][msg.sender])
            revert AlreadyVotedForCertificate(_certificate);

        _submitCertificate(_hash, msg.sender);

        emit newCertificateRegistered(_certificate);
    }

    function _submitCertificate(bytes32 _hash, address _validator) internal {
        certificateAddVotes[_hash]++;
        hasVotedAddCertificate[_hash][_validator] = true;

        if (certificateAddVotes[_hash] >= _getQuorumNumberOfValidators()) {
            certificates[_hash] = true;
            _clearCertificateVotes(_hash, true);
        }
    }

    function invalidateCertificate(
        Certificate calldata _certificate
    ) external onlyValidator {
        bytes32 _hash = keccak256(abi.encode(_certificate));
        if (!certificates[_hash]) revert NotValidCertificate(_certificate);
        if (hasVotedRemoveCertificate[_hash][msg.sender])
            revert AlreadyVotedForCertificate(_certificate);

        _invalidateCertificate(_hash, msg.sender);

        emit certificateInvalidated(_certificate);
    }

    function _invalidateCertificate(
        bytes32 _hash,
        address _validator
    ) internal {
        certificateRemoveVotes[_hash]++;
        hasVotedRemoveCertificate[_hash][_validator] = true;

        if (certificateRemoveVotes[_hash] >= _getQuorumNumberOfValidators()) {
            certificates[_hash] = false;
            _clearCertificateVotes(_hash, false);
        }
    }

    function _clearCertificateVotes(bytes32 _hash, bool _flag) internal {
        if (_flag) {
            for (uint256 i = 0; i < validatorsList.length; i++) {
                hasVotedAddCertificate[_hash][validatorsList[i]] = false;
            }
            certificateAddVotes[_hash] = 0;
        } else {
            for (uint256 i = 0; i < validatorsList.length; i++) {
                hasVotedRemoveCertificate[_hash][validatorsList[i]] = false;
            }
            certificateRemoveVotes[_hash] = 0;
        }
    }

    function addValidator(address _validator) external onlyValidator {
        if (_validator == address(0)) revert ZeroAddress();
        if (validators[_validator]) revert ValidatorAlreadyAdded(_validator);
        if (hasVotedAddValidator[_validator][msg.sender])
            revert AlreadyVotedForValidator(_validator);

        _addValidator(_validator, msg.sender);

        emit validatorAdded(_validator);
    }

    function _addValidator(address _validator, address _sender) internal {
        validatorAddVotes[_validator]++;
        hasVotedAddValidator[_validator][_sender] = true;

        if (validatorAddVotes[_validator] >= _getQuorumNumberOfValidators()) {
            validators[_validator] = true;
            validatorsList.push(_validator);
            numberOfValidators++;
            _clearValidatorVotes(_validator, true);
        }
    }

    function removeValidator(address _validator) external onlyValidator {
        if (numberOfValidators == minimalNumberOfValidators)
            revert NotEnoughValidators(minimalNumberOfValidators);
        if (!validators[_validator]) revert NotValidator(_validator);
        if (hasVotedRemoveValidator[_validator][msg.sender])
            revert AlreadyVotedForValidator(_validator);

        _removeValidator(_validator, msg.sender);

        emit validatorRemoved(_validator);
    }

    function _removeValidator(address _validator, address _sender) internal {
        validatorRemoveVotes[_validator]++;
        hasVotedRemoveValidator[_validator][_sender] = true;

        if (
            validatorRemoveVotes[_validator] >= _getQuorumNumberOfValidators()
        ) {
            validators[_validator] = false;
            _removeValidatorFromList(_validator);
            numberOfValidators--;
            _clearValidatorVotes(_validator, false);
        }
    }

    function _clearValidatorVotes(address _validator, bool _flag) internal {
        if (_flag) {
            for (uint256 i = 0; i < validatorsList.length; i++) {
                hasVotedAddValidator[_validator][validatorsList[i]] = false;
            }
            validatorAddVotes[_validator] = 0;
        } else {
            for (uint256 i = 0; i < validatorsList.length; i++) {
                hasVotedRemoveValidator[_validator][validatorsList[i]] = false;
            }
            validatorRemoveVotes[_validator] = 0;
        }
    }

    function _removeValidatorFromList(address _validator) internal {
        for (uint256 i = 0; i < validatorsList.length; i++) {
            if (validatorsList[i] == _validator) {
                validatorsList[i] = validatorsList[validatorsList.length - 1];
                validatorsList.pop();
                break;
            }
        }
    }

    function _getQuorumNumberOfValidators()
        internal
        view
        returns (uint8 _quorum)
    {
        // return (validatorsCount * 2) / 3 + ((validatorsCount * 2) % 3 == 0 ? 0 : 1); is same as (A + B - 1) / B
        assembly {
            _quorum := div(add(mul(sload(numberOfValidators.slot), 2), 2), 3)
        }
        return _quorum;
    }

    function getValidators() external view returns (address[] memory) {
        return validatorsList;
    }

    modifier onlyValidator() {
        if (!validators[msg.sender]) revert NotValidator(msg.sender);
        _;
    }
}
