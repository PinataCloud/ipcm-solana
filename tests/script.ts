import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ipcm } from "../target/types/ipcm";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

async function main() {
  console.log("Starting IPCM interaction script...\n");

  // Configure the connection to the cluster
  const connection = new Connection("http://localhost:8899", "confirmed");

  // Initialize provider with your wallet
  const wallet = anchor.Wallet.local(); // Uses default keypair at ~/.config/solana/id.json
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  // Generate a new keypair for the IPCM account
  const ipcmAccount = anchor.web3.Keypair.generate();
  console.log("Generated IPCM account:", ipcmAccount.publicKey.toString());

  try {
    // Load the program
    const program = anchor.workspace.Ipcm as Program<Ipcm>;
    console.log("Program ID:", program.programId.toString());

    // 1. Initialize the IPCM account
    console.log("\nInitializing IPCM account...");
    await program.methods
      .initialize()
      .accounts({
        ipcmAccount: ipcmAccount.publicKey,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ipcmAccount])
      .rpc();

    // Fetch and display initial state
    let account = await program.account.ipcmAccount.fetch(ipcmAccount.publicKey);
    console.log("Initial state:");
    console.log("- Owner:", account.owner.toString());
    console.log("- CID Mapping:", account.cidMapping);

    // 2. Update the mapping
    const newMapping = "QmNewTestCID123";
    console.log("\nUpdating mapping to:", newMapping);

    await program.methods
      .updateMapping(newMapping)
      .accounts({
        ipcmAccount: ipcmAccount.publicKey,
        owner: provider.wallet.publicKey,
      })
      .rpc();

    // Fetch and display updated state
    account = await program.account.ipcmAccount.fetch(ipcmAccount.publicKey);
    console.log("Updated state:");
    console.log("- CID Mapping:", account.cidMapping);

    // 3. Get the mapping
    console.log("\nRetrieving mapping...");
    account = await program.account.ipcmAccount.fetch(ipcmAccount.publicKey);
    console.log("Current mapping value:", account.cidMapping);

    // 4. Demonstrate failed update with wrong owner
    console.log("\nTrying to update with wrong owner...");
    const wrongOwner = Keypair.generate();
    try {
      await program.methods
        .updateMapping("QmWrongOwnerTest")
        .accounts({
          ipcmAccount: ipcmAccount.publicKey,
          owner: wrongOwner.publicKey,
        })
        .signers([wrongOwner])
        .rpc();
    } catch (error) {
      console.log("Expected error occurred:", error.message);
    }

  } catch (error) {
    console.error("\nError:", error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
