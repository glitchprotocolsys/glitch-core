import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { getTokenMetadata } from '@solana/spl-token-metadata';

async function main() {
    // 1. Establish connection to your running local sandbox
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");

    // 2. Target the exact Mint Address generated during your test execution
    // Replace this string with the specific Target Mint address from your console log
    const mintAddress = new PublicKey("CoWE6rbeuvnYju2imFaQFZVyo7GAEU6PYYsmw1ukHygo");

    console.log("┌────────────────────────────────────────────────────────┐");
    console.log("│         TOKEN-2022 ON-CHAIN TELEMETRY METRIC           │");
    console.log("└────────────────────────────────────────────────────────┘");
    console.log(`  [+] Querying Local RPC Node...`);
    console.log(`  [+] Target Mint: ${mintAddress.toBase58()}`);

    try {
        // 3. Fetch and extract the Borsh metadata structure directly from the account data
        const metadata = await getTokenMetadata(connection, mintAddress);

        if (!metadata) {
            console.log("\n[!] Error: No inline metadata layout found on this account space.");
            return;
        }

        // 4. Output the official on-chain state matrix
        console.log("\n[★] PARSE MATRIX RETRIEVED SUCCESSFULLY:");
        console.log(JSON.stringify({
            programId: TOKEN_2022_PROGRAM_ID.toBase58(),
            mint: metadata.mint.toBase58(),
            updateAuthority: metadata.updateAuthority?.toBase58() || "None",
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri
        }, null, 4));

    } catch (err) {
        console.error("\n[!] Failed to pull or decode on-chain data layer:", err);
    }
}

main();
