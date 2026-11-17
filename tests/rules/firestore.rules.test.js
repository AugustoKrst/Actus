const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { after, before, beforeEach, test } = require('node:test');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} = require('firebase/firestore');

const projectId = 'demo-actus-rules';
let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
});

after(async () => {
  await environment?.cleanup();
});

async function seedDocuments(documents) {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await Promise.all(documents.map(([path, data]) => setDoc(doc(firestore, path), data)));
  });
}

function account(uid, accountType = 'user') {
  return {
    name: uid,
    email: `${uid}@example.com`,
    goal: 'Criar uma rotina',
    accountType,
    createdAt: new Date(),
  };
}

function conversation(studentId, professionalId, professionalVerified = true) {
  return seedDocuments([
    [`users/${studentId}`, account(studentId)],
    [`users/${professionalId}`, {
      ...account(professionalId, 'health_professional'),
      professionalRegistrationNumber: 'CREF-12345',
    }],
    [`professionals/${professionalId}`, {
      name: professionalId,
      accountType: 'health_professional',
      registrationNumber: 'CREF-12345',
      verified: professionalVerified,
      updatedAt: new Date(),
    }],
    [`conversations/${studentId}_${professionalId}`, {
      studentId,
      studentName: studentId,
      professionalId,
      professionalName: professionalId,
      createdAt: new Date(),
    }],
  ]);
}

test('uma pessoa não consegue ler o perfil de outra', async () => {
  await seedDocuments([
    [`users/alice`, account('alice')],
    [`users/bob`, account('bob')],
  ]);

  const aliceDb = environment.authenticatedContext('alice').firestore();
  await assertSucceeds(getDoc(doc(aliceDb, 'users/alice')));
  await assertFails(getDoc(doc(aliceDb, 'users/bob')));
});

test('um profissional não consegue se aprovar nem incluir campos administrativos no perfil', async () => {
  await conversation('student', 'professional', false);
  const professionalDb = environment.authenticatedContext('professional').firestore();

  await assertFails(setDoc(doc(professionalDb, 'professionals/professional'), {
    name: 'professional',
    accountType: 'health_professional',
    registrationNumber: 'CREF-12345',
    verified: true,
    updatedAt: serverTimestamp(),
  }));
  await assertFails(setDoc(doc(professionalDb, 'users/professional'), {
    ...account('professional', 'health_professional'),
    admin: true,
  }));
});

test('uma pessoa não consegue conceder o próprio acesso de administrador', async () => {
  const aliceDb = environment.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(aliceDb, 'users/alice'), {
    ...account('alice'),
    admin: true,
  }));
});

test('uma pessoa de fora não consegue ler nem enviar mensagem em conversa alheia', async () => {
  await conversation('alice', 'professional');
  const outsiderDb = environment.authenticatedContext('outsider').firestore();
  const messages = collection(outsiderDb, 'conversations/alice_professional/messages');

  await assertFails(getDoc(doc(outsiderDb, 'conversations/alice_professional')));
  await assertFails(setDoc(doc(messages, 'intrusion'), {
    senderId: 'outsider',
    senderName: 'Pessoa de fora',
    text: 'Mensagem não autorizada',
    createdAt: serverTimestamp(),
  }));
});

test('não é possível abrir conversa com profissional não verificado', async () => {
  await seedDocuments([
    ['users/student', account('student')],
    ['users/professional', {
      ...account('professional', 'health_professional'),
      professionalRegistrationNumber: 'CREF-12345',
    }],
    ['professionals/professional', {
      name: 'professional',
      accountType: 'health_professional',
      registrationNumber: 'CREF-12345',
      verified: false,
      updatedAt: new Date(),
    }],
  ]);
  const studentDb = environment.authenticatedContext('student').firestore();

  await assertFails(setDoc(doc(studentDb, 'conversations/student_professional'), {
    studentId: 'student',
    studentName: 'student',
    professionalId: 'professional',
    professionalName: 'professional',
    createdAt: serverTimestamp(),
  }));
});

