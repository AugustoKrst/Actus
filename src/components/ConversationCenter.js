import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { addDoc, collection, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../lib/firebaseConfig';
import { Card, PageHeading } from './ui';

export default function ConversationCenter({ mode }) {
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const compact = useWindowDimensions().width <= 700;
  const user = session?.user;
  const isProfessional = mode === 'professional';
  const canUseScreen = isProfessional
    ? user?.accountType === 'health_professional'
    : user?.accountType === 'user';
  const [conversations, setConversations] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [messageState, setMessageState] = useState({ conversationId: null, items: [] });
  const [search, setSearch] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const otherPartyLabel = isProfessional ? 'Aluno' : 'Profissional';
  const heading = isProfessional ? 'Atendimentos' : 'Falar com um profissional';

  useEffect(() => {
    if (!canUseScreen || isProfessional || !user?.uid) return undefined;
    return onSnapshot(query(collection(db, 'professionals'), limit(100)), (snapshot) => {
      const rows = snapshot.docs
        .filter((item) => item.id !== user.uid)
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
      setProfessionals(rows);
    }, () => setError('Não foi possível carregar a lista de profissionais. Tente novamente.'));
  }, [canUseScreen, isProfessional, user?.uid]);

  useEffect(() => {
    if (!canUseScreen || !user?.uid) return undefined;
    const field = isProfessional ? 'professionalId' : 'studentId';
    const inbox = query(collection(db, 'conversations'), where(field, '==', user.uid), limit(40));
    return onSnapshot(inbox, (snapshot) => {
      const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      rows.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setConversations(rows);
    }, () => setError('Não foi possível carregar suas conversas. Tente novamente.'));
  }, [canUseScreen, isProfessional, user?.uid]);

  useEffect(() => {
    if (!selected?.id) return undefined;
    const messageQuery = query(collection(db, 'conversations', selected.id, 'messages'), orderBy('createdAt', 'asc'), limit(60));
    return onSnapshot(messageQuery, (snapshot) => {
      setMessageState({ conversationId: selected.id, items: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) });
    }, () => setError('Não foi possível carregar as mensagens.'));
  }, [selected?.id]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selected?.id) || selected,
    [conversations, selected],
  );
  const messages = messageState.conversationId === selected?.id ? messageState.items : [];
  const visibleProfessionals = professionals.filter((professional) => (professional.name || '').toLowerCase().includes(search.trim().toLowerCase()));

  function chooseProfessional(professional) {
    setError('');
    setFirstMessage('');
    const existing = conversations.find((conversation) => conversation.professionalId === professional.id);
    if (existing) {
      setSelected(existing);
      setSelectedProfessional(null);
    } else {
      setSelected(null);
      setSelectedProfessional(professional);
    }
  }

  async function startConversation() {
    const opening = firstMessage.trim();
    setError('');
    if (!selectedProfessional) return setError('Selecione um profissional para continuar.');
    if (opening.length < 2) return setError('Escreva uma mensagem para iniciar o contato.');
    setBusy(true);
    try {
      const conversationId = `${user.uid}_${selectedProfessional.id}`;
      const conversationRef = doc(db, 'conversations', conversationId);
      const existing = await getDoc(conversationRef);
      if (!existing.exists()) {
        await setDoc(conversationRef, {
          studentId: user.uid,
          studentName: user.name || 'Aluno',
          professionalId: selectedProfessional.id,
          professionalName: selectedProfessional.name || 'Profissional',
          createdAt: serverTimestamp(),
        });
      }
      await addDoc(collection(conversationRef, 'messages'), {
        senderId: user.uid,
        senderName: user.name || 'Aluno',
        text: opening,
        createdAt: serverTimestamp(),
      });
      setSelected({
        id: conversationId,
        studentId: user.uid,
        studentName: user.name || 'Aluno',
        professionalId: selectedProfessional.id,
        professionalName: selectedProfessional.name || 'Profissional',
      });
      setSelectedProfessional(null);
      setFirstMessage('');
    } catch (cause) {
      setError(cause.message || 'Não foi possível iniciar a conversa. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text || !selectedConversation?.id) return;
    setError('');
    setBusy(true);
    try {
      await addDoc(collection(db, 'conversations', selectedConversation.id, 'messages'), {
        senderId: user.uid,
        senderName: user.name || (isProfessional ? 'Profissional' : 'Aluno'),
        text,
        createdAt: serverTimestamp(),
      });
      setDraft('');
    } catch {
      setError('Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  function closeConversation() {
    setSelected(null);
    setSelectedProfessional(null);
    setDraft('');
    setError('');
  }

  if (!canUseScreen) return <View style={styles.page}><Card><Text style={styles.emptyTitle}>Esta área não está disponível para este perfil.</Text></Card></View>;

  const otherName = selectedConversation
    ? (isProfessional ? selectedConversation.studentName : selectedConversation.professionalName)
    : '';

  return <View style={styles.page}>
    <PageHeading eyebrow={isProfessional ? 'CONEXÃO COM SEUS ALUNOS' : 'ACOMPANHAMENTO DE SAÚDE'} title={heading} description={isProfessional ? 'Responda aos alunos que entraram em contato com você.' : 'Veja os profissionais disponíveis e escolha com quem quer conversar.'} />

    {selectedConversation ? <Card style={styles.chatCard}>
      <View style={styles.chatHeader}>
        <Pressable onPress={closeConversation} style={styles.backButton} accessibilityRole="button"><Text style={styles.backText}>‹  {isProfessional ? 'Mensagens' : 'Profissionais'}</Text></Pressable>
        <View style={styles.person}><View style={styles.avatar}><Text style={styles.avatarText}>{otherName.slice(0, 1).toUpperCase()}</Text></View><View><Text style={styles.personName}>{otherName}</Text><Text style={styles.personRole}>{otherPartyLabel}</Text></View></View>
      </View>
      <View style={styles.messages}>
        {messages.length === 0 ? <Text style={styles.emptyMessage}>Envie uma mensagem para começar a conversa.</Text> : messages.map((message) => {
          const mine = message.senderId === user.uid;
          return <View key={message.id} style={[styles.messageRow, mine && styles.messageRowMine]}><View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}><Text style={[styles.messageSender, mine && styles.messageSenderMine]}>{mine ? 'Você' : message.senderName}</Text><Text style={[styles.messageText, mine && styles.messageTextMine]}>{message.text}</Text></View></View>;
        })}
      </View>
      <View style={styles.composer}>
        <TextInput value={draft} onChangeText={setDraft} placeholder="Escreva uma mensagem..." placeholderTextColor={colors.muted} style={styles.messageInput} multiline maxLength={2000} />
        <Pressable onPress={sendMessage} disabled={busy || !draft.trim()} style={[styles.sendButton, (busy || !draft.trim()) && styles.sendButtonDisabled]} accessibilityRole="button"><Text style={styles.sendText}>{busy ? '...' : 'Enviar'}</Text></Pressable>
      </View>
    </Card> : selectedProfessional ? <Card style={styles.startCard}>
      <Pressable onPress={closeConversation} style={styles.backButton} accessibilityRole="button"><Text style={styles.backText}>‹  Voltar para profissionais</Text></Pressable>
      <View style={styles.person}><View style={styles.avatar}><Text style={styles.avatarText}>{(selectedProfessional.name || '?').slice(0, 1).toUpperCase()}</Text></View><View><Text style={styles.personName}>{selectedProfessional.name}</Text><Text style={styles.personRole}>Profissional de saúde</Text></View></View>
      <Text style={styles.helper}>Envie uma mensagem para iniciar o contato. Você pode pedir um treino específico ou explicar o que precisa.</Text>
      <TextInput value={firstMessage} onChangeText={setFirstMessage} placeholder="Ex.: Gostaria de um treino para fortalecer os joelhos..." placeholderTextColor={colors.muted} multiline maxLength={2000} style={[styles.input, styles.firstMessageInput]} />
      <Pressable onPress={startConversation} disabled={busy} style={[styles.primaryButton, busy && styles.sendButtonDisabled]} accessibilityRole="button">{busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Enviar mensagem</Text>}</Pressable>
    </Card> : <>
      {!isProfessional && <>
        <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput value={search} onChangeText={setSearch} placeholder="Buscar profissional pelo nome" placeholderTextColor={colors.muted} style={styles.searchInput} /></View>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Profissionais disponíveis</Text><Text style={styles.inboxCount}>{visibleProfessionals.length}</Text></View>
        {visibleProfessionals.length === 0 ? <Card style={styles.emptyCard}><Text style={styles.emptyTitle}>{professionals.length === 0 ? 'Ainda não há profissionais disponíveis.' : 'Nenhum profissional encontrado.'}</Text><Text style={styles.helper}>{professionals.length === 0 ? 'Os profissionais cadastrados aparecerão aqui.' : 'Tente buscar por outro nome.'}</Text></Card> : <View style={styles.professionalGrid}>{visibleProfessionals.map((professional) => {
          const hasConversation = conversations.some((conversation) => conversation.professionalId === professional.id);
          return <Pressable key={professional.id} onPress={() => chooseProfessional(professional)} accessibilityRole="button" style={[styles.professionalPressable, !compact && styles.professionalPressableWide]}><Card style={styles.professionalCard}><View style={styles.professionalTop}><View style={styles.largeAvatar}><Text style={styles.largeAvatarText}>{(professional.name || '?').slice(0, 1).toUpperCase()}</Text></View><View style={styles.availability}><View style={styles.availabilityDot} /><Text style={styles.availabilityText}>Disponível</Text></View></View><Text style={styles.professionalName}>{professional.name || 'Profissional de saúde'}</Text><Text style={styles.professionalCaption}>Profissional de saúde</Text><View style={styles.profileAction}><Text style={styles.profileActionText}>{hasConversation ? 'Abrir conversa' : 'Enviar mensagem'}</Text><Text style={styles.chevron}>›</Text></View></Card></Pressable>;
        })}</View>}
      </>}

      {isProfessional && conversations.length === 0 && !selectedConversation && <Card style={styles.emptyCard}><Text style={styles.emptyTitle}>Nenhuma mensagem por enquanto.</Text><Text style={styles.helper}>Quando um aluno entrar em contato, a conversa aparecerá aqui.</Text></Card>}
      {conversations.length > 0 && <><View style={[styles.sectionHeader, styles.conversationsHeader]}><Text style={styles.sectionTitle}>{isProfessional ? 'Mensagens recebidas' : 'Suas conversas'}</Text><Text style={styles.inboxCount}>{conversations.length}</Text></View>{conversations.map((conversation) => {
        const name = isProfessional ? conversation.studentName : conversation.professionalName;
        return <Pressable key={conversation.id} onPress={() => { setSelected(conversation); setError(''); }} accessibilityRole="button"><Card style={styles.conversationCard}><View style={styles.avatar}><Text style={styles.avatarText}>{(name || '?').slice(0, 1).toUpperCase()}</Text></View><View style={styles.conversationCopy}><Text style={styles.personName}>{name || otherPartyLabel}</Text><Text style={styles.helper}>{isProfessional ? 'Aluno que entrou em contato' : 'Toque para continuar a conversa'}</Text></View><Text style={styles.chevron}>›</Text></Card></Pressable>;
      })}</>}
    </>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}

function createStyles(colors) { return StyleSheet.create({
  page: { width: '100%', maxWidth: 1120, paddingBottom: 24 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 9, marginBottom: 12 }, conversationsHeader: { marginTop: 28 }, sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, helper: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  searchBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white, marginBottom: 17 }, searchIcon: { color: colors.green, fontSize: 21 }, searchInput: { flex: 1, color: colors.ink, fontSize: 13 }, inboxCount: { color: colors.green, backgroundColor: colors.pale, overflow: 'hidden', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: '800' },
  professionalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, professionalPressable: { width: '100%' }, professionalPressableWide: { width: '48.5%' }, professionalCard: { padding: 17, borderRadius: 15 }, professionalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, largeAvatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pale }, largeAvatarText: { color: colors.green, fontSize: 21, fontWeight: '800' }, availability: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.pale }, availabilityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#5C9A65' }, availabilityText: { color: colors.green, fontSize: 10, fontWeight: '700' }, professionalName: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 14 }, professionalCaption: { color: colors.muted, fontSize: 11, marginTop: 4 }, profileAction: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.line, marginTop: 14, paddingTop: 10 }, profileActionText: { color: colors.green, fontSize: 11, fontWeight: '800' },
  emptyCard: { paddingVertical: 19 }, emptyTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' }, conversationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 9 }, avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pale }, avatarText: { color: colors.green, fontWeight: '800', fontSize: 15 }, conversationCopy: { flex: 1 }, personName: { color: colors.ink, fontSize: 13, fontWeight: '800' }, chevron: { color: colors.green, fontSize: 24 },
  startCard: { marginBottom: 22, gap: 10 }, backButton: { alignSelf: 'flex-start', paddingVertical: 4, paddingRight: 12 }, backText: { color: colors.green, fontSize: 12, fontWeight: '700' }, person: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 3 }, personRole: { color: colors.muted, fontSize: 10, marginTop: 3 }, input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.field, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, color: colors.ink, fontSize: 13 }, firstMessageInput: { minHeight: 105, textAlignVertical: 'top', marginTop: 7 }, primaryButton: { minHeight: 48, backgroundColor: colors.green, borderRadius: 10, marginTop: 5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, primaryButtonText: { color: 'white', fontSize: 12, fontWeight: '800' },
  chatCard: { padding: 0, overflow: 'hidden' }, chatHeader: { padding: 16, borderBottomWidth: 1, borderColor: colors.line, gap: 13 }, messages: { minHeight: 180, padding: 14, gap: 10 }, emptyMessage: { color: colors.muted, fontSize: 12, textAlign: 'center', marginVertical: 30 }, messageRow: { flexDirection: 'row', justifyContent: 'flex-start' }, messageRowMine: { justifyContent: 'flex-end' }, bubble: { maxWidth: '88%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 13 }, bubbleOther: { backgroundColor: colors.soft, borderBottomLeftRadius: 4 }, bubbleMine: { backgroundColor: colors.green, borderBottomRightRadius: 4 }, messageSender: { color: colors.green, fontWeight: '800', fontSize: 9, marginBottom: 4 }, messageSenderMine: { color: '#D9EDE2' }, messageText: { color: colors.ink, fontSize: 12, lineHeight: 18 }, messageTextMine: { color: 'white' }, composer: { padding: 12, borderTopWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, messageInput: { flex: 1, minHeight: 44, maxHeight: 110, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.field, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.ink, fontSize: 13 }, sendButton: { minHeight: 44, minWidth: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.green, paddingHorizontal: 12 }, sendButtonDisabled: { opacity: 0.55 }, sendText: { color: 'white', fontSize: 11, fontWeight: '800' }, error: { color: colors.red, fontSize: 12, lineHeight: 18, marginTop: 11 },
}); }
