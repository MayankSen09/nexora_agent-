export interface VaultPolicy {
  maxSingleTrade: bigint;
  maxDailyLimit: bigint;
  maxSlippageBps: number;
  isActive: boolean;
}

export interface VaultAccount {
  vaultAddress: string;
  vaultTokenAddress: string;
  owner: string;
  agent: string;
  tokenMint: string;
  vaultBump: number;
  tokenBump: number;
  policy: VaultPolicy;
  dailySpent: bigint;
  lastResetSlot: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  balance: bigint;
}

export type VaultErrorCode =
  | "UnauthorizedOwner"
  | "UnauthorizedAgent"
  | "UnauthorizedSigner"
  | "VaultPaused"
  | "ZeroAmount"
  | "SingleTradeLimitExceeded"
  | "DailyLimitExceeded"
  | "MathOverflow"
  | "InsufficientVaultBalance";

export class VaultError extends Error {
  public readonly code: VaultErrorCode;

  constructor(code: VaultErrorCode, message: string) {
    super(`[VaultError:${code}]: ${message}`);
    this.code = code;
    this.name = "VaultError";
  }
}