test('mensagens exigem gravação atômica e respeitam o intervalo mínimo', async () => {
  await conversation('alice', 'professional');
  const aliceDb = environment.authenticatedContext('alice').firestore();
  const messageCollection = collection(aliceDb, 'conversations/alice_professional/messages');
  const messageRef = doc(messageCollection);
  const limitRef = doc(aliceDb, 'conversations/alice_professional/sendLimits/alice');
  const batch = writeBatch(aliceDb);
  batch.set(messageRef, {
    senderId: 'alice', senderName: 'alice', text: 'Olá', createdAt: serverTimestamp(),
  });
  batch.set(limitRef, { messageId: messageRef.id, sentAt: serverTimestamp() });
  await assertSucceeds(batch.commit());

  const nextMessage = doc(messageCollection);
  const tooSoon = writeBatch(aliceDb);
  tooSoon.set(nextMessage, {
    senderId: 'alice', senderName: 'alice', text: 'Outra mensagem', createdAt: serverTimestamp(),
  });
  tooSoon.set(limitRef, { messageId: nextMessage.id, sentAt: serverTimestamp() });
  await assertFails(tooSoon.commit());

  await new Promise((resolve) => setTimeout(resolve, 4100));
  const afterCooldown = doc(messageCollection);
  const allowedAfterCooldown = writeBatch(aliceDb);
  allowedAfterCooldown.set(afterCooldown, {
    senderId: 'alice', senderName: 'alice', text: 'Agora pode enviar', createdAt: serverTimestamp(),
  });
  allowedAfterCooldown.set(limitRef, { messageId: afterCooldown.id, sentAt: serverTimestamp() });
  await assertSucceeds(allowedAfterCooldown.commit());
});

test('a professional may attach a validated workout to a message', async () => {
  await conversation('student', 'professional');
  const professionalDb = environment.authenticatedContext('professional').firestore();
  const messageRef = doc(collection(professionalDb, 'conversations/student_professional/messages'));
  const limitRef = doc(professionalDb, 'conversations/student_professional/sendLimits/professional');
  const batch = writeBatch(professionalDb);
  batch.set(messageRef, {
    senderId: 'professional',
    senderName: 'professional',
    text: 'Treino personalizado',
    workout: {
      title: 'Treino A', duration: 30, level: 'Iniciante', muscle: 'Braços', place: 'Em casa',
      equipment: ['Peso corporal'],
      exercises: [{ id: 'push-up', name: 'Flexão', sets: 3, reps: '10', rest_seconds: 60 }],
    },
    createdAt: serverTimestamp(),
  });
  batch.set(limitRef, { messageId: messageRef.id, sentAt: serverTimestamp() });

  await assertSucceeds(batch.commit());
});

test('workout progress rejects completedSetIds items with the wrong type or excessive length', async () => {
  await seedDocuments([
    ['users/alice', account('alice')],
    ['users/alice/workouts/workout', {
      title: 'Treino A', muscle: 'Braços', place: 'Em casa', equipment: [], duration: 20, level: 'Iniciante',
      exercises: [{ id: 'curl', name: 'Rosca', sets: 1, reps: '10', rest_seconds: 30 }],
      completedExerciseIds: [], completedSetIds: [], completedAt: null, createdAt: new Date(),
    }],
  ]);
  const aliceDb = environment.authenticatedContext('alice').firestore();
  const workoutRef = doc(aliceDb, 'users/alice/workouts/workout');

  await assertFails(updateDoc(workoutRef, {
    completedExerciseIds: [], completedSetIds: [123], completedAt: null,
  }));
  await assertFails(updateDoc(workoutRef, {
    completedExerciseIds: [], completedSetIds: ['x'.repeat(161)], completedAt: null,
  }));
  await assertSucceeds(updateDoc(workoutRef, {
    completedExerciseIds: ['curl'], completedSetIds: ['curl-set-1'], completedAt: serverTimestamp(),
  }));
});

test('a legacy account can migrate only to user and accountType is immutable after creation', async () => {
  await seedDocuments([
    ['users/legacy', { name: 'legacy', email: 'legacy@example.com', goal: 'Criar uma rotina' }],
    ['users/professional', account('professional', 'health_professional')],
  ]);
  const legacyDb = environment.authenticatedContext('legacy').firestore();
  const professionalDb = environment.authenticatedContext('professional').firestore();

  await assertSucceeds(updateDoc(doc(legacyDb, 'users/legacy'), {
    accountType: 'user', updatedAt: serverTimestamp(),
  }));
  await assertFails(updateDoc(doc(professionalDb, 'users/professional'), {
    accountType: 'user', updatedAt: serverTimestamp(),
  }));
});
