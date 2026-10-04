import { PROTOCOL_CONSTANTS } from "@nexora/shared";

export class SolanaCluster {
  public static getRpcUrl(network: typeof PROTOCOL_CONSTANTS.SUPPORTED_NETWORKS[number] | string = PROTOCOL_CONSTANTS.DEFAULT_NETWORK): string {
    if (network === "MAINNET") {
      return "https://api.mainnet-beta.solana.com";
    }
    return "https://api.devnet.solana.com";
  }
}
