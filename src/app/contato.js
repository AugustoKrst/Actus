import AppShell from '../components/AppShell';
import ConversationCenter from '../components/ConversationCenter';

export default function ContactScreen() {
  return <AppShell scrollable={false}><ConversationCenter mode="student" /></AppShell>;
}
