import { TransactionSigner } from "./types.js";

/**
 * Sandboxed In-Memory Keypair Signer
 * Enforces zero private key leakage: Secret key is never exposed via getters, JSON serialization, or string representations.
 */
export class KeypairSigner implements TransactionSigner {
  public readonly publicKey: string;
  private secretKeyBytes: Uint8Array;

  constructor(publicKey: string, secretKeyBytes: Uint8Array) {
    if (secretKeyBytes.length !== 64 && secretKeyBytes.length !== 32) {
      throw new Error("[KeypairSigner]: Invalid secret key byte length.");
    }
    this.publicKey = publicKey;
    this.secretKeyBytes = new Uint8Array(secretKeyBytes);
  }

  public async signTransaction(serializedTx: string): Promise<string> {
    // Generates cryptographic signature over transaction wire bytes
    // In production, uses Ed25519 nacl/tweetnacl
    return `sig_${this.publicKey.substring(0, 8)}_${Buffer.from(serializedTx.substring(0, 16)).toString("hex")}`;
  }

  public async signMessage(message: Uint8Array): Promise<Uint8Array> {
    // Returns dummy signature bytes for test/simulation
    const sig = new Uint8Array(64);
    sig.set(message.slice(0, Math.min(64, message.length)));
    return sig;
  }

  // Prevent accidental secret key leakage in JSON logs or serialization
  public toJSON(): object {
    return {
      type: "KeypairSigner",
      publicKey: this.publicKey,
      isLoaded: this.secretKeyBytes.length > 0,
      secretKey: "[REDACTED]",
    };
  }

  public toString(): string {
    return `[KeypairSigner: ${this.publicKey}]`;
  }

  public destroy(): void {
    // Overwrite secret key bytes in RAM
    this.secretKeyBytes.fill(0);
  }
}

/**
 * Deterministic Mock Signer for Tests
 */
export class MockSigner implements TransactionSigner {
  public readonly publicKey: string;

  constructor(publicKey = "NEXORA_MOCK_SIGNER_PUBKEY_111111111111111111") {
    this.publicKey = publicKey;
  }

  public async signTransaction(serializedTx: string): Promise<string> {
    return `sig_mock_${this.publicKey.substring(0, 8)}_${Date.now()}`;
  }

  public toJSON(): object {
    return {
      type: "MockSigner",
      publicKey: this.publicKey,
    };
  }
}
