import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../lib/firebaseConfig';
import { defaultExercises, startCustomWorkout } from '../lib/exercises';
import { Button, Card, LoadingState, PageHeading } from './ui';

async function sendConversationMessage(conversationId, senderId, data) {
  const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
  const limitRef = doc(db, 'conversations', conversationId, 'sendLimits', senderId);
  const batch = writeBatch(db);
  batch.set(messageRef, { ...data, createdAt: serverTimestamp() });
  batch.set(limitRef, { messageId: messageRef.id, sentAt: serverTimestamp() });
  await batch.commit();
}

function describeFirestoreError(cause, action) {
  if (cause?.code === 'permission-denied') {
    return `O Firebase bloqueou ${action}. Publique as regras atualizadas de firestore.rules e tente novamente.`;
  }
  if (cause?.code === 'unavailable' || cause?.code === 'auth/network-request-failed') {
    return 'Sem conexão com o Firebase. Confira sua internet e tente novamente.';
  }
  return `Não foi possível ${action}. Tente novamente.`;
}

export default function ConversationCenter({ mode }) {
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const user = session?.user;
  const isProfessional = mode === 'professional';
  const canUseScreen = isProfessional
    ? user?.accountType === 'health_professional' && user?.professionalVerified === true
    : user?.accountType === 'user';
  const [conversations, setConversations] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [messageState, setMessageState] = useState({ conversationId: null, items: [] });
  const [professionalsLoading, setProfessionalsLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [listenerVersion, setListenerVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [draft, setDraft] = useState('');
  const [composerMode, setComposerMode] = useState('message');
  const [workoutTitle, setWorkoutTitle] = useState('Treino personalizado');
  const [workoutDuration, setWorkoutDuration] = useState(30);
  const [workoutLevel, setWorkoutLevel] = useState('Iniciante');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState([]);
  const [startingWorkoutId, setStartingWorkoutId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const messageListRef = useRef(null);

  const otherPartyLabel = isProfessional ? 'Aluno' : 'Profissional';
  const heading = isProfessional ? 'Atendimentos' : 'Falar com um profissional';

  useEffect(() => {
    if (!canUseScreen || isProfessional || !user?.uid) return undefined;
    return onSnapshot(query(collection(db, 'professionals'), where('verified', '==', true), limit(100)), (snapshot) => {
      const rows = snapshot.docs
        .filter((item) => item.id !== user.uid)
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
      setProfessionals(rows);
      setProfessionalsLoading(false);
    }, (cause) => { setError(describeFirestoreError(cause, 'carregar a lista de profissionais')); setProfessionalsLoading(false); });
  }, [canUseScreen, isProfessional, listenerVersion, user?.uid]);

  useEffect(() => {
    if (!canUseScreen || !user?.uid) return undefined;
    const field = isProfessional ? 'professionalId' : 'studentId';
    const inbox = query(collection(db, 'conversations'), where(field, '==', user.uid), limit(40));
    return onSnapshot(inbox, (snapshot) => {
      const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      rows.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setConversations(rows);
      setConversationsLoading(false);
    }, (cause) => { setError(describeFirestoreError(cause, 'carregar suas conversas')); setConversationsLoading(false); });
  }, [canUseScreen, isProfessional, listenerVersion, user?.uid]);

  useEffect(() => {
    if (!selected?.id) return undefined;
    const messageQuery = query(collection(db, 'conversations', selected.id, 'messages'), orderBy('createdAt', 'asc'), limit(60));
    return onSnapshot(messageQuery, (snapshot) => {
      setMessageState({ conversationId: selected.id, items: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) });
      setMessagesLoading(false);
    }, (cause) => { setError(describeFirestoreError(cause, 'carregar as mensagens')); setMessagesLoading(false); });
  }, [selected?.id]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selected?.id) || selected,
    [conversations, selected],
  );
  const messages = messageState.conversationId === selected?.id ? messageState.items : [];
  const visibleProfessionals = professionals.filter((professional) => (professional.name || '').toLowerCase().includes(search.trim().toLowerCase()));
  const directoryRows = [
    ...(!isProfessional ? [{ id: 'professionals-heading', type: 'heading', title: 'Profissionais disponíveis', count: visibleProfessionals.length }] : []),
    ...(!isProfessional && visibleProfessionals.length === 0 ? [{ id: 'professionals-empty', type: professionalsLoading ? 'loading-professionals' : 'empty-professionals' }] : []),
    ...visibleProfessionals.map((professional) => ({ ...professional, id: `professional-${professional.id}`, type: 'professional' })),
    ...(isProfessional && conversations.length === 0 ? [{ id: 'inbox-empty', type: conversationsLoading ? 'loading-inbox' : 'empty-inbox' }] : []),
    ...(conversations.length ? [{ id: 'conversations-heading', type: 'heading', title: isProfessional ? 'Mensagens recebidas' : 'Suas conversas', count: conversations.length }] : []),
    ...conversations.map((conversation) => ({ ...conversation, id: `conversation-${conversation.id}`, type: 'conversation' })),
  ];
  const assignedExercises = defaultExercises.filter((exercise) => selectedExerciseIds.includes(exercise.id)).map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    sets: 3,
    reps: exercise.reps,
    rest_seconds: exercise.rest_seconds,
    instructions: exercise.instructions,
  }));

  useEffect(() => {
    if (!messages.length) return;
    requestAnimationFrame(() => messageListRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length, selected?.id]);

  function chooseProfessional(professional) {
    setError('');
    setFirstMessage('');
    const existing = conversations.find((conversation) => conversation.professionalId === professional.id);
    if (existing) {
      setMessagesLoading(true);
      setSelected(existing);
      setSelectedProfessional(null);
    } else {
      setSelected(null);
      setSelectedProfessional(professional);
    }
  }

  async function startConversation() {
    const opening = firstMessage.trim();
    let action = 'procurar a conversa existente';
    setError('');
    if (!selectedProfessional) return setError('Selecione um profissional para continuar.');
    if (opening.length < 2) return setError('Escreva uma mensagem para iniciar o contato.');
    setBusy(true);
    try {
      const existingSnapshot = await getDocs(query(
        collection(db, 'conversations'),
        where('studentId', '==', user.uid),
        where('professionalId', '==', selectedProfessional.id),
        limit(1),
      ));
      const existing = existingSnapshot.docs[0];
      const conversationId = existing?.id || `${user.uid}_${selectedProfessional.id}`;
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversation = existing?.data();
      if (!existing) {
        action = 'criar a conversa';
        await setDoc(conversationRef, {
          studentId: user.uid,
          studentName: user.name || 'Aluno',
          professionalId: selectedProfessional.id,
          professionalName: selectedProfessional.name || 'Profissional',
          createdAt: serverTimestamp(),
        });
      }
      action = 'enviar a mensagem inicial';
      await sendConversationMessage(conversationId, user.uid, {
        senderId: user.uid,
        senderName: user.name || 'Aluno',
        text: opening,
      });
      setSelected({
        id: conversationId,
        ...(conversation || {
          studentId: user.uid,
          studentName: user.name || 'Aluno',
          professionalId: selectedProfessional.id,
          professionalName: selectedProfessional.name || 'Profissional',
        }),
      });
      setMessagesLoading(true);
      setSelectedProfessional(null);
      setFirstMessage('');
    } catch (cause) {
      setError(describeFirestoreError(cause, action));
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    const text = draft.trim();
    const attachingWorkout = isProfessional && composerMode === 'workout';
    if ((!text && !attachingWorkout) || !selectedConversation?.id) return;
    if (attachingWorkout && (!workoutTitle.trim() || assignedExercises.length === 0)) {
      setError('Dê um nome ao treino e escolha pelo menos um exercício.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const senderName = selectedConversation.studentId === user.uid
        ? selectedConversation.studentName
        : selectedConversation.professionalName;
      await sendConversationMessage(selectedConversation.id, user.uid, {
        senderId: user.uid,
        senderName: senderName || user.name || (isProfessional ? 'Profissional' : 'Aluno'),
        text: text || `Treino enviado: ${workoutTitle.trim()}`,
        ...(attachingWorkout ? { workout: {
          title: workoutTitle.trim().slice(0, 60),
          duration: workoutDuration,
          level: workoutLevel,
          muscle: 'Corpo todo',
          place: 'Em casa',
          equipment: ['Peso corporal'],
          exercises: assignedExercises.slice(0, 20),
        } } : {}),
      });
      setDraft('');
      if (attachingWorkout) {
        setComposerMode('message');
        setSelectedExerciseIds([]);
        setWorkoutTitle('Treino personalizado');
      }
    } catch (cause) {
      setError(describeFirestoreError(cause, 'enviar a mensagem'));
    } finally {
      setBusy(false);
    }
  }

  async function openAssignedWorkout(message) {
    if (!message.workout || isProfessional || startingWorkoutId) return;
    setStartingWorkoutId(message.id);
    setError('');
    try {
      const workout = await startCustomWorkout(user.uid, message.workout);
      router.push({ pathname: '/sessao', params: { id: workout.id } });
    } catch (cause) {
      setError(describeFirestoreError(cause, 'abrir o treino enviado'));
    } finally {
      setStartingWorkoutId(null);
    }
  }

  function closeConversation() {
    setSelected(null);
    setSelectedProfessional(null);
    setDraft('');
    setError('');
    setMessagesLoading(false);
  }

  if (!canUseScreen) return <View style={styles.page}><Card><Text style={styles.emptyTitle}>Esta área não está disponível para este perfil.</Text></Card></View>;

  const otherName = selectedConversation
    ? (isProfessional ? selectedConversation.studentName : selectedConversation.professionalName)
    : '';

  const retryListeners = () => {
    setError('');
    setConversationsLoading(true);
    if (!isProfessional) setProfessionalsLoading(true);
    if (selected?.id) setMessagesLoading(true);
    setListenerVersion((current) => current + 1);
  };

  const renderMessage = ({ item: message }) => {
    const mine = message.senderId === user.uid;
    return <View style={[styles.messageRow, mine && styles.messageRowMine]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.messageSender, mine && styles.messageSenderMine]}>{mine ? 'Você' : message.senderName}</Text>
        {!!message.text && <Text style={[styles.messageText, mine && styles.messageTextMine]}>{message.text}</Text>}
        {!!message.workout && <View style={styles.assignedWorkout}>
          <Text style={styles.workoutEyebrow}>TREINO PERSONALIZADO</Text>
          <Text style={styles.workoutTitle}>{message.workout.title}</Text>
          <Text style={styles.workoutMeta}>{message.workout.exercises?.length || 0} exercícios · {message.workout.duration} min · {message.workout.level}</Text>
          {(message.workout.exercises || []).slice(0, 5).map((exercise, index) => <Text key={message.id + '-' + (exercise.id || index)} style={styles.workoutExercise}>{index + 1}. {exercise.name} · {exercise.sets} séries · {exercise.reps} reps</Text>)}
          {message.workout.exercises?.length > 5 && <Text style={styles.workoutMeta}>+ {message.workout.exercises.length - 5} exercícios</Text>}
          {!isProfessional && <Pressable disabled={startingWorkoutId === message.id} onPress={() => openAssignedWorkout(message)} style={styles.openWorkoutButton} accessibilityRole="button" accessibilityLabel={'Começar o treino ' + message.workout.title}>
            <Text style={styles.openWorkoutText}>{startingWorkoutId === message.id ? 'Abrindo treino...' : 'Começar este treino'} <Feather name="arrow-right" size={13} color="white" accessibilityElementsHidden importantForAccessibility="no" /></Text>
          </Pressable>}
        </View>}
        <Text style={[styles.messageTime, mine && styles.messageTimeMine]}>{formatMessageTime(message.createdAt)}</Text>
      </View>
    </View>;
  };

  const renderDirectoryRow = ({ item }) => {
    if (item.type === 'heading') return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{item.title}</Text><Text style={styles.inboxCount}>{item.count}</Text></View>;
    if (item.type === 'loading-professionals') return <LoadingState message="Carregando profissionais..." />;
    if (item.type === 'empty-professionals') return <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{professionals.length === 0 ? 'Ainda não há profissionais disponíveis.' : 'Nenhum profissional encontrado.'}</Text>
      <Text style={styles.helper}>{professionals.length === 0 ? 'Os profissionais aprovados pela equipe aparecerão aqui.' : 'Tente buscar por outro nome.'}</Text>
    </Card>;
    if (item.type === 'loading-inbox') return <LoadingState message="Carregando suas conversas..." />;
    if (item.type === 'empty-inbox') return <Card style={styles.emptyCard}><Text style={styles.emptyTitle}>Nenhuma mensagem por enquanto.</Text><Text style={styles.helper}>Quando um aluno entrar em contato, a conversa aparecerá aqui.</Text></Card>;
    if (item.type === 'professional') {
      const hasConversation = conversations.some((conversation) => conversation.professionalId === item.id.replace('professional-', ''));
      return <Pressable onPress={() => chooseProfessional({ ...item, id: item.id.replace('professional-', '') })} accessibilityRole="button" accessibilityLabel={(item.name || 'Profissional') + ', abrir contato'} style={styles.directoryPressable}>
        <Card style={styles.professionalCard}>
          <View style={styles.professionalTop}><View style={styles.largeAvatar}><Text style={styles.largeAvatarText}>{(item.name || '?').slice(0, 1).toUpperCase()}</Text></View><View style={styles.availability}><View style={styles.availabilityDot} /><Text style={styles.availabilityText}>Disponível</Text></View></View>
          <Text style={styles.professionalName}>{item.name || 'Profissional de saúde'}</Text>
          <Text style={styles.professionalCaption}>Profissional de saúde · Registro conferido</Text>
          <View style={styles.profileAction}><Text style={styles.profileActionText}>{hasConversation ? 'Abrir conversa' : 'Enviar mensagem'}</Text><Feather name="chevron-right" size={18} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /></View>
        </Card>
      </Pressable>;
    }
    const conversation = conversations.find((value) => value.id === item.id.replace('conversation-', ''));
    if (!conversation) return null;
    const name = isProfessional ? conversation.studentName : conversation.professionalName;
    return <Pressable onPress={() => { setMessagesLoading(true); setSelected(conversation); setError(''); }} accessibilityRole="button" accessibilityLabel={'Abrir conversa com ' + (name || otherPartyLabel)} style={styles.directoryPressable}>
      <Card style={styles.conversationCard}><View style={styles.avatar}><Text style={styles.avatarText}>{(name || '?').slice(0, 1).toUpperCase()}</Text></View><View style={styles.conversationCopy}><Text style={styles.personName}>{name || otherPartyLabel}</Text><Text style={styles.helper}>{isProfessional ? 'Aluno que entrou em contato' : 'Toque para continuar a conversa'}</Text></View><Feather name="chevron-right" size={18} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /></Card>
    </Pressable>;
  };

  const listHeader = <View>
    <PageHeading eyebrow={isProfessional ? 'CONEXÃO COM SEUS ALUNOS' : 'ACOMPANHAMENTO DE SAÚDE'} title={heading} description={isProfessional ? 'Responda aos alunos que entraram em contato com você.' : 'Veja profissionais verificados e escolha com quem quer conversar.'} />
    {!isProfessional && <View style={styles.searchBox}><TextInput value={search} onChangeText={setSearch} placeholder="Buscar profissional pelo nome" placeholderTextColor={colors.muted} style={styles.searchInput} accessibilityLabel="Buscar profissional pelo nome" returnKeyType="search" /></View>}
  </View>;

  const listEmpty = isProfessional
    ? (conversationsLoading ? <LoadingState message="Carregando suas conversas..." /> : null)
    : (professionalsLoading || conversationsLoading ? <LoadingState message="Carregando profissionais e conversas..." /> : null);

  if (!canUseScreen) return <View style={styles.page}><Card><Text style={styles.emptyTitle}>Esta área não está disponível para este perfil.</Text></Card></View>;

  return <View style={styles.page}>
    {!selectedConversation && !selectedProfessional ? <FlatList
      data={directoryRows}
      keyExtractor={(item) => item.id}
      renderItem={renderDirectoryRow}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      ListFooterComponent={error ? <View style={styles.listError}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Button title="Tentar novamente" onPress={retryListeners} variant="secondary" /></View> : null}
      contentContainerStyle={styles.directoryContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={professionalsLoading || conversationsLoading} onRefresh={retryListeners} tintColor={colors.green} colors={[colors.green]} />}
    /> : <>
      <PageHeading eyebrow={isProfessional ? 'CONEXÃO COM SEUS ALUNOS' : 'ACOMPANHAMENTO DE SAÚDE'} title={heading} />
      {selectedConversation ? <Card style={styles.chatCard}>
        <View style={styles.chatHeader}>
          <Pressable onPress={closeConversation} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Voltar para a lista"><Feather name="arrow-left" size={15} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /><Text style={styles.backText}>{isProfessional ? 'Mensagens' : 'Profissionais'}</Text></Pressable>
          <View style={styles.person}><View style={styles.avatar}><Text style={styles.avatarText}>{otherName.slice(0, 1).toUpperCase()}</Text></View><View><Text style={styles.personName}>{otherName}</Text><Text style={styles.personRole}>{otherPartyLabel}</Text></View></View>
        </View>
        <FlatList
          ref={messageListRef}
          data={messages}
          keyExtractor={(message) => message.id}
          renderItem={renderMessage}
          style={styles.messages}
          contentContainerStyle={styles.messageContent}
          ListEmptyComponent={messagesLoading ? <LoadingState message="Carregando mensagens..." /> : <Text style={styles.emptyMessage}>Envie uma mensagem para começar a conversa.</Text>}
          onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />
        {isProfessional && <View style={styles.composerModes}>
          <Pressable onPress={() => setComposerMode('message')} style={[styles.modeButton, composerMode === 'message' && styles.modeButtonActive]} accessibilityRole="button" accessibilityState={{ selected: composerMode === 'message' }}><Text style={[styles.modeText, composerMode === 'message' && styles.modeTextActive]}>Mensagem</Text></Pressable>
          <Pressable onPress={() => setComposerMode('workout')} style={[styles.modeButton, composerMode === 'workout' && styles.modeButtonActive]} accessibilityRole="button" accessibilityState={{ selected: composerMode === 'workout' }}><Text style={[styles.modeText, composerMode === 'workout' && styles.modeTextActive]}>+ Enviar treino</Text></Pressable>
        </View>}
        {isProfessional && composerMode === 'workout' && <View style={styles.workoutBuilder}>
          <Text style={styles.builderTitle}>Monte o treino para {otherName || 'o aluno'}</Text>
          <TextInput value={workoutTitle} onChangeText={setWorkoutTitle} placeholder="Nome do treino" placeholderTextColor={colors.muted} style={styles.input} maxLength={60} accessibilityLabel="Nome do treino" />
          <View style={styles.builderOptions}>{[20, 30, 45, 60].map((minutes) => <Pressable key={minutes} onPress={() => setWorkoutDuration(minutes)} style={[styles.durationOption, workoutDuration === minutes && styles.durationOptionActive]} accessibilityRole="button" accessibilityState={{ selected: workoutDuration === minutes }}><Text style={[styles.durationText, workoutDuration === minutes && styles.durationTextActive]}>{minutes} min</Text></Pressable>)}</View>
          <View style={styles.builderOptions}>{['Iniciante', 'Intermediário', 'Avançado'].map((level) => <Pressable key={level} onPress={() => setWorkoutLevel(level)} style={[styles.durationOption, workoutLevel === level && styles.durationOptionActive]} accessibilityRole="button" accessibilityState={{ selected: workoutLevel === level }}><Text style={[styles.durationText, workoutLevel === level && styles.durationTextActive]}>{level}</Text></Pressable>)}</View>
          <Text style={styles.builderLabel}>EXERCÍCIOS · {assignedExercises.length} selecionados</Text>
          <ScrollView style={styles.exercisePicker} nestedScrollEnabled showsVerticalScrollIndicator>{defaultExercises.slice(0, 24).map((exercise) => { const active = selectedExerciseIds.includes(exercise.id); return <Pressable key={exercise.id} onPress={() => setSelectedExerciseIds((ids) => active ? ids.filter((id) => id !== exercise.id) : ids.length < 20 ? [...ids, exercise.id] : ids)} style={[styles.exerciseOption, active && styles.exerciseOptionActive]} accessibilityRole="button" accessibilityLabel={exercise.name + (active ? ', selecionado' : ', selecionar')} accessibilityState={{ selected: active }}><Text style={[styles.exerciseCheck, active && styles.exerciseCheckActive]}>{active ? '✓' : '+'}</Text><Text style={styles.exerciseOptionText}>{exercise.name}</Text><Text style={styles.exerciseReps}>{exercise.reps}</Text></Pressable>; })}</ScrollView>
        </View>}
        <View style={styles.composer}>
          <TextInput value={draft} onChangeText={setDraft} placeholder={composerMode === 'workout' ? 'Observação para acompanhar o treino (opcional)' : 'Escreva uma mensagem...'} placeholderTextColor={colors.muted} style={styles.messageInput} multiline maxLength={2000} accessibilityLabel="Mensagem" />
          <Pressable onPress={sendMessage} disabled={busy || (composerMode === 'message' && !draft.trim()) || (composerMode === 'workout' && (!workoutTitle.trim() || assignedExercises.length === 0))} style={[styles.sendButton, (busy || (composerMode === 'message' && !draft.trim()) || (composerMode === 'workout' && assignedExercises.length === 0)) && styles.sendButtonDisabled]} accessibilityRole="button" accessibilityLabel={composerMode === 'workout' ? 'Enviar treino' : 'Enviar mensagem'} accessibilityState={{ disabled: busy }}><Text style={styles.sendText}>{busy ? '...' : composerMode === 'workout' ? 'Enviar treino' : 'Enviar'}</Text></Pressable>
        </View>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      </Card> : <Card style={styles.startCard}>
        <Pressable onPress={closeConversation} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Voltar para profissionais"><Feather name="arrow-left" size={15} color={colors.green} accessibilityElementsHidden importantForAccessibility="no" /><Text style={styles.backText}>Voltar para profissionais</Text></Pressable>
        <View style={styles.person}><View style={styles.avatar}><Text style={styles.avatarText}>{(selectedProfessional.name || '?').slice(0, 1).toUpperCase()}</Text></View><View><Text style={styles.personName}>{selectedProfessional.name}</Text><Text style={styles.personRole}>Profissional de saúde</Text></View></View>
        <Text style={styles.helper}>Envie uma mensagem para iniciar o contato. Você pode pedir um treino específico ou explicar o que precisa.</Text>
        <TextInput value={firstMessage} onChangeText={setFirstMessage} placeholder="Ex.: Gostaria de um treino para fortalecer os joelhos..." placeholderTextColor={colors.muted} multiline maxLength={2000} style={[styles.input, styles.firstMessageInput]} accessibilityLabel="Mensagem inicial" returnKeyType="send" />
        <Pressable onPress={startConversation} disabled={busy} style={[styles.primaryButton, busy && styles.sendButtonDisabled]} accessibilityRole="button" accessibilityLabel="Enviar mensagem inicial" accessibilityState={{ disabled: busy }}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Enviar mensagem</Text>}</Pressable>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      </Card>}
    </>}
  </View>;

}

