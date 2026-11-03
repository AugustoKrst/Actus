import { getAuth } from 'firebase/auth';
import { app } from './firebaseConfig';

export const auth = app ? getAuth(app) : null;
