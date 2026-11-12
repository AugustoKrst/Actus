import { useState } from 'react';
import { router, usePathname } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const primaryLinks = [
  { path: '/inicio', label: 'Início', icon: '⌂' },
  { path: '/historico', label: 'Treinos', icon: '◷' },
  { path: '/treino', label: 'Montar treino', icon: '✳' },
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
  const navigationLinks = [
    ...primaryLinks,
    ...(session?.user?.accountType === 'health_professional'
      ? [{ path: '/atendimentos', label: 'Atendimentos', icon: '✉' }]
      : session?.user?.accountType === 'user'
        ? [{ path: '/contato', label: 'Profissionais', icon: '✉' }]
        : []),
    ...(session?.user?.role === 'admin' ? [{ path: '/admin', label: 'Administração', icon: '◆' }] : []),
  ];

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
      <View style={[s.topbar, !wide && s.topbarCompact]}>
        <Pressable onPress={() => navigate('/inicio')} style={s.brand} accessibilityRole="button" accessibilityLabel="Ir para o início">
          <View style={s.brandMarkWrap}><Text style={s.brandMark}>✳</Text></View><Text style={s.brandText}>Actus</Text>
        </Pressable>
        <ScrollView horizontal style={s.navScroll} contentContainerStyle={s.navContent} showsHorizontalScrollIndicator={false}>
          {navigationLinks.map((item) => {
            const active = isActive(item.path);
            return <Pressable key={item.path} onPress={() => navigate(item.path)} style={[s.navItem, active && s.navItemActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
              <Text style={[s.navIcon, active && s.navTextActive]}>{item.icon}</Text><Text style={[s.navText, active && s.navTextActive]}>{item.label}</Text>
            </Pressable>;
          })}
        </ScrollView>
        <Pressable onPress={() => setMenuOpen((open) => !open)} style={s.menuButton} accessibilityRole="button" accessibilityLabel={menuOpen ? 'Fechar menu' : 'Abrir menu'} accessibilityState={{ expanded: menuOpen }}>
          <View style={s.menuLines}><View style={s.menuLine} /><View style={s.menuLine} /><View style={s.menuLine} /></View>
        </Pressable>
        {menuOpen && <View style={s.menuPanel}>
          <View style={s.menuAccount}>
            <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
            <View style={s.accountCopy}><Text style={s.accountName}>{session?.user?.name || 'Minha conta'}</Text><Text style={s.accountEmail}>{session?.user?.email || 'Perfil pessoal'}</Text></View>
          </View>
          <View style={s.menuDivider} />
          {[
            { path: '/perfil', label: 'Perfil', icon: '◉' },
            { path: '/configuracoes', label: 'Configurações', icon: '⚙' },
          ].map((item) => {
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
  topbar: { minHeight: 72, position: 'relative', backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, zIndex: 10, elevation: 3, shadowColor: '#16372A', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, topbarCompact: { minHeight: 64, paddingHorizontal: 11 },
  brand: { width: 112, flexDirection: 'row', alignItems: 'center', gap: 9 }, brandMarkWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }, brandMark: { color: colors.green, fontSize: 19 }, brandText: { color: colors.ink, fontWeight: '800', fontSize: 21, letterSpacing: -0.8 },
  navScroll: { flex: 1, minWidth: 0 }, navContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 7 }, navItem: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, borderRadius: 10 }, navItemActive: { backgroundColor: colors.pale }, navIcon: { color: colors.muted, fontSize: 14 }, navText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, navTextActive: { color: colors.green, fontWeight: '800' },
  menuButton: { width: 42, height: 42, marginLeft: 8, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft }, menuLines: { gap: 4 }, menuLine: { width: 18, height: 2, borderRadius: 2, backgroundColor: colors.dark },
  menuPanel: { position: 'absolute', top: 61, right: 12, width: 260, padding: 10, borderRadius: 15, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, elevation: 8, zIndex: 30, shadowColor: '#18352B', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 7 } },
  menuAccount: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9 }, avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.green, fontWeight: '800', fontSize: 14 }, accountCopy: { flex: 1 }, accountName: { color: colors.ink, fontSize: 12, fontWeight: '700' }, accountEmail: { color: colors.muted, fontSize: 10, marginTop: 3 },
  menuDivider: { height: 1, backgroundColor: colors.line, marginVertical: 6 }, menuItem: { minHeight: 44, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 11 }, menuItemActive: { backgroundColor: colors.pale }, menuItemIcon: { color: colors.muted, width: 20, fontSize: 16, textAlign: 'center' }, menuItemIconActive: { color: colors.green }, menuItemText: { color: colors.ink, fontSize: 12, fontWeight: '600' }, menuItemTextActive: { color: colors.green, fontWeight: '800' },
  content: { flexGrow: 1, paddingTop: 30, alignItems: 'center' },
}); }
