# Actus

O Actus é um aplicativo de bem-estar e atividade física que ajuda cada pessoa a criar uma rotina de movimento compatível com seu tempo, espaço e experiência. A plataforma combina treinos personalizados, acompanhamento de progresso e um histórico individual em uma experiência simples para web e dispositivos móveis.

## Visão do produto

O Actus incentiva a constância sem exigir uma rotina perfeita. A pessoa escolhe o grupo muscular, o local, os equipamentos disponíveis, a duração e o nível; o aplicativo monta uma sequência de exercícios para começar.

## Funcionalidades

- Criação de conta e autenticação por e-mail.
- Perfil com objetivo pessoal e preferências de aparência.
- Tema claro ou escuro, com preferência mantida no dispositivo.
- Geração de treinos conforme disponibilidade e nível.
- Acompanhamento de exercícios concluídos durante cada sessão.
- Histórico dos treinos finalizados, associado à conta da pessoa.
- Conteúdo inicial sobre movimento e redução do tempo sedentário.

## Tecnologias

- **Aplicativo:** Expo SDK 57, React Native e React Native Web.
- **Navegação:** Expo Router.
- **Autenticação e dados:** Firebase Authentication e Cloud Firestore.
- **Persistência local:** AsyncStorage.

## Organização do projeto

```text
src/
├── app/          # Rotas e telas do aplicativo
├── components/   # Componentes de interface
├── context/      # Autenticação e preferências globais
└── lib/          # Catálogo de exercícios, Firebase e tema
assets/           # Ícones e recursos visuais
firestore.rules   # Regras de acesso ao Firestore
```

As rotas principais incluem a página inicial, criação e execução de treinos, histórico, perfil e configurações. Os dados de cada pessoa são organizados no Firestore em `users/{uid}` e `users/{uid}/workouts/{workoutId}`.

## Configuração do serviço

A integração Firebase recebe a configuração por variáveis `EXPO_PUBLIC_FIREBASE_*`, documentadas em `.env.example`. O Firebase Authentication deve permitir acesso por e-mail e senha, e as regras de `firestore.rules` precisam estar publicadas no projeto associado antes de usar operações remotas.

As variáveis públicas identificam o projeto Firebase no cliente. Credenciais administrativas e chaves de conta de serviço não devem ser incluídas no aplicativo.

## Desenvolvimento

Requisitos: Node.js 22.13 ou superior e dependências do projeto instaladas.

```bash
npm install
npm run web       # Aplicação web
npm start         # Servidor Expo
npm run lint      # Análise estática
```

Também estão disponíveis `npm run android` e `npm run ios` para abrir o projeto pelo Expo nos respectivos ambientes.
