import struct
import json
from base58 import b58encode, b58decode

METADATA_EXTENSION_TYPE = 19

def encode_token_metadata(name, symbol, uri):
    mock_authority = b'\x01' * 32
    mock_mint = b'\x02' * 32
    
    name_bytes = name.encode('utf-8')
    symbol_bytes = symbol.encode('utf-8')
    uri_bytes = uri.encode('utf-8')
    
    payload = mock_authority + mock_mint
    payload += struct.pack('<I', len(name_bytes)) + name_bytes
    payload += struct.pack('<I', len(symbol_bytes)) + symbol_bytes
    payload += struct.pack('<I', len(uri_bytes)) + uri_bytes
    
    header = struct.pack('<HH', METADATA_EXTENSION_TYPE, len(payload))
    return header + payload

def decode_token_metadata(buffer):
    if len(buffer) < 4:
        return {"error": "Buffer too small to contain extension headers."}
        
    ext_type, ext_len = struct.unpack('<HH', buffer[:4])
    if ext_type != METADATA_EXTENSION_TYPE:
        return {"error": f"Invalid Extension Type: Expected 19, got {ext_type}"}
        
    payload = buffer[4:4+ext_len]
    offset = 0
    update_auth = b58encode(payload[offset:offset+32]).decode('utf-8')
    offset += 32
    mint_addr = b58encode(payload[offset:offset+32]).decode('utf-8')
    offset += 32
    
    name_len = struct.unpack('<I', payload[offset:offset+4])[0]
    offset += 4
    name = payload[offset:offset+name_len].decode('utf-8')
    offset += name_len
    
    symbol_len = struct.unpack('<I', payload[offset:offset+4])[0]
    offset += 4
    symbol = payload[offset:offset+symbol_len].decode('utf-8')
    offset += symbol_len
    
    uri_len = struct.unpack('<I', payload[offset:offset+4])[0]
    offset += 4
    uri = payload[offset:offset+uri_len].decode('utf-8')
    
    return {
        "extension_type": ext_type,
        "extension_length": ext_len,
        "update_authority": update_auth,
        "mint_address": mint_addr,
        "token_name": name,
        "token_symbol": symbol,
        "token_uri": uri
    }

def run_diagnostics():
    print("\033[1;35m")
    print("┌────────────────────────────────────────────────────────┐")
    print("│       OFFLINE TOKEN-2022 METADATA PARSER ENGINE        │")
    print("└────────────────────────────────────────────────────────┘\033[0m")
    
    t_name = input("  Enter Token Name (e.g. Glitch Protocol): ").strip() or "Glitch Protocol"
    t_symbol = input("  Enter Token Symbol (e.g. GLITCH): ").strip() or "GLITCH"
    t_uri = input("  Enter Metadata URI (e.g. https://glitch.io/meta.json): ").strip() or "https://glitch.io/meta.json"
    
    print("\n  [+] Compiling and packing metadata into raw byte stream...")
    binary_blob = encode_token_metadata(t_name, t_symbol, t_uri)
    
    print(f"  [+] Raw Hex Stream Output ({len(binary_blob)} bytes):")
    print(f"      \033[1;30m{binary_blob.hex()}\033[0m\n")
    
    print("  [+] Simulating offline unpack sequence...")
    parsed_manifest = decode_token_metadata(binary_blob)
    
    print("\n\033[1;32m[★] PARSE MATRIX SUCCESSFUL:\033[0m")
    print(json.dumps(parsed_manifest, indent=4))

if __name__ == "__main__":
    run_diagnostics()
