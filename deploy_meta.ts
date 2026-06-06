import { 
    Connection, 
    Keypair, 
    SystemProgram, 
    Transaction, 
    clusterApiUrl, 
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

async function main() {
    // 1. Connect to the Devnet Cluster
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    
    // 2. Generate deployment keypairs
    const payer = Keypair.generate();
    const mint = Keypair.generate();
    
    console.log("┌────────────────────────────────────────────────────────┐");
    Generated Wallet: ${payer.publicKey.toBase58()}`);
    Target Mint:     ${mint.publicKey.toBase58()}`);
    console.log("└────────────────────────────────────────────────────────┘");

    // Define metadata parameters matching our parser check
    const metaData = {
        updateAuthority: payer.publicKey,
        mint: mint.publicKey,
        name: "Glitch Protocol",
        symbol: "GLITCH",
        uri: "https://glitch.io/meta.json",
        additionalMetadata: []
    };

    // Calculate space allocations dynamically
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metaData).length;
    
    console.log(`\n  [+] Allocating Space: Mint Layout (${mintLen}B) + Metadata (${metadataLen}B)`);
    
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

    // 3. Build the Transaction Payload
    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint.publicKey,
            space: mintLen,
            lamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
            mint.publicKey,
            payer.publicKey,
            mint.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
            mint.publicKey,
            9, // Decimals
            payer.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID
        ),
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

    console.log("  [+] Matrix built. Ready for deployment pipeline execution.");
    // Instructions note: Ensure payer has test lamports via airdrop before executing live.
}

const TYPE_SIZE = 2;
const LENGTH_SIZE = 2;

main().catch(err => {
    console.error("\n[!] Deployment pipeline faulted:", err);
});
