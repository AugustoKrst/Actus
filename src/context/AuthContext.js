import { createContext, useContext, useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../lib/firebase';
import { db } from '../lib/firebaseConfig';

const AuthContext = createContext(null);
const ADMIN_EMAIL = 'augusto@gmail.com';

function authError(error) {
  const messages = {
    'auth/email-already-in-use': 'Este e-mail já tem uma conta.',
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/user-disabled': 'Esta conta está desativada.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    'auth/network-request-failed': 'Sem conexão com a internet. Tente novamente.',
  };
  return new Error(messages[error.code] || 'Não foi possível concluir. Confira a conexão e tente novamente.');
}

function userRole(email, accountType) {
  if (email?.trim().toLowerCase() === ADMIN_EMAIL) return 'admin';
  return accountType === 'health_professional' ? 'health_professional' : 'user';
}

async function readUser(firebaseUser) {
  const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
  const profile = snapshot.exists() ? snapshot.data() : {};
  const accountType = profile.accountType === 'health_professional' ? 'health_professional' : 'user';
  if (accountType === 'health_professional') {
    try { await syncProfessionalDirectory(firebaseUser, profile.name || firebaseUser.displayName || 'Profissional'); } catch { /* Keep the account usable if directory sync is temporarily unavailable. */ }
  }
  return {
    uid: firebaseUser.uid,
    name: profile.name || firebaseUser.displayName || '',
    email: firebaseUser.email || '',
    goal: profile.goal || 'Criar uma rotina',
    accountType,
    role: userRole(firebaseUser.email, profile.accountType),
  };
}

async function syncProfessionalDirectory(firebaseUser, name) {
  await setDoc(doc(db, 'professionals', firebaseUser.uid), {
    name,
    accountType: 'health_professional',
    updatedAt: serverTimestamp(),
  });
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let activeUid = null;
    return onAuthStateChanged(auth, async (firebaseUser) => {
      activeUid = firebaseUser?.uid || null;
      if (!firebaseUser) {
        setSession(null);
        setReady(true);
        return;
      }
      try {
        const user = await readUser(firebaseUser);
        if (activeUid === firebaseUser.uid) setSession({ user });
      } catch {
        if (activeUid === firebaseUser.uid) setSession({ user: { uid: firebaseUser.uid, name: firebaseUser.displayName || '', email: firebaseUser.email || '', goal: 'Criar uma rotina', accountType: 'user', role: userRole(firebaseUser.email) } });
      } finally {
        setReady(true);
      }
    });
  }, []);

  async function register({ name, email, password, accountType }) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: name.trim() });
      const selectedAccountType = accountType === 'health_professional' ? 'health_professional' : 'user';
      const user = { uid: credential.user.uid, name: name.trim(), email: credential.user.email, goal: 'Criar uma rotina', accountType: selectedAccountType, role: userRole(credential.user.email, selectedAccountType) };
      await setDoc(doc(db, 'users', user.uid), { name: user.name, email: user.email, goal: user.goal, accountType: selectedAccountType, createdAt: serverTimestamp() });
      if (selectedAccountType === 'health_professional') {
        try { await syncProfessionalDirectory(credential.user, user.name); } catch { /* The next sign-in will retry the directory sync. */ }
      }
      setSession({ user });
      return user;
    } catch (error) { throw authError(error); }
  }

  async function login({ email, password }) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = await readUser(credential.user);
      setSession({ user });
      return user;
    } catch (error) { throw authError(error); }
  }

  async function updateUser(changes) {
    if (!auth.currentUser) throw new Error('Entre novamente para alterar suas configurações.');
    try {
      const user = { ...session.user, ...changes };
      await updateDoc(doc(db, 'users', user.uid), { name: user.name.trim(), goal: user.goal, updatedAt: serverTimestamp() });
      await updateProfile(auth.currentUser, { displayName: user.name.trim() });
      if (user.accountType === 'health_professional') {
        try { await syncProfessionalDirectory(auth.currentUser, user.name.trim()); } catch { /* The next sign-in will retry the directory sync. */ }
      }
      setSession({ user: { ...user, name: user.name.trim() } });
    } catch (error) { throw authError(error); }
  }

  async function logout() { await signOut(auth); setSession(null); }

  const value = { session, ready, login, register, logout, updateUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
