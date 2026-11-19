import { Text as NativeText, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

function familyForWeight(weight, families) {
  const numericWeight = weight === 'bold' ? 700 : weight === 'normal' ? 400 : Number(weight || 400);
  if (numericWeight >= 700) return families.bold;
  if (numericWeight >= 600) return families.semibold;
  if (numericWeight >= 500) return families.medium;
  return families.regular;
}

export default function AppText({ style, ...props }) {
  const { tokens } = useTheme();
  const flattened = StyleSheet.flatten(style) || {};
  const { fontWeight, fontFamily, ...textStyle } = flattened;
  const family = fontFamily || familyForWeight(fontWeight, tokens.type.family);

  return <NativeText {...props} style={[textStyle, { fontFamily: family }]} />;
}
