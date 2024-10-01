import { ethers } from "hardhat";

export async function deployGatewayFixtures() {
  // Contracts are deployed using the first signer/account by default
  const [owner, validator1, validator2, validator3, validator4, validator5] = await ethers.getSigners();

  const Gateway = await ethers.getContractFactory("Gateway");
  const gateway = await Gateway.deploy(validator1.address, validator2.address, validator3.address);

  const certificate = {
    certificateId: "12345",
    person: {
      id: "67890",
      firstName: "John",
      middleName: "H.",
      lastName: "Doe",
    },
    institution: {
      name: "Example University",
      country: "EU",
    },
  };

  const certificateHash = "0xd84285e1aa0a37fdecb3a887621f77e4f065389a36bf49ca9628c5d9861d4449";

  return {
    owner,
    validator1,
    validator2,
    validator3,
    validator4,
    validator5,
    gateway,
    certificate,
    certificateHash,
  };
}
