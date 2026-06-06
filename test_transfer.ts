import { 
    Connection, 
    Keypair, 
    Transaction, 
    SystemProgram,
    sendAndConfirmTransaction 
} from '@solana/web3.js';
import { 
    TOKEN_2022_PROGRAM_ID, 
    getOrCreateAssociatedTokenAccount, 
    mintTo, 
    transferChecked,
    createInitializeMintInstruction,
    getMintLen
} from '@solana/spl-token';

async function main() {
    // 1. Hook up sandbox cluster connection
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");

    console.log("┌────────────────────────────────────────────────────────┐");
    console.log("│         TOKEN-2022 TRANSACTION SIMULATION HARNESS     │");
    console.log("└────────────────────────────────────────────────────────┘");

    // 2. Setup runtime keys for our isolated sandbox test
    const payer = Keypair.generate();
    const mintKeypair = Keypair.generate();
    const sourceAuthority = Keypair.generate();
    const destinationAuthority = Keypair.generate();

    console.log("  [+] Allocating sandbox SOL to execution authorities...");
    const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * 1000000000); // 2 SOL
    await connection.confirmTransaction(airdropSig, "confirmed");

    // 3. Initialize a clean test mint on the fly to guarantee authority signatures match
    console.log(`  [+] Initializing temporary simulation mint: ${mintKeypair.publicKey.toBase58()}`);
    const mintLen = getMintLen([]);
    const rentLamports = await connection.getMinimumBalanceForRentExemption(mintLen);
    
    const createMintTx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: mintLen,
            lamports: rentLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            9,
            payer.publicKey, // Mint Authority
            null,
            TOKEN_2022_PROGRAM_ID
        )
    );
    await sendAndConfirmTransaction(connection, createMintTx, [payer, mintKeypair]);

    // 4. Initialize Associated Token Accounts (ATA) for both nodes
    console.log("  [+] Allocating Associated Token Accounts...");
    const sourceATA = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mintKeypair.publicKey,
        sourceAuthority.publicKey,
        false,
        "confirmed",
        undefined,
        TOKEN_2022_PROGRAM_ID
    );

    const destinationATA = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mintKeypair.publicKey,
        destinationAuthority.publicKey,
        false,
        "confirmed",
        undefined,
        TOKEN_2022_PROGRAM_ID
    );

    // 5. Mint initial supply token allocation into the source wallet (9 decimals base)
    const mintAmount = 1000 * 1000000000; 
    console.log(`  [+] Broadcasting MintTo instruction: +1,000 Tokens to Source ATA...`);
    await mintTo(
        connection,
        payer,
        mintKeypair.publicKey,
        sourceATA.address,
        payer, // Mint Authority signs here
        mintAmount,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    
    // 6. Build and broadcast the checked transfer transaction payload
    const transferAmount = 250 * 1000000000;
    console.log(`  [+] Broadcasting TransferChecked instruction: Moving 250 Tokens...`);
    
    const transferSig = await transferChecked(
        connection,
        payer,                    // Transaction fee payer
        sourceATA.address,         // Source Token Account
        mintKeypair.publicKey,     // Asset Mint address
        destinationATA.address,    // Destination Token Account
        sourceAuthority,          // Owner authority of source account signs here
        transferAmount,           // Transaction amount
        9,                        // Fixed Decimals factor validation
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );

    console.log(`\n  [★] TRANSFER SUCCESSFULLY CONFIRMED!`);
    console.log(`  [+] Signature: ${transferSig}`);
}

main().catch(err => {
    console.error("\n[!] Simulation execution failed:", err);
});
