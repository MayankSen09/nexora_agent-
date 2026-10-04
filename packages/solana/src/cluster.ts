import { PROTOCOL_CONSTANTS } from "@nexora/shared";
import { SolanaNetwork } from "./types.js";

export class SolanaCluster {
  private static readonly DEVNET_RPC = "https://api.devnet.solana.com";
  private static readonly MAINNET_RPC = "https://api.mainnet-beta.solana.com";
  private static readonly LOCALNET_RPC = "http://127.0.0.1:8899";

  public static getRpcUrl(network: SolanaNetwork | string = PROTOCOL_CONSTANTS.DEFAULT_NETWORK): string {
    if (network === "MAINNET") {
      return process.env.SOLANA_MAINNET_RPC || SolanaCluster.MAINNET_RPC;
    }
    if (network === "LOCALNET") {
      return SolanaCluster.LOCALNET_RPC;
    }
    return process.env.SOLANA_DEVNET_RPC || SolanaCluster.DEVNET_RPC;
  }

  public static getWsUrl(network: SolanaNetwork | string = PROTOCOL_CONSTANTS.DEFAULT_NETWORK): string {
    const httpUrl = this.getRpcUrl(network);
    return httpUrl.replace("https://", "wss://").replace("http://", "ws://");
  }
}
