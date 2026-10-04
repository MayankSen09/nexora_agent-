import { PROTOCOL_CONSTANTS } from "@nexora/shared";

export class SolanaCluster {
  public static getRpcUrl(network = PROTOCOL_CONSTANTS.DEFAULT_NETWORK): string {
    if (network === "MAINNET") {
      return "https://api.mainnet-beta.solana.com";
    }
    return "https://api.devnet.solana.com";
  }
}
