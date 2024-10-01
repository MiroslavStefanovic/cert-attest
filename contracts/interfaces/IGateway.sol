// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

interface IGateway {
    struct Certificate {
        Person person;
        Institution institution;
        string certificateId;
    }

    struct Institution {
        string name;
        string country;
    }

    struct Person {
        string id;
        string firstName;
        string middleName;
        string lastName;
    }

    function submitCertificate(Certificate calldata _certificate) external;

    event newCertificateRegistered(Certificate certificate);
    event certificateInvalidated(Certificate certificate);
    event validatorAdded(address validator);
    event validatorRemoved(address validator);

    error NotValidator(address sender);
    error NotValidCertificate(Certificate certificate);
    error NotEnoughValidators(uint256 minimalNumberOfValidators);
    error CertificateAlreadyAdded(Certificate certificate);
    error AlreadyVotedForCertificate(Certificate certificate);
    error AlreadyVotedForValidator(address validator);
    error ValidatorAlreadyAdded(address validator);
    error ZeroAddress();
}
