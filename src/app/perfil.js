import { View } from 'react-native';
import AppShell from '../components/AppShell';
import ProfileEditor from '../components/ProfileEditor';
import { PageHeading } from '../components/ui';

export default function ProfileScreen() {
  return <AppShell><View style={{ width: '100%', maxWidth: 1120 }}>
    <PageHeading eyebrow="SUA CONTA" title="Perfil" description="Atualize seus dados e seu objetivo pessoal." />
    <ProfileEditor />
  </View></AppShell>;
}
