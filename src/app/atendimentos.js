import AppShell from '../components/AppShell';
import ConversationCenter from '../components/ConversationCenter';

export default function AppointmentsScreen() {
  return <AppShell scrollable={false}><ConversationCenter mode="professional" /></AppShell>;
}
