import { createContext, useContext, useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../lib/firebase';
import { db } from '../lib/firebaseConfig';

const AuthContext = createContext(null);
export const PRIVACY_POLICY_VERSION = '1.0-2026-11';

function authError(error) {
  if (!error?.code && error?.message) return error;
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

async function readUser(firebaseUser) {
  const token = await firebaseUser.getIdTokenResult();
  const profileRef = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(profileRef);
  const profile = snapshot.exists() ? snapshot.data() : {};
  if (snapshot.exists() && !('accountType' in profile)) {
    await updateDoc(profileRef, { accountType: 'user', updatedAt: serverTimestamp() });
    profile.accountType = 'user';
  }
  const accountType = profile.accountType === 'health_professional' ? 'health_professional' : 'user';
  let professionalVerified = false;
  if (accountType === 'health_professional' && profile.professionalRegistrationNumber) {
    try {
      await syncProfessionalDirectory(firebaseUser, profile.name || firebaseUser.displayName || 'Profissional', profile.professionalRegistrationNumber);
      const directory = await getDoc(doc(db, 'professionals', firebaseUser.uid));
      professionalVerified = directory.exists() && directory.data().verified === true;
    } catch { /* A temporary directory error must not grant professional access. */ }
  }
  const isAdmin = token.claims.admin === true;
  return {
    uid: firebaseUser.uid,
    name: profile.name || firebaseUser.displayName || '',
    email: firebaseUser.email || '',
    emailVerified: firebaseUser.emailVerified,
    goal: profile.goal || 'Criar uma rotina',
    accountType,
    professionalRegistrationNumber: profile.professionalRegistrationNumber || '',
    professionalVerified,
    role: isAdmin ? 'admin' : accountType === 'health_professional' ? (professionalVerified ? 'health_professional' : 'pending_professional') : 'user',
  };
}

async function syncProfessionalDirectory(firebaseUser, name, registrationNumber) {
  const professionalRef = doc(db, 'professionals', firebaseUser.uid);
  const directory = await getDoc(professionalRef);
  const profile = {
    name,
    accountType: 'health_professional',
    registrationNumber,
    verified: directory.exists() && directory.data().verified === true,
    updatedAt: serverTimestamp(),
  };
  if (directory.exists()) await updateDoc(professionalRef, profile);
  else await setDoc(professionalRef, { ...profile, verified: false });
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
        if (activeUid === firebaseUser.uid) {
          const token = await firebaseUser.getIdTokenResult().catch(() => ({ claims: {} }));
          const isAdmin = token.claims.admin === true;
          setSession({ user: { uid: firebaseUser.uid, name: firebaseUser.displayName || '', email: firebaseUser.email || '', goal: 'Criar uma rotina', accountType: 'user', role: isAdmin ? 'admin' : 'user' } });
        }
      } finally {
        setReady(true);
      }
    });
  }, []);

  async function register({ name, email, password, accountType, professionalRegistrationNumber, privacyConsent }) {
    try {
      if (!privacyConsent) throw new Error('Leia e aceite a Política de Privacidade para criar sua conta.');
      const normalizedName = name.trim();
      if (normalizedName.length < 2 || normalizedName.length > 80) throw new Error('Informe um nome entre 2 e 80 caracteres.');
      const normalizedEmail = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Informe um e-mail válido.');
      if (password.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
      const selectedAccountType = accountType === 'health_professional' ? 'health_professional' : 'user';
      const normalizedRegistration = String(professionalRegistrationNumber || '').trim();
      if (selectedAccountType === 'health_professional' && (normalizedRegistration.length < 3 || normalizedRegistration.length > 40)) {
        throw new Error('Informe seu registro profissional (de 3 a 40 caracteres).');
      }
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: normalizedName });
      const user = { uid: credential.user.uid, name: normalizedName, email: credential.user.email, emailVerified: credential.user.emailVerified, goal: 'Criar uma rotina', accountType: selectedAccountType, professionalRegistrationNumber: normalizedRegistration, professionalVerified: false, role: selectedAccountType === 'health_professional' ? 'pending_professional' : 'user' };
      await setDoc(doc(db, 'users', user.uid), {
        name: user.name,
        email: user.email,
        goal: user.goal,
        accountType: selectedAccountType,
        ...(selectedAccountType === 'health_professional' ? { professionalRegistrationNumber: normalizedRegistration } : {}),
        privacyConsentAt: serverTimestamp(),
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
        createdAt: serverTimestamp(),
      });
      if (selectedAccountType === 'health_professional') await syncProfessionalDirectory(credential.user, user.name, normalizedRegistration);
      setSession({ user });
      return user;
    } catch (error) { throw authError(error); }
  }

  async function login({ email, password }) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await credential.user.getIdTokenResult(true);
      const user = await readUser(credential.user);
      setSession({ user });
      return user;
    } catch (error) { throw authError(error); }
  }

  async function updateUser(changes) {
    if (!auth.currentUser) throw new Error('Entre novamente para alterar suas configurações.');
    try {
      const user = { ...session.user, ...changes };
      const normalizedName = user.name.trim();
      if (normalizedName.length < 2 || normalizedName.length > 80) throw new Error('Informe um nome entre 2 e 80 caracteres.');
      const changesToSave = { name: normalizedName, goal: user.goal, updatedAt: serverTimestamp() };
      if (changes.professionalRegistrationNumber) {
        const registrationNumber = changes.professionalRegistrationNumber.trim();
        if (registrationNumber.length < 3 || registrationNumber.length > 40) throw new Error('Informe um registro profissional entre 3 e 40 caracteres.');
        changesToSave.professionalRegistrationNumber = registrationNumber;
      }
      await updateDoc(doc(db, 'users', user.uid), changesToSave);
      await updateProfile(auth.currentUser, { displayName: user.name.trim() });
      const professionalRegistrationNumber = changesToSave.professionalRegistrationNumber || user.professionalRegistrationNumber;
      if (user.accountType === 'health_professional' && professionalRegistrationNumber) {
        await syncProfessionalDirectory(auth.currentUser, normalizedName, professionalRegistrationNumber);
      }
      setSession({ user: { ...user, name: normalizedName, professionalRegistrationNumber } });
    } catch (error) { throw authError(error); }
  }

  async function logout() { await signOut(auth); setSession(null); }

  const value = { session, ready, login, register, logout, updateUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
