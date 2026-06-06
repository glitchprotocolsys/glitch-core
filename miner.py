import time
import os
import sys
import multiprocessing
from base58 import b58encode

try:
    from nacl.signing import SigningKey
except ImportError:
    print("[!] Installing missing dependency: pynacl")
    os.system("pip3 install pynacl base58")
    from nacl.signing import SigningKey
    from base58 import b58encode

def mine_worker(prefix, match_count, process_id):
    """Worker loop to generate keypairs and scan prefixes."""
    prefix = prefix.lower()
    attempts = 0
    start_time = time.time()
    
    while True:
        attempts += 1
        # Generate raw Ed25519 seed and keypair natively
        private_key = SigningKey.generate()
        public_key_bytes = private_key.verify_key.encode()
        public_address = b58encode(public_key_bytes).decode('utf-8')
        
        # Check matching criteria
        if public_address.lower().startswith(prefix):
            secret_key_bytes = private_key.encode() + private_key.verify_key.encode()
            secret_key_layout = list(secret_key_bytes)
            
            elapsed = max(time.time() - start_time, 0.001)
            speed = int(attempts / elapsed)
            
            print(f"\n\033[1;32m[★] MATCH FOUND BY WORKER {process_id}!\033[0m")
            print(f"  Address: {public_address}")
            print(f"  Secret Key Array (Solana CLI format):\n  {secret_key_layout}")
            print(f"  Processed {attempts:,} keys in {elapsed:.2f}s ({speed:,} keys/s)\n")
            
            with match_count.get_lock():
                match_count.value += 1
            break

def start_mining_rig():
    print("\033[1;31m")
    print("┌────────────────────────────────────────────────────────┐")
    print("│         OFFLINE STEALTH KEYPAIR VANITY MINER           │")
    print("└────────────────────────────────────────────────────────┘\033[0m")
    
    prefix = input("  Enter target address prefix string (e.g. g, gl, g1): ").strip()
    if not prefix:
        print("[!] Prefix cannot be empty.")
        return

    # Filter for valid base58 characters to prevent infinite loops
    invalid_chars = [c for c in prefix if c in ['0', 'O', 'I', 'l']]
    if invalid_chars:
        print(f"[!] Base58 error: Characters {invalid_chars} are invalid on Solana.")
        return

    cores = multiprocessing.cpu_count()
    print(f"\n  [+] Activating mining array across {cores} local logical cores...")
    print(f"  [+] Searching for addresses starting with: '{prefix}'\n")
    
    match_count = multiprocessing.Value('i', 0)
    processes = []
    
    for i in range(cores):
        p = multiprocessing.Process(target=mine_worker, args=(prefix, match_count, i))
        processes.append(p)
        p.start()

    try:
        while True:
            time.sleep(0.5)
            if match_count.value > 0:
                break
    except KeyboardInterrupt:
        print("\n  [!] Mining sequence terminated by operator.")
    finally:
        for p in processes:
            p.terminate()

if __name__ == "__main__":
    start_mining_rig()
