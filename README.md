# Actus

Aplicativo mobile de bem-estar e atividade física. O Actus ajuda pessoas a começar ou retomar uma rotina ativa com treinos adaptados ao tempo disponível, ao local, aos equipamentos e ao nível de experiência.

## Problema e solução

A falta de tempo, equipamento ou orientação pode dificultar a prática regular de atividade física. O Actus organiza treinos simples e adaptáveis e permite acompanhar o progresso e consultar sessões concluídas.

## Funcionalidades

- Cadastro, login e logout com e-mail e senha.
- Perfis de usuário, profissional de saúde e administrador.
- Criação de treino por grupo muscular, local, equipamentos, duração e nível.
- Sessão de treino com marcação de séries concluídas e salvamento do progresso.
- Histórico de treinos concluídos e exclusão de um treino do histórico.
- Perfil com nome e objetivo pessoal.
- Catálogo de exercícios administrado pela conta designada.
- Conversas entre usuários e profissionais de saúde.
- Preferência de tema salva no dispositivo.

## Navegação

O projeto usa Expo Router. As rotas estão em `src/app/`:

| Rota | Função |
| --- | --- |
| `login.js` | Cadastro e autenticação. |
| `inicio.js` | Entrada e apresentação do aplicativo. |
| `treino.js` | Preferências e criação de treino. |
| `sessao.js` | Execução e progresso das séries. |
| `historico.js` | Treinos concluídos e exclusão. |
| `perfil.js` | Dados pessoais e objetivo. |
| `configuracoes.js` | Preferências do aplicativo. |
| `admin.js` | Administração de exercícios e contas. |
| `atendimentos.js`, `contato.js` | Diretório e comunicação com profissionais. |

Visitantes ficam restritos ao login/cadastro. Usuários autenticados acessam os próprios dados. Profissionais mantêm um perfil público no diretório e participam de conversas com usuários. O administrador pode gerenciar o catálogo e consultar contas, mas não recebe acesso aos treinos privados de outras pessoas.

## Arquitetura e decisão sobre o backend

**O orientador autorizou o uso do Firebase no lugar de Express e MySQL neste projeto.** O app é feito com Expo e React Native; Firebase Authentication gerencia cadastro, senha e sessão, e Cloud Firestore persiste os dados. O Firebase emite tokens de identidade JWT; o SDK do Firebase os utiliza ao acessar o Firestore. Não há API REST própria, envio manual de Bearer Token ou servidor Express nesta solução aprovada.

```text
Expo / React Native
├── Firebase Authentication: cadastro, login, sessão e tokens de identidade
└── Firebase SDK → Cloud Firestore
                     └── firestore.rules: propriedade dos dados e permissões
```

### Dados e operações

| Coleção/caminho | Uso |
| --- | --- |
| `users/{uid}` | Perfil, e-mail, objetivo e tipo de conta. O ID corresponde ao UID do Authentication. |
| `users/{uid}/workouts/{workoutId}` | Treino, exercícios selecionados e séries concluídas. |
| `exercises/{exerciseId}` | Catálogo gerenciado pelo administrador. Há exercícios locais padrão em `src/lib/exercises.js` como fallback. |
| `professionals/{uid}` | Perfil publicado no diretório de profissionais. |
| `conversations/{id}/messages/{messageId}` | Conversa e mensagens entre participantes autorizados. |

O CRUD de treinos inclui criação, leitura, atualização do progresso e exclusão. O catálogo tem criação, leitura, atualização e exclusão, com escrita restrita ao administrador pelas regras do Firestore. Regras adicionais limitam perfis, diretório e mensagens aos respectivos proprietários ou participantes.

### Conversas entre usuários e profissionais

Profissionais autenticados publicam seu perfil na coleção `professionals`. Usuários escolhem um profissional em **Profissionais**; o app cria uma conversa e grava a primeira mensagem. As telas **Profissionais** e **Atendimentos** escutam as conversas e mensagens em tempo real. Cada conversa tem um aluno e um profissional; as regras permitem leitura e envio somente a esses dois participantes. Depois de publicar as regras, profissionais que já estavam cadastrados devem entrar novamente para sincronizar seu perfil no diretório.

