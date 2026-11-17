const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

initializeApp();

exports.deleteMyAccount = onCall({ region: 'us-central1', timeoutSeconds: 540, memory: '1GiB' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Entre novamente para excluir sua conta.');

  const authenticatedAt = Number(request.auth.token.auth_time || 0);
  if (!authenticatedAt || Date.now() / 1000 - authenticatedAt > 300) {
    throw new HttpsError('failed-precondition', 'Confirme sua senha novamente e tente excluir a conta.');
  }

  const uid = request.auth.uid;
  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const [studentConversations, professionalConversations] = await Promise.all([
    db.collection('conversations').where('studentId', '==', uid).get(),
    db.collection('conversations').where('professionalId', '==', uid).get(),
  ]);
  const conversationRefs = new Map();
  for (const conversation of [...studentConversations.docs, ...professionalConversations.docs]) {
    conversationRefs.set(conversation.ref.path, conversation.ref);
  }

  try {
    for (const conversationRef of conversationRefs.values()) await db.recursiveDelete(conversationRef);
    await db.recursiveDelete(userRef);
    await db.doc(`professionals/${uid}`).delete();
    await getAuth().deleteUser(uid);
    return { deleted: true };
  } catch {
    throw new HttpsError('internal', 'Não foi possível concluir a exclusão. Tente novamente ou fale com o suporte do Actus.');
  }
});
