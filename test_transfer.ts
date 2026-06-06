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

// Expanded Protocol Rule Engine with Whitelist Validation
function validateGlitchProtocolRules(source: string, destination: string, amount: number, whitelist: string[]) {
    console.log("\n  [⚙] Intercepting Transfer Matrix...");
    console.log("      Source ATA:        " + source);
    console.log("      Destination ATA:   " + destination);
    console.log("      Payload Quantity:  " + (amount / 1000000000) + " GLITCH");

    // Rule 1: Enforce transaction velocity ceiling cap
    const velocityCap = 500000 * 1000000000;
    if (amount > velocityCap) {
        throw new Error("Protocol Violation: Transaction volume exceeds maximum block velocity cap.");
    }

    // Rule 2: Enforce ecosystem restriction (Destination must be whitelisted)
    if (!whitelist.includes(destination)) {
        throw new Error("Restriction Violation: Destination address is not authenticated in the protocol registry.");
    }
    
    console.log("  [★] POL-MATRIX VALIDATION PASSED: Transaction parameters cleared.");
}

async function main() {
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");

    console.log("┌────────────────────────────────────────────────────────┐");
    console.log("│         TOKEN-2022 NATIVE TRANSFER-HOOK SIMULATOR      │");
    console.log("└────────────────────────────────────────────────────────┘");

    const payer = Keypair.generate();
    const mintKeypair = Keypair.generate();
    const sourceAuthority = Keypair.generate();
    const destinationAuthority = Keypair.generate();
    const rogueAuthority = Keypair.generate();
    
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
        createInitializeTransferHookInstruction(mintKeypair.publicKey, payer.publicKey, hookProgramId, TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mintKeypair.publicKey, 9, payer.publicKey, null, TOKEN_2022_PROGRAM_ID)
    );
    await sendAndConfirmTransaction(connection, createMintTx, [payer, mintKeypair]);

    console.log("  [+] Allocating Associated Token Accounts...");
    const sourceATA = await getOrCreateAssociatedTokenAccount(connection, payer, mintKeypair.publicKey, sourceAuthority.publicKey, false, "confirmed", undefined, TOKEN_2022_PROGRAM_ID);
    const destinationATA = await getOrCreateAssociatedTokenAccount(connection, payer, mintKeypair.publicKey, destinationAuthority.publicKey, false, "confirmed", undefined, TOKEN_2022_PROGRAM_ID);
    const rogueATA = await getOrCreateAssociatedTokenAccount(connection, payer, mintKeypair.publicKey, rogueAuthority.publicKey, false, "confirmed", undefined, TOKEN_2022_PROGRAM_ID);

    // Initialize the authorized protocol address registry
    const protocolWhitelist = [destinationATA.address.toBase58()];

    const mintAmount = 1000 * 1000000000; 
    console.log("  [+] Minting 1000 GLITCH to Source ATA...");
    await mintTo(connection, payer, mintKeypair.publicKey, sourceATA.address, payer, mintAmount, [], undefined, TOKEN_2022_PROGRAM_ID);
    
    // Test Scenario A: Authorized Transfer
    const transferAmountA = 100 * 1000000000;
    try {
        validateGlitchProtocolRules(sourceATA.address.toBase58(), destinationATA.address.toBase58(), transferAmountA, protocolWhitelist);
    } catch (e: any) {
        console.error("  [!] Intercept Rejection: " + e.message);
    }

    // Test Scenario B: Unauthorized/Rogue Transfer
    const transferAmountB = 50 * 1000000000;
    try {
        validateGlitchProtocolRules(sourceATA.address.toBase58(), rogueATA.address.toBase58(), transferAmountB, protocolWhitelist);
    } catch (e: any) {
        console.error("\n  [!] Intercept Rejection: " + e.message);
        console.log("  [★] SUCCESS: Protocol successfully blocked the unauthorized transaction.");
    }
}

main().catch(err => {
    console.error("\n[!] Simulation execution failed:", err);
});