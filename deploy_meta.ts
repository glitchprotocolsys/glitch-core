import { 
    Connection, 
    Keypair, 
    SystemProgram, 
    Transaction, 
    sendAndConfirmTransaction
} from '@solana/web3.js';
import { 
    ExtensionType, 
    TOKEN_2022_PROGRAM_ID, 
    getMintLen, 
    createInitializeMetadataPointerInstruction, 
    createInitializeMintInstruction 
} from '@solana/spl-token';
import { 
    createInitializeInstruction, 
    pack 
} from '@solana/spl-token-metadata';
import * as fs from 'fs';

async function main() {
    // 1. Hook up the sandbox network connection
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");
    
    // 2. Generate permanent execution authorities for this runtime block
    const payer = Keypair.generate();
    const mint = Keypair.generate();
    
    console.log("usr/deploy/matrix: online");
    console.log(`Generated Wallet: ${payer.publicKey.toBase58()}`);
    console.log(`Target Mint:      ${mint.publicKey.toBase58()}`);

    // 3. Fund the runtime payer key directly inside the sandbox genesis block
    console.log("  [+] Funding deployment authority with local sandbox SOL...");
    const airdropSig = await connection.requestAirdrop(payer.publicKey, 2 * 1000000000); // 2 SOL
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
        signature: airdropSig,
        ...latestBlockhash
    });

    // 4. Define the token metadata state profile
    const metaData = {
        updateAuthority: payer.publicKey,
        mint: mint.publicKey,
        name: "Glitch Protocol",
        symbol: "GLITCH",
        uri: "https://glitch.io/meta.json",
        additionalMetadata: []
    };

    // 5. Compute rental spaces
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = 4 + pack(metaData).length; // 4 bytes for type/length overhead
    const totalLen = mintLen + metadataLen;

    const rentLamports = await connection.getMinimumBalanceForRentExemption(totalLen);
    console.log(`Allocating Space: Mint Layout (${mintLen}B) + Metadata (${metadataLen}B)`);
    console.log(`Required Minimum Rent Balance: ${rentLamports} lamports`);

    // 6. Assemble the atomic transaction instructions
    const transaction = new Transaction().add(
        // Allocates raw byte storage footprint on the blockchain log
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint.publicKey,
            space: mintLen,
            lamports: rentLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        // Binds the extension pointer straight to the mint layout allocation
        createInitializeMetadataPointerInstruction(
            mint.publicKey,
            payer.publicKey,
            mint.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        // Initializes the base mint configuration parameters
        createInitializeMintInstruction(
            mint.publicKey,
            9, // Decimals base factor
            payer.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID
        ),
        // Commits the Borsh metadata structure fields into the custom space
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mint.publicKey,
            updateAuthority: payer.publicKey,
            mint: mint.publicKey,
            mintAuthority: payer.publicKey,
            name: metaData.name,
            symbol: metaData.symbol,
            uri: metaData.uri,
        })
    );

    // 7. Sign and broadcast payload directly to the local validator cluster
    console.log("  [+] Signing and broadcasting block initialization payload...");
    await sendAndConfirmTransaction(connection, transaction, [payer, mint]);

    // 8. Save the active address coordinate
    fs.writeFileSync('.active_mint', mint.publicKey.toBase58());
    console.log("Matrix built. System ready. Mint saved to .active_mint\n");
}

main().catch(err => {
    console.error("\n[!] Deployment pipeline faulted:", err);
});
