const lightSemantic = {
  background: '#F4F7F3',
  surface: '#FFFFFF',
  surfaceAlt: '#EAF1EB',
  border: '#D9E3DB',
  textPrimary: '#18352B',
  textSecondary: '#586A60',
  textOnPrimary: '#FFFFFF',
  primary: '#176B4B',
  primaryPressed: '#10583E',
  accent: '#C8F078',
  success: '#237A52',
  warning: '#8C510B',
  danger: '#AD3D43',
  field: '#FBFCFB',
  heroStart: '#143E30',
  heroEnd: '#236548',
  heroText: '#FFFFFF',
  heroMuted: '#D2E3D8',
  avatarPalette: ['#DDEBE0', '#E1EAF0', '#F1E5D6', '#E8E1EF', '#D8ECE8'],
  statusBarStyle: 'dark',
};

const darkSemantic = {
  background: '#111A16',
  surface: '#1A2821',
  surfaceAlt: '#23362B',
  border: '#354A3D',
  textPrimary: '#EAF3ED',
  textSecondary: '#B5C4B9',
  textOnPrimary: '#11271B',
  primary: '#82C89F',
  primaryPressed: '#6FB68B',
  accent: '#D0EF98',
  success: '#8ACAA2',
  warning: '#F0BF7D',
  danger: '#F09398',
  field: '#1D3026',
  heroStart: '#14271E',
  heroEnd: '#1C3D2C',
  heroText: '#FFFFFF',
  heroMuted: '#D2E3D8',
  avatarPalette: ['#294537', '#2D4050', '#4B3C2B', '#40364D', '#254A45'],
  statusBarStyle: 'light',
};

function withLegacyAliases(colors) {
  return {
    ...colors,
    canvas: colors.background,
    white: colors.surface,
    soft: colors.surfaceAlt,
    pale: colors.surfaceAlt,
    line: colors.border,
    ink: colors.textPrimary,
    muted: colors.textSecondary,
    subtle: colors.textSecondary,
    subdued: colors.textSecondary,
    green: colors.primary,
    dark: colors.primaryPressed,
    lime: colors.accent,
    orange: colors.warning,
    red: colors.danger,
    empty: colors.surface,
    heroCanvas: colors.heroStart,
    heroAccent: colors.heroEnd,
  };
}

export const palettes = {
  light: withLegacyAliases(lightSemantic),
  dark: withLegacyAliases(darkSemantic),
};

export const space = {
  scale: [4, 8, 12, 16, 24, 32, 48],
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = { xs: 8, sm: 12, md: 16, lg: 16, xl: 24, pill: 999 };

export const type = {
  family: {
    regular: 'InterRegular',
    medium: 'InterMedium',
    semibold: 'InterSemiBold',
    bold: 'InterBold',
  },
  size: { label: 10, caption: 12, body: 15, subtitle: 18, title: 24, display: 34 },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  caption: 12,
  small: 14,
  body: 15,
  subtitle: 18,
  title: 24,
  display: 34,
};

export const metrics = {
  touchTarget: 48,
  contentMax: 1120,
  cardBorder: 1,
  shadow: {
    color: '#16372A',
    opacity: 0.06,
    radius: 16,
    offset: { width: 0, height: 6 },
    elevation: 3,
  },
};

export const designTokens = { space, radius, type, metrics };
