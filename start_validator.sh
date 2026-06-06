#!/bin/bash

echo -e "\033[1;35m"
echo "┌────────────────────────────────────────────────────────┐"
echo "│         SOLANA LOCAL SANDBOX VALIDATOR ENGINE          │"
echo "└────────────────────────────────────────────────────────┘\033[0m"

ulimit -n 65535 2>/dev/null

echo "  [+] Booting isolated ledger network environment..."
echo "  [+] Storage Anchor: ./test-ledger"
echo "  [+] Hard resetting to fresh genesis state..."
echo "  [!] Keep this terminal window open to maintain the local cluster."
echo ""

# Fixed: Removed the conflicting --log flag so it initializes cleanly
solana-test-validator \
    --reset \
    --quiet
