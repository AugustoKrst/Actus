import { useState } from 'react';
import { router, usePathname } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const links = [
  { path: '/historico', label: 'Treinos', icon: '◉' },
  { path: '/treino', label: 'Montar treino', icon: '✳' },
  { path: '/perfil', label: 'Perfil', icon: '○' },
  { path: '/configuracoes', label: 'Configurações', icon: '⚙' },
];

export default function AppShell({ children }) {
  const { width } = useWindowDimensions();
  const wide = width > 760;
  const path = usePathname();
  const { session, logout } = useAuth();
  const { colors } = useTheme();
  const s = createStyles(colors);
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (session?.user?.name || 'A').slice(0, 1).toUpperCase();

  async function signOut() {
    setMenuOpen(false);
    await logout();
    router.replace('/login');
  }

  function navigate(pathname) {
    setMenuOpen(false);
    router.push(pathname);
  }

  function isActive(pathname) {
    return path === pathname || (pathname === '/historico' && path === '/sessao') || (pathname === '/inicio' && path === '/');
  }

  return <SafeAreaView style={s.safe}><View style={s.frame}>
    <View style={s.main}>
      {menuOpen && <Pressable onPress={() => setMenuOpen(false)} style={s.menuBackdrop} accessibilityLabel="Fechar menu" />}
      <View style={s.topbar}>
        <View style={s.brandGroup}>
          <Pressable onPress={() => navigate('/inicio')} style={s.homeButton} accessibilityRole="button" accessibilityLabel="Ir para o início">
            <Text style={s.homeIcon}>⌂</Text><Text style={s.homeText}>Início</Text>
          </Pressable>
          <View style={s.brand}><Text style={s.brandMark}>✳</Text><Text style={s.brandText}>Actus</Text></View>
        </View>
        <View style={s.topMeta}>
          {wide && <><View style={s.onlineDot} /><Text style={s.topMetaText}>Sua saúde, no seu ritmo</Text></>}
          <Pressable onPress={() => setMenuOpen((open) => !open)} style={s.menuButton} accessibilityRole="button" accessibilityLabel={menuOpen ? 'Fechar menu' : 'Abrir menu'} accessibilityState={{ expanded: menuOpen }}>
            <View style={s.menuLines}><View style={s.menuLine} /><View style={s.menuLine} /><View style={s.menuLine} /></View>
          </Pressable>
        </View>
        {menuOpen && <View style={s.menuPanel}>
          <View style={s.menuAccount}>
            <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
            <View style={s.accountCopy}><Text style={s.accountName}>{session?.user?.name || 'Minha conta'}</Text><Text style={s.accountEmail}>{session?.user?.email || 'Perfil pessoal'}</Text></View>
          </View>
          <View style={s.menuDivider} />
          {[...links, ...(session?.user?.role === 'admin' ? [{ path: '/admin', label: 'Administração', icon: '◆' }] : [])].map((item) => {
            const active = isActive(item.path);
            return <Pressable key={item.path} onPress={() => navigate(item.path)} style={[s.menuItem, active && s.menuItemActive]} accessibilityRole="button">
              <Text style={[s.menuItemIcon, active && s.menuItemIconActive]}>{item.icon}</Text><Text style={[s.menuItemText, active && s.menuItemTextActive]}>{item.label}</Text>
            </Pressable>;
          })}
          <View style={s.menuDivider} />
          <Pressable onPress={signOut} style={s.menuItem} accessibilityRole="button"><Text style={s.menuItemIcon}>↗</Text><Text style={s.menuItemText}>Sair da conta</Text></Pressable>
        </View>}
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingHorizontal: wide ? 44 : 20, paddingBottom: 38 }]}>{children}</ScrollView>
    </View>
  </View></SafeAreaView>;
}

function createStyles(colors) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas }, frame: { flex: 1, backgroundColor: colors.canvas }, main: { flex: 1, position: 'relative' }, menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 8 },
  topbar: { minHeight: 66, position: 'relative', backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, zIndex: 10 },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 18 }, homeButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, borderRadius: 9, backgroundColor: colors.pale }, homeIcon: { color: colors.green, fontSize: 17 }, homeText: { color: colors.green, fontWeight: '700', fontSize: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 }, brandMark: { color: colors.green, fontSize: 23 }, brandText: { color: colors.ink, fontWeight: '800', fontSize: 22, letterSpacing: -0.8 },
  topMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 }, onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#77B978' }, topMetaText: { color: colors.muted, fontSize: 11, marginRight: 8 },
  menuButton: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft }, menuLines: { gap: 4 }, menuLine: { width: 18, height: 2, borderRadius: 2, backgroundColor: colors.dark },
  menuPanel: { position: 'absolute', top: 58, right: 20, width: 260, padding: 10, borderRadius: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, elevation: 8, zIndex: 30, shadowColor: '#18352B', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 7 } },
  menuAccount: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9 }, avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.green, fontWeight: '800', fontSize: 14 }, accountCopy: { flex: 1 }, accountName: { color: colors.ink, fontSize: 12, fontWeight: '700' }, accountEmail: { color: colors.muted, fontSize: 10, marginTop: 3 },
  menuDivider: { height: 1, backgroundColor: colors.line, marginVertical: 6 }, menuItem: { minHeight: 44, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 11 }, menuItemActive: { backgroundColor: colors.pale }, menuItemIcon: { color: colors.muted, width: 20, fontSize: 16, textAlign: 'center' }, menuItemIconActive: { color: colors.green }, menuItemText: { color: colors.ink, fontSize: 12, fontWeight: '600' }, menuItemTextActive: { color: colors.green, fontWeight: '800' },
  content: { flexGrow: 1, paddingTop: 30, alignItems: 'center' },
}); }
