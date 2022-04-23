import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Gifportal } from "../target/types/gifportal";

// describe("gifportal", () => {
//   const program = anchor.workspace.Gifportal as Program<Gifportal>;

//   it("Is initialized!", async () => {
//     // Add your test here.
//     const tx = await program.methods.initialize().rpc();
//     console.log("Your transaction signature", tx);
//   });
// });

const main = async () => {
  console.log('Starting tests...');
  const provider = anchor.AnchorProvider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);
  const program = anchor.workspace.Gifportal;
  const baseAccount = anchor.web3.Keypair.generate();
  const tx = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    },
    signers: [baseAccount]
  });
  console.log('Your transaction signature:', tx);

  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('GIF Count:', account.totalGifs.toString());

  await program.rpc.addGif('https://c.tenor.com/xVW76fGc_OYAAAAd/heiitse-cfc.gif', {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    }
  });
  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('GIF Count:', account.totalGifs.toString());
  console.log('GIF List:', account.gifList);
}

main();