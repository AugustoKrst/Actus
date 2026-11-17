import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, PageHeading } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

const sections = [
  ['Quem responde pelos dados', 'O Actus deve ser operado por uma pessoa ou organização responsável pelo tratamento. Antes de publicar, o responsável precisa informar seu nome e um canal de contato para solicitações de privacidade.'],
  ['Quais dados são utilizados', 'O app guarda nome, e-mail, objetivo de atividade física, registro profissional quando informado, treinos, exercícios concluídos e mensagens trocadas com profissionais. O conteúdo de treinos e objetivos pode revelar dados relacionados à saúde e à atividade física.'],
  ['Para que usamos os dados', 'Os dados são usados para autenticar sua conta, personalizar e salvar treinos, acompanhar seu progresso, conectar você a profissionais verificados e responder a solicitações de suporte e segurança.'],
  ['Onde ficam armazenados', 'O Actus utiliza Firebase Authentication e Cloud Firestore para autenticação e armazenamento. O Firebase é uma plataforma fornecida pelo Google. Não vendemos seus dados nem exibimos suas conversas a outros usuários.'],
  ['Consentimento e escolha', 'No cadastro, pedimos seu consentimento para o tratamento dos dados necessários aos recursos do Actus. Você pode deixar de usar o serviço e solicitar a exclusão da conta e dos dados associados.'],
  ['Seus direitos', 'Você pode solicitar confirmação de tratamento, acesso, correção, informação sobre o uso e eliminação dos dados, conforme a legislação aplicável. Para exercer seus direitos, procure o responsável pelo Actus pelo canal de contato publicado junto ao aplicativo.'],
  ['Segurança e retenção', 'Aplicamos regras de acesso do Firebase para limitar o uso aos titulares, participantes da conversa e administradores autorizados. Mantemos os dados enquanto a conta estiver ativa e removemos os registros associados após a solicitação de exclusão, ressalvadas obrigações legais.'],
  ['Conteúdo de saúde', 'O Actus é uma ferramenta de apoio à organização da atividade física. Ele não substitui avaliação médica, acompanhamento clínico nem orientação de profissional de educação física.'],
];

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const s = createStyles(colors);
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <View style={s.page}>
      <Pressable onPress={() => router.back()} style={s.back} accessibilityRole="button" accessibilityLabel="Voltar"><Text style={s.backText}>‹  Voltar</Text></Pressable>
      <PageHeading eyebrow="TRANSPARÊNCIA E PRIVACIDADE" title="Política de Privacidade" description="Como o Actus usa e protege os dados da sua conta." />
      <Card style={s.card}>
        <Text style={s.version}>Versão 1.0 · Novembro de 2026</Text>
        <Text style={s.intro}>Ao criar uma conta, você concorda com o tratamento dos dados descrito nesta política. Leia as informações abaixo antes de continuar.</Text>
        {sections.map(([title, body]) => <View key={title} style={s.section}><Text style={s.title}>{title}</Text><Text style={s.body}>{body}</Text></View>)}
        <Text style={s.contactNote}>Responsável pelo Actus: o nome e o contato do controlador de dados precisam ser configurados pelo mantenedor antes da publicação do aplicativo.</Text>
      </Card>
    </View>
  </ScrollView></SafeAreaView>;
}

function createStyles(colors) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas }, content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 32 }, page: { width: '100%', maxWidth: 900, paddingTop: 18 }, back: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 8 }, backText: { color: colors.green, fontSize: 13, fontWeight: '700' }, card: { padding: 24 }, version: { color: colors.green, fontSize: 11, fontWeight: '800' }, intro: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 10 }, section: { borderTopWidth: 1, borderColor: colors.line, paddingTop: 17, marginTop: 17 }, title: { color: colors.ink, fontSize: 14, fontWeight: '800' }, body: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 6 }, contactNote: { color: colors.subtle, fontSize: 10, lineHeight: 16, paddingTop: 15, marginTop: 17, borderTopWidth: 1, borderColor: colors.line },
}); }
