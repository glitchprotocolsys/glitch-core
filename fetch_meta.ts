import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getTokenMetadata } from "@solana/spl-token";
import * as fs from "fs";

async function main() {
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");

    if (!fs.existsSync(".active_mint")) {
        console.error("[!] Error: No active mint file found. Run deploy_meta.ts first.");
        return;
    }
    const mintAddressStr = fs.readFileSync(".active_mint", "utf8").trim();
    const mintAddress = new PublicKey(mintAddressStr);

    console.log("┌────────────────────────────────────────────────────────┐");
    console.log("│         TOKEN-2022 ON-CHAIN TELEMETRY METRIC           │");
    console.log("└────────────────────────────────────────────────────────┘");
    console.log("  [+] Querying Local RPC Node...");
    console.log("  [+] Target Mint: " + mintAddress.toBase58());

    try {
        const metadata = await getTokenMetadata(connection, mintAddress);

        if (!metadata) {
            console.log("\n[!] Error: No inline metadata layout found on this account space.");
            return;
        }

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