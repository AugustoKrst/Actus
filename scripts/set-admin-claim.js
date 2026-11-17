const path = require('node:path');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }
  const credentialPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialPath) return cert(require(path.resolve(credentialPath)));
  return applicationDefault();
}

async function main() {
  const [identifier, operation = 'grant'] = process.argv.slice(2);
  if (!identifier || !['grant', 'revoke'].includes(operation)) {
    throw new Error('Uso: node scripts/set-admin-claim.js <UID-ou-e-mail> [grant|revoke]');
  }

  const appOptions = { credential: getCredential() };
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (projectId) appOptions.projectId = projectId;
  const app = initializeApp(appOptions);
  const auth = getAuth(app);
  const user = identifier.includes('@') ? await auth.getUserByEmail(identifier) : await auth.getUser(identifier);
  const claims = { ...(user.customClaims || {}) };
  if (operation === 'grant') claims.admin = true;
  else delete claims.admin;
  await auth.setCustomUserClaims(user.uid, Object.keys(claims).length ? claims : null);

  process.stdout.write(`Claim de administrador ${operation === 'grant' ? 'concedida a' : 'removida de'} ${user.uid}.\n`);
  process.stdout.write('A pessoa deve sair e entrar novamente para atualizar o token.\n');
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
