export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

function toVal(mix: ClassValue): string {
  let k: any, y: any, str = "";
  if (typeof mix === "string" || typeof mix === "number") {
    str += mix;
  } else if (typeof mix === "object") {
    if (Array.isArray(mix)) {
      for (k = 0; k < mix.length; k++) {
        if (mix[k]) {
          if ((y = toVal(mix[k]))) {
            str && (str += " ");
            str += y;
          }
        }
      }
    } else if (mix) {
      for (k in mix) {
        if (mix[k]) {
          str && (str += " ");
          str += k;
        }
      }
    }
  }
  return str;
}

/**
 * Standard zero-dependency className utility
 */
export function cn(...inputs: ClassValue[]): string {
  let i = 0, tmp: any, x: any, str = "";
  while (i < inputs.length) {
    if ((tmp = inputs[i++])) {
      if ((x = toVal(tmp))) {
        str && (str += " ");
        str += x;
      }
    }
  }
  return str;
}

/**
 * Institutional Three-Layer Theme Tokens (docs/08_DESIGN_SYSTEM.md)
 */
export const UI_THEME_TOKENS = {
  colors: {
    slate950: "#05070B", // Canvas background
    slate900: "#0B0E14", // Base surface
    slate850: "#101520", // Raised card
    slate800: "#171E2C", // Overlay & hover
    slate700: "#2A3448", // 1px Subtle border
    slate600: "#4B5A75", // Inactive divider
    slate400: "#96A2B8", // Muted secondary text
    slate200: "#DCDEE5", // Primary readable text
    slate50: "#FFFFFF",  // Bright highlights

    // Semantic Trading Indicators
    emerald500: "#00C087", // Buy / Profit
    emerald950: "#022016", // Buy background tint
    crimson500: "#FF4D64", // Sell / Stop Loss
    crimson950: "#250308", // Sell background tint
    cyan500: "#00B4D8",    // Precision Cyan / Protocol Brand
    cyan950: "#011C23",    // Cyan background tint
    amber500: "#F59E0B",   // Warning / Circuit Breaker
    amber950: "#241602",   // Warning background tint
  },
  radii: {
    none: "0px",
    xs: "2px",
    sm: "4px",
    md: "6px",
    full: "9999px",
  },
} as const;

/**
 * Formats a cryptocurrency token price with adaptive sub-cent precision.
 * e.g. 148.42 -> "$148.42", 0.0000248 -> "$0.0000248"
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(price)) return "$0.00";
  if (price === 0) return "$0.00";
  if (price >= 1) {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price >= 0.01) {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  }
  // Sub-cent micro tokens (BONK, etc.)
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 6, maximumFractionDigits: 8 })}`;
}

/**
 * Formats standard USD currency values.
 */
export function formatCurrency(
  value: number | null | undefined,
  decimals: number = 2,
  includeSign: boolean = false
): string {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";
  const sign = includeSign && value > 0 ? "+" : "";
  const formatted = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return value < 0 ? `-$${formatted}` : `${sign}$${formatted}`;
}

/**
 * Formats percentage metrics with sign and fixed decimal places.
 */
export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return "0.00%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Formats compact numbers (e.g. 1,420,000 -> "1.42M", 85,000 -> "85.0k").
 */
export function formatCompactNumber(value: number | null | undefined, prefix: string = "$"): string {
  if (value === null || value === undefined || isNaN(value)) return `${prefix}0`;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}${prefix}${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${prefix}${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${prefix}${(abs / 1_000).toFixed(0)}k`;
  }
  return `${sign}${prefix}${abs.toFixed(0)}`;
}

/**
 * Formats ISO timestamp to HH:mm:ss.
 */
export function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return "--:--:--";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", { hour12: false });
  } catch {
    return "--:--:--";
  }
}
