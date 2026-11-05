# Actus

O Actus é um aplicativo de bem-estar e atividade física que ajuda pessoas a incluir mais movimento na rotina com treinos adaptados ao tempo, ao espaço, aos equipamentos e ao nível de experiência disponíveis.

## Problema e proposta

O comportamento sedentário, como passar longos períodos sentado ou deitado, é um tema relevante de saúde pública. A falta de tempo, de equipamentos ou de orientação também pode dificultar o início e a continuidade de uma rotina ativa. O [Guia de Atividade Física para a População Brasileira, do Ministério da Saúde](https://www.gov.br/saude/pt-br/assuntos/saude-brasil/eu-quero-me-exercitar/documentos/pdf/guia_atividade_fisica_populacao_brasileira.pdf) recomenda reduzir períodos prolongados sem movimento e incluir pausas ativas ao longo do dia.

O público do Actus são pessoas que querem começar ou retomar atividades físicas com uma proposta simples e adaptável. O aplicativo permite montar treinos conforme grupo muscular, local, equipamentos disponíveis, duração e nível. A sessão interativa e o histórico ajudam a acompanhar os exercícios e visualizar os treinos concluídos.

## Escopo e funcionalidades

O protótipo navegável inclui:

- Cadastro, login e encerramento de sessão por e-mail e senha.
- Início com apresentação da proposta e acesso ao fluxo de treino.
- Montagem de treinos por grupo muscular, local, equipamentos, duração e nível.
- Sessão para marcar exercícios concluídos e acompanhar o progresso.
- Histórico de treinos finalizados.
- Perfil com nome e objetivo pessoal.
- Tema claro ou escuro, salvo no dispositivo.

### Perfis e permissões previstos

O sistema terá visitantes e dois níveis distintos de usuários autenticados:

| Perfil | Permissões previstas |
| --- | --- |
| Visitante | Acessar cadastro e login. As demais áreas exigem autenticação. |
| Usuário | Consultar e editar o próprio perfil; criar treinos; registrar o progresso e consultar apenas o próprio histórico. |
| Administrador | Gerenciar catálogo de exercícios e contas de usuário. Não tem acesso automático aos dados pessoais ou ao histórico privado dos usuários. |

As permissões de administrador fazem parte do planejamento e ainda não estão implementadas no protótipo. No sistema completo, a API deverá validar o papel associado à conta em cada operação protegida; a interface do aplicativo não será a única barreira de autorização.

## Fluxo e telas

1. A pessoa cria uma conta ou entra no aplicativo.
2. A tela **Início** apresenta o propósito do Actus.
3. Em **Treino**, escolhe preferências e gera uma sequência de exercícios.
4. Em **Sessão**, marca exercícios concluídos; ao finalizar, o treino aparece no **Histórico**.
5. Pelo menu, pode abrir **Perfil** e **Configurações**.

As rotas estão em `src/app/`: `login.js`, `inicio.js`, `treino.js`, `sessao.js`, `historico.js`, `perfil.js` e `configuracoes.js`. A navegação usa Expo Router, com controle de acesso às rotas autenticadas.

## Estrutura do projeto

```text
src/
├── app/                  # Rotas e telas Expo Router
├── components/           # Elementos reutilizáveis da interface
├── context/              # Estado de autenticação e tema
└── lib/                  # Integrações e lógica do catálogo de exercícios
```

## Arquitetura

Conforme a orientação do professor para este projeto, o backend desta entrega permanece no Firebase. O aplicativo Expo/React Native usa o Firebase Authentication para cadastro e login e o Cloud Firestore para persistir perfis, treinos e progresso. Não há API Express nem banco MySQL neste escopo.

```text
Aplicativo Expo / React Native
        ├── Firebase Authentication: cadastro, login e sessão
        └── Firebase SDK → Cloud Firestore: perfil e treinos
                            └── firestore.rules: autenticação, propriedade e validação
```

O acesso ao Firestore é feito diretamente pelo SDK oficial do Firebase, não por `fetch()` nem por uma API REST própria. As regras do Firestore são a barreira de autorização dos dados: cada pessoa autenticada só pode ler e alterar o próprio perfil e seus próprios treinos.

### Requisitos funcionais atualizados

- Criar conta, entrar e sair usando e-mail e senha.
- Criar treinos a partir das preferências de grupo muscular, local, equipamentos, duração e nível.
- Consultar o próprio treino e o histórico de treinos concluídos.
- Atualizar o progresso de um treino, marcando exercícios concluídos.
- Excluir um treino do próprio histórico.
- Consultar e atualizar o próprio perfil.
- Impedir acesso de visitantes às áreas autenticadas e impedir que uma conta acesse dados de outra.

### Modelo de dados do Cloud Firestore

| Caminho | Campos principais | Uso |
| --- | --- | --- |
| `users/{uid}` | `name: string`, `email: string`, `goal: string`, `createdAt: timestamp`, `updatedAt?: timestamp` | Perfil do usuário autenticado. O ID do documento é o UID do Firebase Authentication. |
| `users/{uid}/workouts/{workoutId}` | `title: string`, `muscle: string`, `place: string`, `equipment: string[]`, `duration: number`, `level: string`, `exercises: object[]`, `completedExerciseIds: string[]`, `completedAt: timestamp \| null`, `createdAt: timestamp` | Treino criado e progresso individual. Cada exercício contém `id`, `name`, `sets`, `reps`, `rest_seconds` e `instructions`. |

O catálogo usado para montar os treinos é estático em `src/lib/exercises.js`; os documentos de treino guardam uma cópia dos exercícios escolhidos para preservar o conteúdo daquela sessão.

### Operações de dados e fluxo

| Operação | Caminho no Firestore | Implementação |
| --- | --- | --- |
| Criar treino | `users/{uid}/workouts` | `addDoc()` em `generateAndSaveWorkout()` após escolher as preferências. |
| Consultar treino | `users/{uid}/workouts/{workoutId}` | `getDoc()` em `getSavedWorkout()` para abrir a sessão. |
| Listar histórico | `users/{uid}/workouts` | `getDocs()` em `listCompletedWorkouts()`, filtrando treinos concluídos. |
| Atualizar progresso | `users/{uid}/workouts/{workoutId}` | `updateDoc()` em `saveWorkoutProgress()` ao marcar ou desmarcar exercícios. |
| Excluir treino | `users/{uid}/workouts/{workoutId}` | `deleteDoc()` em `deleteSavedWorkout()`, disponível no histórico com confirmação na tela. |

O fluxo principal é **Início → Treino → Sessão → Histórico**. A sessão lê o treino, atualiza o progresso no Firestore e o histórico lista os treinos concluídos. As regras correspondentes estão versionadas em `firestore.rules`; elas precisam estar publicadas no projeto Firebase configurado para que as operações funcionem.

### Níveis e permissões previstos

Visitantes podem abrir somente cadastro e login. Usuários autenticados podem acessar e alterar o próprio perfil, criar treinos, atualizar o próprio progresso e excluir os próprios treinos. O perfil administrador continua planejado para uma etapa posterior e ainda não existe no protótipo. As regras atuais não concedem permissões administrativas.

### Escopo desta entrega

Esta entrega registra a modelagem documental do Firestore e integra as operações de criar, consultar, atualizar e excluir treinos no aplicativo. Por autorização do professor, Firebase é a tecnologia de backend e persistência adotada no lugar de Express/MySQL; portanto, não são usados `fetch()`, endpoints próprios ou tabelas SQL. JWT próprio, hash de senha gerenciado pela aplicação, papel administrador e permissões administrativas continuam fora do escopo desta etapa.

## Executar o aplicativo

Requisitos: Node.js e npm. Instale as dependências e inicie o Expo:

```bash
npm install
npx expo start
```

Para habilitar login e persistência, configure as variáveis Firebase listadas em `.env.example` em um arquivo `.env` local. Sem essa configuração, o aplicativo apresenta a tela de configuração do Firebase. Publique as regras de `firestore.rules` no projeto Firebase antes de usar as operações protegidas.

## Tecnologias do protótipo

- Expo SDK 57, React Native e React Native Web.
- Expo Router para navegação.
- Firebase Authentication e Cloud Firestore como backend desta entrega.
- AsyncStorage para salvar a preferência de tema e persistência nativa da sessão.

## Versão

O aplicativo está configurado como versão **1.0.0**. A Entrega 1 estabeleceu a proposta, telas e navegação. Nesta etapa, o app persiste perfis e treinos no Firebase; as próximas etapas podem ampliar autenticação, papéis de usuário e permissões conforme o escopo acordado com o professor.
