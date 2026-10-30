# Actus — proposta e versão inicial

O Actus é um aplicativo de bem-estar e atividade física que ajuda pessoas a incluir mais movimento na rotina com treinos adaptados ao tempo, ao espaço, aos equipamentos e ao nível de experiência disponíveis.

## 1. Identificação do problema e proposta de solução

O comportamento sedentário, como passar longos períodos sentado ou deitado, é um tema relevante de saúde pública. A falta de tempo, de equipamentos ou de orientação também pode dificultar o início e a continuidade de uma rotina ativa. O [Guia de Atividade Física para a População Brasileira, do Ministério da Saúde](https://www.gov.br/saude/pt-br/assuntos/saude-brasil/eu-quero-me-exercitar/documentos/pdf/guia_atividade_fisica_populacao_brasileira.pdf) recomenda reduzir períodos prolongados sem movimento e incluir pausas ativas ao longo do dia.

O público do Actus são pessoas que querem começar ou retomar atividades físicas com uma proposta simples e adaptável. A solução é um aplicativo que monta treinos conforme grupo muscular, local, equipamentos disponíveis, duração e nível. O acompanhamento por exercício e o histórico ajudam a pessoa a retomar sua prática e visualizar os treinos concluídos.

## 2. Definição inicial do sistema

### Funcionalidades do MVP

- Cadastro, login e encerramento de sessão por e-mail e senha.
- Perfil com nome e objetivo pessoal.
- Montagem de treinos personalizados por preferências e recursos disponíveis.
- Sessão interativa para marcar exercícios concluídos e acompanhar o progresso.
- Histórico de treinos finalizados.
- Preferência de tema claro ou escuro, salva no dispositivo.
- Tela inicial com incentivo ao movimento e acesso ao início de um treino.

### Usuários e permissões

| Usuário | Acesso |
| --- | --- |
| Visitante | Pode acessar as telas de login e cadastro. As demais rotas exigem autenticação. |
| Pessoa autenticada | Pode editar o próprio nome e objetivo, criar e consultar seus treinos e registrar o progresso das sessões. |

As regras do Firestore vinculam os documentos ao identificador da pessoa autenticada (`uid`). Cada conta só pode ler e alterar seu próprio perfil e seus próprios treinos. A preferência de tema é armazenada localmente no dispositivo. O MVP não possui painel administrativo.

### Telas e fluxo principal

1. A pessoa cria uma conta ou entra no aplicativo.
2. A tela inicial apresenta o propósito do Actus e direciona para a montagem do treino.
3. A pessoa escolhe suas preferências e inicia a sessão proposta.
4. Durante o treino, marca cada exercício concluído; ao terminar, o treino passa a aparecer no histórico.
5. Pelo menu, também pode abrir seu perfil ou ajustar as configurações de aparência.

## 3. Estrutura inicial do aplicativo

O projeto usa Expo, React Native e Expo Router, com telas organizadas por rota e componentes reutilizáveis fora da pasta de rotas.

```text
src/
├── app/                  # Rotas e telas
│   ├── inicio.js         # Página inicial
│   ├── treino.js         # Montagem de treino
│   ├── sessao.js         # Execução e progresso
│   ├── historico.js      # Treinos concluídos
│   ├── perfil.js         # Dados pessoais e objetivo
│   └── configuracoes.js  # Preferências de aparência
├── components/           # Elementos reutilizáveis da interface
├── context/              # Estado de autenticação e tema
└── lib/                  # Firebase, tema e catálogo de exercícios
```

O Firebase Authentication cuida das contas e o Cloud Firestore persiste perfis, treinos e progresso. Os dados são organizados em `users/{uid}` e `users/{uid}/workouts/{workoutId}`. As regras de acesso ficam em `firestore.rules`.

## 4. Navegação, versionamento e primeira versão funcional

A navegação usa o Expo Router. Após autenticação, a pessoa chega à tela **Início**; dali pode iniciar um treino ou acessar o histórico, perfil e configurações pelo menu. O fluxo de treino conecta montagem, sessão e registro de conclusão.

O aplicativo está configurado como versão **1.0.0** e organizado para desenvolvimento incremental em Git. A versão inicial do MVP inclui autenticação, montagem e execução de treinos, histórico e personalização do perfil e da aparência.

Para habilitar a persistência remota, o ambiente precisa ter as variáveis Firebase indicadas em `.env.example`, e as regras de `firestore.rules` devem estar publicadas no projeto Firebase associado. Credenciais administrativas não devem ser incluídas no aplicativo.

### Tecnologias

- Expo SDK 57 e React Native.
- Expo Router para navegação.
- Firebase Authentication e Cloud Firestore.
- AsyncStorage para preferências locais e persistência de sessão nativa.
- React Native Web para a versão web.
