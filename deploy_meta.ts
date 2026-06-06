import { 
    Connection, 
    Keypair, 
    SystemProgram, 
    Transaction, 
    clusterApiUrl 
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
    
    console.log("usr/deploy/matrix: online");
    console.log("Generated Wallet: " + payer.publicKey.toBase58());
    console.log("Target Mint:      " + mint.publicKey.toBase58());

    // Define metadata parameters matching our parser check
    const metaData = {
        updateAuthority: payer.publicKey,
        mint: mint.publicKey,
        name: "Glitch Protocol",
        symbol: "GLITCH",
        uri: "https://glitch.io/meta.json",
        additionalMetadata: []
    };

    const TYPE_SIZE = 2;
    const LENGTH_SIZE = 2;

    // Calculate space allocations dynamically
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metaData).length;
    
    console.log("Allocating Space: Mint Layout (" + mintLen + "B) + Metadata (" + metadataLen + "B)");
    
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
    console.log("Required Minimum Rent Balance (lamports): " + lamports);
    console.log("Matrix built. System ready.");
}

main().catch(err => {
    console.error("\n[!] Deployment pipeline faulted:", err);
});
