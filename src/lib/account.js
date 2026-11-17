import { EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';
import { app } from './firebaseConfig';

export async function deleteMyAccount(password) {
  const currentUser = auth?.currentUser;
  if (!currentUser || !currentUser.email) throw new Error('Entre novamente para excluir sua conta.');
  if (!password) throw new Error('Digite sua senha para confirmar a exclusão.');

  try {
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
    await currentUser.getIdToken(true);
    const deleteAccount = httpsCallable(getFunctions(app, 'us-central1'), 'deleteMyAccount');
    await deleteAccount();
    await signOut(auth);
  } catch (error) {
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('A senha não confere. Tente novamente.');
    }
    if (error.code === 'functions/failed-precondition') {
      throw new Error('Sua sessão não foi atualizada. Entre novamente e repita a exclusão.');
    }
    if (error.code === 'functions/not-found' || error.code === 'functions/unavailable') {
      throw new Error('A exclusão de conta ainda não está disponível. Tente novamente mais tarde.');
    }
    throw new Error('Não foi possível excluir sua conta. Confira a conexão e tente novamente.');
  }
}
