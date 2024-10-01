import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployGatewayFixtures } from "./fixtures";

describe("Gateway Contract", function () {
  describe("Certificate", function () {
    it("Only Validator can call submitCertificate", async function () {
      const { gateway, certificate, validator4 } = await loadFixture(deployGatewayFixtures);

      await expect(gateway.connect(validator4).submitCertificate(certificate)).to.be.revertedWithCustomError(
        gateway,
        "NotValidator"
      );
    });
    it("New certificate should be reverted if it already confirmed", async function () {
      const { gateway, certificate, validator1, validator2, validator3 } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).submitCertificate(certificate);
      await gateway.connect(validator2).submitCertificate(certificate);

      await expect(gateway.connect(validator3).submitCertificate(certificate)).to.be.revertedWithCustomError(
        gateway,
        "CertificateAlreadyAdded"
      );
    });
    it("New cerificate proposal should be reverted if proposer already voted for that certificate", async function () {
      const { gateway, validator1, certificate } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).submitCertificate(certificate);

      await expect(gateway.connect(validator1).submitCertificate(certificate)).to.be.revertedWithCustomError(
        gateway,
        "AlreadyVotedForCertificate"
      );
    });
    it("New certificate should not be added if there is no consensus", async function () {
      const { gateway, validator1, certificate, certificateHash } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).submitCertificate(certificate);

      expect(await gateway.certificates(certificateHash)).to.be.false;
    });
    it("Number of votes should be registered after proposal", async function () {
      const { gateway, validator1, certificate, certificateHash } = await loadFixture(deployGatewayFixtures);

      expect(await gateway.certificateAddVotes(certificateHash)).to.be.equal(0);

      await gateway.connect(validator1).submitCertificate(certificate);

      expect(await gateway.certificateAddVotes(certificateHash)).to.be.equal(1);
    });
    it("New vote should be registered after proposal", async function () {
      const { gateway, validator1, certificate, certificateHash } = await loadFixture(deployGatewayFixtures);

      expect(await gateway.hasVotedAddCertificate(certificateHash, validator1)).to.be.false;

      await gateway.connect(validator1).submitCertificate(certificate);

      expect(await gateway.hasVotedAddCertificate(certificateHash, validator1)).to.be.true;
    });
    it("New certificate should be added if there is consensus", async function () {
      const { gateway, validator1, validator2, certificate, certificateHash } = await loadFixture(
        deployGatewayFixtures
      );

      await gateway.connect(validator1).submitCertificate(certificate);

      expect(await gateway.certificates(certificateHash)).to.be.false;

      await gateway.connect(validator2).submitCertificate(certificate);

      expect(await gateway.certificates(certificateHash)).to.be.true;
    });
    it("Add votes should be cleared after consensus is reached", async function () {
      const { gateway, validator1, validator2, certificate, certificateHash } = await loadFixture(
        deployGatewayFixtures
      );

      await gateway.connect(validator1).submitCertificate(certificate);

      expect(await gateway.certificateAddVotes(certificateHash)).to.be.equal(1);
      expect(await gateway.hasVotedAddCertificate(certificateHash, validator1)).to.be.true;

      await gateway.connect(validator2).submitCertificate(certificate);

      expect(await gateway.certificateAddVotes(certificateHash)).to.be.equal(0);
      expect(await gateway.hasVotedAddCertificate(certificateHash, validator1)).to.be.false;
      expect(await gateway.hasVotedAddCertificate(certificateHash, validator2)).to.be.false;
    });
    it("Only Validator can call invalidateCertificate", async function () {
      const { gateway, certificate, validator4 } = await loadFixture(deployGatewayFixtures);

      await expect(gateway.connect(validator4).invalidateCertificate(certificate)).to.be.revertedWithCustomError(
        gateway,
        "NotValidator"
      );
    });
    it("Only Validator can be removed from validators", async function () {
      const { gateway, validator1, certificate } = await loadFixture(deployGatewayFixtures);

      await expect(gateway.connect(validator1).invalidateCertificate(certificate)).to.be.revertedWithCustomError(
        gateway,
        "NotValidCertificate"
      );
    });
    it("Invalidation of certificate should be reverted if proposer already voted for that removal", async function () {
      const { gateway, validator1, validator2, certificate } = await loadFixture(deployGatewayFixtures);

      await gateway.connect(validator1).submitCertificate(certificate);
      await gateway.connect(validator2).submitCertificate(certificate);

      await gateway.connect(validator1).invalidateCertificate(certificate);

      await expect(gateway.connect(validator1).invalidateCertificate(certificate)).to.be.revertedWithCustomError(
        gateway,
        "AlreadyVotedForCertificate"
      );
    });
    it("Certificate should not be removed if there is no consensus", async function () {
      const { gateway, validator1, validator2, certificate, certificateHash } = await loadFixture(
        deployGatewayFixtures
      );

      await gateway.connect(validator1).submitCertificate(certificate);
      await gateway.connect(validator2).submitCertificate(certificate);

      expect(await gateway.certificates(certificateHash)).to.be.true;

      await gateway.connect(validator1).invalidateCertificate(certificate);

      expect(await gateway.certificates(certificateHash)).to.be.true;
    });
    it("Number of votes should be registered after proposal", async function () {
      const { gateway, validator1, validator2, certificate, certificateHash } = await loadFixture(
        deployGatewayFixtures
      );

      await gateway.connect(validator1).submitCertificate(certificate);
      await gateway.connect(validator2).submitCertificate(certificate);

      expect(await gateway.certificateRemoveVotes(certificateHash)).to.be.equal(0);

      await gateway.connect(validator1).invalidateCertificate(certificate);

      expect(await gateway.certificateRemoveVotes(certificateHash)).to.be.equal(1);
    });
    it("New invalidate vote should be registered after proposal", async function () {
      const { gateway, validator1, validator2, certificate, certificateHash } = await loadFixture(
        deployGatewayFixtures
      );

      await gateway.connect(validator1).submitCertificate(certificate);
      await gateway.connect(validator2).submitCertificate(certificate);

      expect(await gateway.hasVotedRemoveCertificate(certificateHash, validator1)).to.be.false;

      await gateway.connect(validator1).invalidateCertificate(certificate);

      expect(await gateway.hasVotedRemoveCertificate(certificateHash, validator1)).to.be.true;
    });
    it("Certificate should be invalidated if there is consensus", async function () {
      const { gateway, validator1, validator2, certificate, certificateHash } = await loadFixture(
        deployGatewayFixtures
      );

      await gateway.connect(validator1).submitCertificate(certificate);
      await gateway.connect(validator2).submitCertificate(certificate);

      expect(await gateway.certificates(certificateHash)).to.be.true;

      await gateway.connect(validator1).invalidateCertificate(certificate);
      await gateway.connect(validator2).invalidateCertificate(certificate);

      expect(await gateway.certificates(certificateHash)).to.be.false;
    });
    it("Invalidate votes should be cleared after consensus is reached", async function () {
      const { gateway, validator1, validator2, certificate, certificateHash } = await loadFixture(
        deployGatewayFixtures
      );

      await gateway.connect(validator1).submitCertificate(certificate);
      await gateway.connect(validator2).submitCertificate(certificate);

      await gateway.connect(validator1).invalidateCertificate(certificate);

      expect(await gateway.certificateRemoveVotes(certificateHash)).to.be.equal(1);
      expect(await gateway.hasVotedRemoveCertificate(certificateHash, validator1)).to.be.true;

      await gateway.connect(validator2).invalidateCertificate(certificate);

      expect(await gateway.certificateRemoveVotes(certificateHash)).to.be.equal(0);
      expect(await gateway.hasVotedRemoveCertificate(certificateHash, validator1)).to.be.false;
      expect(await gateway.hasVotedRemoveCertificate(certificateHash, validator2)).to.be.false;
    });
  });
});