function formatMessageTime(timestamp) {
  const date = timestamp?.toDate?.();
  if (!date || Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function createStyles(colors) { return StyleSheet.create({
  page: { flex: 1, width: '100%', maxWidth: 1120, minHeight: 0 }, directoryContent: { flexGrow: 1, paddingBottom: 16 }, directoryPressable: { width: '100%', marginBottom: 10 }, listError: { paddingVertical: 10, gap: 8 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 9, marginBottom: 12 }, conversationsHeader: { marginTop: 28 }, sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, helper: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  searchBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white, marginBottom: 17 }, searchIcon: { color: colors.green, fontSize: 21 }, searchInput: { flex: 1, color: colors.ink, fontSize: 13 }, inboxCount: { color: colors.green, backgroundColor: colors.pale, overflow: 'hidden', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: '800' },
  professionalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, professionalPressable: { width: '100%' }, professionalPressableWide: { width: '48.5%' }, professionalCard: { padding: 17, borderRadius: 15 }, professionalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, largeAvatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pale }, largeAvatarText: { color: colors.green, fontSize: 21, fontWeight: '800' }, availability: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.pale }, availabilityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#5C9A65' }, availabilityText: { color: colors.green, fontSize: 10, fontWeight: '700' }, professionalName: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 14 }, professionalCaption: { color: colors.muted, fontSize: 11, marginTop: 4 }, profileAction: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.line, marginTop: 14, paddingTop: 10 }, profileActionText: { color: colors.green, fontSize: 11, fontWeight: '800' },
  emptyCard: { paddingVertical: 19 }, emptyTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' }, conversationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 9 }, avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pale }, avatarText: { color: colors.green, fontWeight: '800', fontSize: 15 }, conversationCopy: { flex: 1 }, personName: { color: colors.ink, fontSize: 13, fontWeight: '800' }, chevron: { color: colors.green, fontSize: 24 },
  startCard: { marginBottom: 22, gap: 10 }, backButton: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingRight: 12 }, backText: { color: colors.green, fontSize: 12, fontWeight: '700' }, person: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 3 }, personRole: { color: colors.muted, fontSize: 10, marginTop: 3 }, input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.field, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, color: colors.ink, fontSize: 13 }, firstMessageInput: { minHeight: 105, textAlignVertical: 'top', marginTop: 7 }, primaryButton: { minHeight: 48, backgroundColor: colors.green, borderRadius: 10, marginTop: 5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, primaryButtonText: { color: 'white', fontSize: 12, fontWeight: '800' },
  chatCard: { flex: 1, minHeight: 0, padding: 0, overflow: 'hidden' }, chatHeader: { padding: 16, borderBottomWidth: 1, borderColor: colors.line, gap: 13 }, messages: { flex: 1, minHeight: 180 }, messageContent: { flexGrow: 1, padding: 14, gap: 10 }, emptyMessage: { color: colors.muted, fontSize: 12, textAlign: 'center', marginVertical: 30 }, messageRow: { flexDirection: 'row', justifyContent: 'flex-start' }, messageRowMine: { justifyContent: 'flex-end' }, bubble: { maxWidth: '88%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 13 }, bubbleOther: { backgroundColor: colors.soft, borderBottomLeftRadius: 4 }, bubbleMine: { backgroundColor: colors.green, borderBottomRightRadius: 4 }, messageSender: { color: colors.green, fontWeight: '800', fontSize: 9, marginBottom: 4 }, messageSenderMine: { color: '#D9EDE2' }, messageText: { color: colors.ink, fontSize: 12, lineHeight: 18 }, messageTextMine: { color: 'white' }, messageTime: { color: colors.muted, fontSize: 9, textAlign: 'right', marginTop: 5 }, messageTimeMine: { color: '#D9EDE2' },
  assignedWorkout: { backgroundColor: colors.white, borderRadius: 10, padding: 11, marginTop: 9, minWidth: 230 }, workoutEyebrow: { color: colors.green, fontSize: 8, letterSpacing: 1, fontWeight: '800' }, workoutTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 4 }, workoutMeta: { color: colors.muted, fontSize: 9, lineHeight: 15, marginTop: 4 }, workoutExercise: { color: colors.ink, fontSize: 9, lineHeight: 15, marginTop: 5 }, openWorkoutButton: { minHeight: 44, borderRadius: 8, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, marginTop: 9 }, openWorkoutText: { color: 'white', fontSize: 10, fontWeight: '800' },
  composerModes: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 12 }, modeButton: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 9, backgroundColor: colors.soft }, modeButtonActive: { backgroundColor: colors.pale }, modeText: { color: colors.muted, fontSize: 10, fontWeight: '700' }, modeTextActive: { color: colors.green, fontWeight: '800' }, workoutBuilder: { marginHorizontal: 12, marginTop: 10, padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 11, backgroundColor: colors.canvas }, builderTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginBottom: 10 }, builderOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }, durationOption: { minHeight: 32, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white }, durationOptionActive: { borderColor: colors.green, backgroundColor: colors.pale }, durationText: { color: colors.muted, fontSize: 9, fontWeight: '700' }, durationTextActive: { color: colors.green }, builderLabel: { color: colors.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 0.7, marginTop: 12, marginBottom: 7 }, exercisePicker: { maxHeight: 230, borderWidth: 1, borderColor: colors.line, borderRadius: 9, overflow: 'hidden', backgroundColor: colors.white }, exerciseOption: { minHeight: 37, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: colors.line }, exerciseOptionActive: { backgroundColor: colors.pale }, exerciseCheck: { width: 18, height: 18, textAlign: 'center', textAlignVertical: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 5, color: colors.green, fontSize: 11, fontWeight: '800', overflow: 'hidden' }, exerciseCheckActive: { backgroundColor: colors.green, color: 'white', borderColor: colors.green }, exerciseOptionText: { flex: 1, color: colors.ink, fontSize: 9, fontWeight: '600' }, exerciseReps: { color: colors.muted, fontSize: 8 }, composer: { padding: 12, borderTopWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, messageInput: { flex: 1, minHeight: 44, maxHeight: 110, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.field, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.ink, fontSize: 13 }, sendButton: { minHeight: 44, minWidth: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.green, paddingHorizontal: 12 }, sendButtonDisabled: { opacity: 0.55 }, sendText: { color: 'white', fontSize: 11, fontWeight: '800' }, error: { color: colors.red, fontSize: 12, lineHeight: 18, marginTop: 11 },
}); }
