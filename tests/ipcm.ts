import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ipcm } from "../target/types/ipcm";
import { expect } from "chai";

describe("ipcm", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Ipcm as Program<Ipcm>;
  const owner = provider.wallet;

  // Generate a new keypair for the IPCM account
  const ipcmAccount = anchor.web3.Keypair.generate();

  it("Initializes the IPCM account", async () => {
    try {
      // Initialize the IPCM account
      await program.methods
        .initialize()
        .accounts({
          ipcmAccount: ipcmAccount.publicKey,
          owner: owner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([ipcmAccount])
        .rpc();

      // Fetch the account and verify its data
      const account = await program.account.ipcmAccount.fetch(
        ipcmAccount.publicKey
      );

      expect(account.owner.toString()).to.equal(owner.publicKey.toString());
      expect(account.cidMapping).to.equal("");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  it("Updates the mapping", async () => {
    const newMapping = "QmTest123";

    try {
      // Update the mapping
      await program.methods
        .updateMapping(newMapping)
        .accounts({
          ipcmAccount: ipcmAccount.publicKey,
          owner: owner.publicKey,
        })
        .rpc();

      // Fetch the account and verify the update
      const account = await program.account.ipcmAccount.fetch(
        ipcmAccount.publicKey
      );

      expect(account.cidMapping).to.equal(newMapping);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  it("Gets the mapping", async () => {
    try {
      // Fetch the mapping using the get_mapping instruction
      const account = await program.account.ipcmAccount.fetch(
        ipcmAccount.publicKey
      );

      expect(account.cidMapping).to.equal("QmTest123");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  it("Fails to update mapping with wrong owner", async () => {
    // Generate a new keypair to act as a different user
    const wrongOwner = anchor.web3.Keypair.generate();
    const newMapping = "QmTest456";

    try {
      // Try to update the mapping with wrong owner
      await program.methods
        .updateMapping(newMapping)
        .accounts({
          ipcmAccount: ipcmAccount.publicKey,
          owner: wrongOwner.publicKey,
        })
        .signers([wrongOwner])
        .rpc();

      // If we reach here, the test should fail
      expect.fail("Expected an error but got success");
    } catch (error) {
      // Verify that the error is related to unauthorized access
      expect(error.toString()).to.include("UnauthorizedAccess");
    }
  });
});