O papel de administrador é atribuído no app à conta `augusto@gmail.com`. O menu mostra **Administração** quando `session.user.role === 'admin'`; o tipo de conta dessa pessoa continua sendo `user`. As regras do Firestore também autorizam o catálogo e a consulta de contas pelo e-mail `augusto@gmail.com`. As regras em `firestore.rules` precisam estar publicadas no projeto Firebase usado pelo build. Publique a versão atual com:

```powershell
npx.cmd firebase-tools@latest login
npx.cmd firebase-tools@latest deploy --only firestore:rules --project actus-2ba94
```

## Configuração local

Requisitos: Node.js e npm. Instale as dependências, preencha `.env` com os dados do projeto Firebase e inicie o Expo:

```powershell
npm.cmd install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd start
```

Preencha em `.env` os valores `EXPO_PUBLIC_FIREBASE_*` obtidos na configuração do app Web do Firebase. `.env` é ignorado pelo Git. Variáveis com prefixo `EXPO_PUBLIC_` são incluídas no aplicativo e não devem conter senhas de servidor, chaves privadas ou outros segredos.

### Expo não encontra `expo-modules-core`

Se o Metro mostrar `Unable to resolve module expo-modules-core`, pare o servidor Expo com `Ctrl+C` e reinstale exatamente as dependências do lockfile. Depois reinicie o Metro limpando o cache:

```powershell
npm.cmd ci
npx.cmd expo start --clear
```

`expo-modules-core` é instalado como dependência do Expo SDK. Não instale uma versão avulsa fora do SDK configurado no `package.json`.

## Verificações antes da entrega

Rode as verificações estáticas:

```powershell
npm.cmd run lint
```

O código do app é JavaScript e não há `tsconfig.json`; portanto, `tsc --noEmit` não é um typecheck aplicável a este repositório.

Faça também o teste manual em Android, com as regras publicadas e as variáveis de produção configuradas:

1. Abrir a tela de login e testar cadastro, login, logout e sessão restaurada ao reabrir o app.
2. Confirmar que visitante não acessa rotas autenticadas.
3. Criar um treino, marcar e desmarcar séries, concluir o treino, conferir o histórico e excluí-lo.
4. Confirmar que uma conta não lê nem altera o perfil ou os treinos de outra conta.
5. Testar as permissões de usuário, profissional e administrador, incluindo o CRUD do catálogo.
6. Testar diretório, abertura de conversa e envio/recebimento de mensagens pelos participantes.
7. Instalar o APK em um dispositivo Android e repetir os fluxos principais.

Registre os resultados e corrija eventuais falhas antes de publicar o commit final.

## Gerar o APK final com EAS

O repositório configura um perfil `production` de distribuição interna que gera APK. É necessário ter uma conta Expo e configurar no ambiente `production` do EAS todas as variáveis `EXPO_PUBLIC_FIREBASE_*` de `.env.example`; o `.env` local está ignorado e não é enviado ao build remoto.

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build:configure
```

Na primeira configuração, o EAS pode pedir para associar o projeto à conta Expo e gravar o ID do projeto na configuração. Depois disso, configure as variáveis Firebase do ambiente `production`, rode os testes manuais acima e faça commit e push da versão final. Então gere o APK:

```powershell
npx.cmd eas-cli@latest build --platform android --profile production
```

Ao final, baixe o APK pelo link apresentado no terminal ou no painel de builds do Expo. Instale-o em Android compatível e valide os fluxos principais. Assim o APK corresponde ao commit final do repositório.

## Estrutura

```text
src/app/          Rotas e telas Expo Router
src/components/   Componentes reutilizáveis
src/context/      Autenticação e tema
src/lib/          Firebase e lógica de exercícios/treinos
firestore.rules   Regras de segurança do Firestore
```

## Versão

Versão do aplicativo: **1.0.0**. O Android `versionCode` inicial é **1**.
