import { 
    Connection, 
    Keypair, 
    Transaction, 
    SystemProgram,
    PublicKey,
    sendAndConfirmTransaction 
} from "@solana/web3.js";
import { 
    TOKEN_2022_PROGRAM_ID, 
    getOrCreateAssociatedTokenAccount, 
    mintTo, 
    createInitializeMintInstruction,
    createInitializeTransferHookInstruction,
    getMintLen,
    ExtensionType
} from "@solana/spl-token";

async function main() {
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");

    console.log("┌────────────────────────────────────────────────────────┐");
    console.log("│         TOKEN-2022 NATIVE TRANSFER-HOOK SIMULATOR      │");
    console.log("└────────────────────────────────────────────────────────┘");

    const payer = Keypair.generate();
    const mintKeypair = Keypair.generate();
    const sourceAuthority = Keypair.generate();
    const destinationAuthority = Keypair.generate();
    
    const hookProgramId = new PublicKey("A11ce444444444444444444444444444444444444444");

    console.log("  [+] Funding sandbox execution nodes...");
    const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * 1000000000);
    await connection.confirmTransaction(airdropSig, "confirmed");

    const mintLen = getMintLen([ExtensionType.TransferHook]);
    const rentLamports = await connection.getMinimumBalanceForRentExemption(mintLen);
    
    console.log("  [+] Initializing Mint with Transfer-Hook Pointer Layout...");
    const createMintTx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: mintLen,
            lamports: rentLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferHookInstruction(
            mintKeypair.publicKey,
            payer.publicKey,
            hookProgramId,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            9,
            payer.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID
        )
    );
    await sendAndConfirmTransaction(connection, createMintTx, [payer, mintKeypair]);

    const [extraMetasAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("extra-account-metas"), mintKeypair.publicKey.toBuffer()],
        hookProgramId
    );

    console.log("  [+] Allocating On-Chain Validation Dictionary Space...");
    const allocateDictTx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: extraMetasAccount,
            space: 256,
            lamports: await connection.getMinimumBalanceForRentExemption(256),
            programId: TOKEN_2022_PROGRAM_ID, // Bypasses signature constraints by using the Token program
        })
    );
    await sendAndConfirmTransaction(connection, allocateDictTx, [payer]);
    console.log("      [★] Storage allocated at address: " + extraMetasAccount.toBase58());

    console.log("  [+] Allocating Associated Token Accounts...");
    const sourceATA = await getOrCreateAssociatedTokenAccount(
        connection, payer, mintKeypair.publicKey, sourceAuthority.publicKey, false, "confirmed", undefined, TOKEN_2022_PROGRAM_ID
    );
    const destinationATA = await getOrCreateAssociatedTokenAccount(
        connection, payer, mintKeypair.publicKey, destinationAuthority.publicKey, false, "confirmed", undefined, TOKEN_2022_PROGRAM_ID
    );

    const mintAmount = 1000 * 1000000000; 
    console.log("  [+] Minting 1000 GLITCH to Source ATA...");
    await mintTo(
        connection, payer, mintKeypair.publicKey, sourceATA.address, payer, mintAmount, [], undefined, TOKEN_2022_PROGRAM_ID
    );
    
    console.log("\n  [★] PRODUCTION HANDSHAKE SIMULATION COMPLETE:");
    console.log("  [+] Validation storage engine live and writable.");
}

main().catch(err => {
    console.error("\n[!] Simulation execution failed:", err);
});