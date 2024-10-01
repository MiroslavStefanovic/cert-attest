import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployGatewayFixtures } from "./fixtures";

describe("Gateway Contract", function () {
  describe("Validator", function () {
    it("Number of validators after deployment should be 3", async function () {
      const { gateway } = await loadFixture(deployGatewayFixtures);

      expect(await gateway.numberOfValidators()).to.equal(3);
    });
    it("Number of validators after deployment correct validators should be set", async function () {
      const { gateway, validator1, validator2, validator3, validator4 } = await loadFixture(deployGatewayFixtures);

      expect(await gateway.validators(validator1)).to.be.true;
      expect(await gateway.validators(validator2)).to.be.true;
      expect(await gateway.validators(validator3)).to.be.true;
      expect(await gateway.validators(validator4)).to.be.false;
    });
    it("Only Validator can call addValidator", async function () {
      const { gateway, validator4 } = await loadFixture(deployGatewayFixtures);

      await expect(gateway.connect(validator4).addValidator(validator4)).to.be.revertedWithCustomError(
        gateway,
        "NotValidator"
      );
    });
    it("New validator proposal should reverted if it is zero address", async function () {
      const { gateway, validator1 } = await loadFixture(deployGatewayFixtures);

      await expect(gateway.connect(validator1).addValidator(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        gateway,
        "ZeroAddress"
      );
    });
    it("New validator should be reverted if address is already validator", async function () {
      const { gateway, validator1 } = await loadFixture(deployGatewayFixtures);

      await expect(gateway.connect(validator1).addValidator(validator1)).to.be.revertedWithCustomError(
        gateway,
        "ValidatorAlreadyAdded"
      );
    });
    it("New validator should be reverted if proposer already voted for that validator", async function () {
      const { gateway, validator1, validator4 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).addValidator(validator4);

      await expect(gateway.connect(validator1).addValidator(validator4)).to.be.revertedWithCustomError(
        gateway,
        "AlreadyVotedForValidator"
      );
    });
    it("New validator should not be added if there is no consensus", async function () {
      const { gateway, validator1, validator4 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).addValidator(validator4);

      expect(await gateway.validators(validator4)).to.be.false;
    });
    it("Number of votes should be registered after proposal", async function () {
      const { gateway, validator1, validator4 } = await loadFixture(deployGatewayFixtures);

      expect(await gateway.validatorAddVotes(validator4)).to.be.equal(0);

      await gateway.connect(validator1).addValidator(validator4);

      expect(await gateway.validatorAddVotes(validator4)).to.be.equal(1);
    });
    it("New add vote should be registered after proposal", async function () {
      const { gateway, validator1, validator4 } = await loadFixture(deployGatewayFixtures);

      expect(await gateway.hasVotedAddValidator(validator4, validator1)).to.be.false;

      await gateway.connect(validator1).addValidator(validator4);

      expect(await gateway.hasVotedAddValidator(validator4, validator1)).to.be.true;
    });
    it("New validator should be added if there is consensus", async function () {
      const { gateway, validator1, validator2, validator4 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).addValidator(validator4);

      expect(await gateway.validators(validator4)).to.be.false;

      await gateway.connect(validator2).addValidator(validator4);

      expect(await gateway.validators(validator4)).to.be.true;
      expect(await gateway.numberOfValidators()).to.be.equal(4);
    });
    it("Add votes should be cleared after consensus is reached", async function () {
      const { gateway, validator1, validator2, validator4 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).addValidator(validator4);

      expect(await gateway.validatorAddVotes(validator4)).to.be.equal(1);
      expect(await gateway.hasVotedAddValidator(validator4, validator1)).to.be.true;

      await gateway.connect(validator2).addValidator(validator4);

      let index = 0;
      const validatorList = await gateway.getValidators();
      for (index = 0; index < validatorList.length; index++) {
        if (validatorList[index] == validator4.address) {
          index++;
          break;
        }
      }

      expect(index).not.to.be.equal(0);

      expect(await gateway.validatorAddVotes(validator4)).to.be.equal(0);
      expect(await gateway.hasVotedAddValidator(validator4, validator1)).to.be.false;
      expect(await gateway.hasVotedAddValidator(validator4, validator2)).to.be.false;
    });
    it("Only Validator can call removeValidator", async function () {
      const { gateway, validator4 } = await loadFixture(deployGatewayFixtures);

      await expect(gateway.connect(validator4).removeValidator(validator4)).to.be.revertedWithCustomError(
        gateway,
        "NotValidator"
      );
    });
    it("Validator can not be removed if the number of validators will fall under minimal value", async function () {
      const { gateway, validator1, validator4 } = await loadFixture(deployGatewayFixtures);

      await expect(gateway.connect(validator1).removeValidator(validator4)).to.be.revertedWithCustomError(
        gateway,
        "NotEnoughValidators"
      );
    });
    it("Only Validator can be removed from validators", async function () {
      const { gateway, validator1, validator2, validator4, validator5 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).addValidator(validator4);
      await gateway.connect(validator2).addValidator(validator4);

      await expect(gateway.connect(validator1).removeValidator(validator5)).to.be.revertedWithCustomError(
        gateway,
        "NotValidator"
      );
    });
    it("Removal of validator should be reverted if proposer already voted for that removal", async function () {
      const { gateway, validator1, validator2, validator4 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).addValidator(validator4);
      await gateway.connect(validator2).addValidator(validator4);

      await gateway.connect(validator1).removeValidator(validator4);

      await expect(gateway.connect(validator1).removeValidator(validator4)).to.be.revertedWithCustomError(
        gateway,
        "AlreadyVotedForValidator"
      );
    });
    it("Validator should not be removed if there is no consensus", async function () {
      const { gateway, validator1, validator2, validator4 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).addValidator(validator4);
      await gateway.connect(validator2).addValidator(validator4);

      expect(await gateway.validators(validator4)).to.be.true;

      await gateway.connect(validator1).removeValidator(validator4);

      expect(await gateway.validators(validator4)).to.be.true;
    });
    it("Number of votes should be registered after proposal", async function () {
      const { gateway, validator1, validator2, validator4 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).addValidator(validator4);
      await gateway.connect(validator2).addValidator(validator4);

      expect(await gateway.validatorRemoveVotes(validator4)).to.be.equal(0);

      await gateway.connect(validator1).removeValidator(validator4);

      expect(await gateway.validatorRemoveVotes(validator4)).to.be.equal(1);
    });
    it("New remove vote should be registered after proposal", async function () {
      const { gateway, validator1, validator2, validator4 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).addValidator(validator4);
      await gateway.connect(validator2).addValidator(validator4);

      expect(await gateway.hasVotedRemoveValidator(validator4, validator1)).to.be.false;

      await gateway.connect(validator1).removeValidator(validator4);

      expect(await gateway.hasVotedRemoveValidator(validator4, validator1)).to.be.true;
    });
    it("Validator should be removed if there is consensus", async function () {
      const { gateway, validator1, validator2, validator3, validator4 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).addValidator(validator4);
      await gateway.connect(validator2).addValidator(validator4);

      await gateway.connect(validator1).removeValidator(validator4);

      expect(await gateway.validators(validator4)).to.be.true;

      await gateway.connect(validator2).removeValidator(validator4);
      await gateway.connect(validator3).removeValidator(validator4);

      expect(await gateway.validators(validator4)).to.be.false;
      expect(await gateway.numberOfValidators()).to.be.equal(3);
    });
    it("Remove votes should be cleared after consensus is reached", async function () {
      const { gateway, validator1, validator2, validator3, validator4 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).addValidator(validator4);
      await gateway.connect(validator2).addValidator(validator4);

      await gateway.connect(validator1).removeValidator(validator4);

      expect(await gateway.validatorRemoveVotes(validator4)).to.be.equal(1);
      expect(await gateway.hasVotedRemoveValidator(validator4, validator1)).to.be.true;

      await gateway.connect(validator2).removeValidator(validator4);
      await gateway.connect(validator3).removeValidator(validator4);

      let index = 0;
      const validatorList = await gateway.getValidators();
      for (index = 0; index < validatorList.length; index++) {
        if (validatorList[index] == validator4.address) {
          index++;
          break;
        }
      }

      expect(index).not.to.be.equal(0);

      expect(await gateway.validatorRemoveVotes(validator4)).to.be.equal(0);
      expect(await gateway.hasVotedRemoveValidator(validator4, validator1)).to.be.false;
      expect(await gateway.hasVotedRemoveValidator(validator4, validator2)).to.be.false;
    });
  });
});
