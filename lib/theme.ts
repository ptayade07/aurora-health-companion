export const colors = {
  // Backgrounds
  bg: "#08070F",
  bgDeep: "#050409",
  bgCard: "rgba(255,255,255,0.045)",
  bgElevated: "rgba(255,255,255,0.08)",
  bgClay: "#130D2A",
  bgGlass: "rgba(139,92,246,0.07)",

  // Purple scale
  purple: "#8B5CF6",
  purpleLight: "#C4B5FD",
  purpleDark: "#6D28D9",
  purpleBright: "#A855F7",
  purpleMid: "#7C3AED",
  purpleGlow: "rgba(139,92,246,0.35)",
  purpleDim: "rgba(139,92,246,0.15)",

  // Borders
  border: "rgba(255,255,255,0.08)",
  borderMid: "rgba(255,255,255,0.12)",
  borderPurple: "rgba(139,92,246,0.35)",

  // Text
  text: "#FFFFFF",
  textSoft: "rgba(255,255,255,0.68)",
  textMuted: "rgba(255,255,255,0.36)",

  // Status
  success: "#34D399",
  successDim: "rgba(52,211,153,0.15)",
  warning: "#FBBF24",
  warningDim: "rgba(251,191,36,0.15)",
  danger: "#F87171",
  dangerDim: "rgba(248,113,113,0.15)",
  info: "#60A5FA",
};

// 7-stop typography scale — use these, never raw numbers
export const typography = {
  caption: 11, // section labels, tags, badges
  sm: 13,      // secondary body, timestamps, muted info
  base: 15,    // primary body text
  md: 17,      // card titles, input text
  lg: 22,      // section headings
  xl: 28,      // screen titles
  display: 52, // hero metric numbers
};

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
  black: "900" as const,
};

// Standard gradient tuples — import these instead of inlining hex strings
export const gradients = {
  cta:     ["#A855F7", "#6D28D9"] as const,
  ctaWarm: ["#A855F7", "#7C3AED"] as const,
  water:   ["#60A5FA", "#818CF8"] as const,
  success: ["#34D399", "#60A5FA"] as const,
  purple:  ["rgba(139,92,246,0.30)", "rgba(109,40,217,0.04)"] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  xl: 32,
  full: 999,
};

export const shadow = {
  purple: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const glass = {
  backgroundColor: colors.bgCard,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.lg,
};

export const clay = {
  backgroundColor: colors.bgClay,
  borderWidth: 1,
  borderColor: colors.borderPurple,
  borderRadius: radius.xl,
  ...shadow.card,
};
