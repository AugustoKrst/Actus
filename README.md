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

A arquitetura prevista para o sistema completo é:

- Aplicativo cliente em Expo e React Native.
- API em Node.js com Express para autenticação, autorização e regras de negócio.
- MySQL para persistir usuários, papéis, exercícios, treinos e progresso.
- Tokens JWT para autenticar chamadas à API; a API valida os papéis de usuário e administrador.

O código navegável desta entrega é um protótipo funcional que ainda usa Firebase Authentication e Cloud Firestore para login e persistência. Essa integração é provisória e precisa ser substituída pela API Node.js/Express e pelo MySQL nas próximas etapas. O repositório ainda não contém a API, o banco MySQL, JWT nem as permissões administrativas; esses itens não são apresentados como funcionalidades já concluídas.

## Executar o aplicativo

Requisitos: Node.js e npm. Instale as dependências e inicie o Expo:

```bash
npm install
npx expo start
```

Para habilitar login e persistência no protótipo, configure as variáveis Firebase listadas em `.env.example` em um arquivo `.env` local. Sem essa configuração, o aplicativo apresenta a tela de configuração do Firebase. As regras do protótipo estão em `firestore.rules`.

## Tecnologias do protótipo

- Expo SDK 57, React Native e React Native Web.
- Expo Router para navegação.
- Firebase Authentication e Cloud Firestore como integração temporária.
- AsyncStorage para salvar a preferência de tema e persistência nativa da sessão.

## Versão

O aplicativo está configurado como versão **1.0.0**. A Entrega 1 contém organização inicial, múltiplas telas e navegação funcional. A migração para a arquitetura Node.js/Express e MySQL e a implementação dos papéis distintos permanecem como próximos passos.
