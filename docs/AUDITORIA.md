# Auditoria técnica do Actus

**Escopo:** leitura das rotas em `src/app/`, componentes, contextos, bibliotecas Firebase e regras Firestore. Esta etapa registra o estado inicial antes das correções. O aplicativo usa Expo Router, JavaScript e Firebase como backend.

**Legenda de gravidade:** alta = risco de segurança, privacidade, perda de dados ou bloqueio de fluxo; média = falha funcional, acessibilidade ou manutenção com impacto relevante; baixa = melhoria visual, textual ou de consistência.

## Achados por arquivo

| Arquivo | Problema observado | Gravidade | Correção proposta |
|---|---|---:|---|
| `firestore.rules` | `isAdmin()` confia em e-mail fixo; cadastro permite atribuir `health_professional`; diretório e conversas não exigem verificação. | Alta | Usar custom claim `admin`; adicionar aprovação administrativa de profissionais com registro e `verified`; verificar o status na leitura e criação de conversa. |
| `firestore.rules` | Atualização de perfil permite preservar a exceção de `accountType` ausente, sem exigir `validAccountType`; vários campos de exercícios, séries, itens e listas têm validação incompleta. | Alta | Tornar o papel imutável, migrar documentos legados e validar tipos, limites, enums, timestamps e estrutura de exercícios. |
| `firestore.rules` | Mensagens podem ser criadas sem limite de frequência; regras não limitam conteúdo abusivo. A validação do treino anexado verifica o contêiner, mas não a estrutura dos exercícios. | Alta | Aplicar limitação verificável pelas regras ou por fluxo Firebase confiável; validar cada campo permitido do treino; documentar App Check. |
| `firestore.rules` | Não há operação autorizada para remoção completa de dados do usuário, subcoleções e conversas. | Alta | Remoção autenticada e reautenticada, com limpeza administrativa no backend Firebase e tratamento de conversas sem expor dados pessoais. |
| `src/context/AuthContext.js` | `userRole()` concede admin por comparação de e-mail no cliente; papel de profissional vem de campo controlado no cadastro. Erro de leitura do perfil cria sessão de fallback como usuário comum. | Alta | Derivar admin de `getIdTokenResult()`/custom claim e estado profissional de verificação; separar falha de carregamento de perfil de perfil inexistente. |
| `src/context/AuthContext.js` | Registro não coleta conselho/registro profissional nem consentimento; atualização do perfil não valida nome/objetivo no contexto. | Alta | Validar os dados antes de persistir, coletar registro para profissionais e consentimento explícito versionado. |
| `src/context/AuthContext.js` | O listener `onAuthStateChanged` tem unsubscribe e protege a resolução concorrente por UID; estados locais das telas não têm uma estratégia compartilhada de limpeza ao trocar de conta. | Média | Manter o unsubscribe existente e limpar dados/rotas privadas ao sair ou trocar de UID. |
| `src/context/ThemeContext.js` | Preferência é carregada assincronamente; pode haver flash do tema claro. `toggleMode()` atualiza estado antes de persistir e não informa falha. | Baixa | Aguardar `ready` na árvore visual e padronizar feedback/persistência da preferência. |
| `src/lib/theme.js` | Só centraliza cores; espaçamentos, tipografia, raios, estados e tokens de acessibilidade ainda estão espalhados pelas telas. | Média | Criar tokens semânticos em `src/theme/` para claro/escuro e migrar estilos progressivamente. |
| `src/lib/firebaseConfig.js` | A inicialização trata configuração ausente, mas `db` e `auth` são `null` até a configuração; consumidores dependem de telas/guardas para nunca chamar Firebase nessa condição. | Média | Tipar conceitualmente as pré-condições e centralizar uma resposta amigável para configuração ausente. |
| `src/lib/firebase.native.js` | Tratamento de `auth/already-initialized` usa fallback adequado, mas outros erros de inicialização podem propagar sem tela de recuperação. | Baixa | Cobrir falha de inicialização com diagnóstico amigável sem ocultar erro de configuração. |
| `src/lib/exercises.js` | Operações CRUD propagam erros Firebase heterogêneos; validação de payload é parcial; remoção em duas etapas pode deixar rotina incoerente se a segunda gravação falhar. | Média | Normalizar erros e dados no limite da biblioteca; tornar remoção/ajuste consistente com batch/transaction onde possível. |
| `src/lib/exercises.js` | Histórico busca toda a subcoleção e filtra em memória; exercício e plano usam arrays sem paginação. Há risco de custo/memória crescente. | Média | Ordenar e paginar consultas; limitar o catálogo em componentes com `FlatList`/`FlashList` quando o volume justificar. |
| `src/app/login.js` | Cadastro aceita qualquer pessoa como profissional, não solicita registro nem consentimento; validação de e-mail/nome é mínima. Texto promete senha mínima de 8 caracteres, enquanto Auth do Firebase aceita configuração diferente. | Alta | Validar campos em português, coletar registro/consentimento e alinhar política de senha; exibir estado de carregamento e teclado acessível. |
| `src/app/login.js` | Fluxo já tem `KeyboardAvoidingView`, `SafeAreaView`, proteção contra toque durante envio e tradução parcial dos erros de autenticação; controles de alternância/seleção têm alvos e rótulos inconsistentes. | Média | Preservar o fluxo e completar semântica, tamanho mínimo de toque e mensagens para todos os códigos relevantes. |
| `src/app/index.js` | Tem indicador de carregamento, mas sem rótulo acessível e sem tratamento de falha de inicialização além do fluxo raiz. | Baixa | Reutilizar `LoadingState` com anúncio acessível. |
| `src/app/_layout.js` | Protege rotas privadas e configura SafeArea/StatusBar; o tema só altera status bar via comparação de hex e a espera da preferência não bloqueia o primeiro desenho. | Média | Usar token semântico de status bar e aguardar a preferência carregar antes de montar telas. |
| `src/app/inicio.js` | Layout e estados visuais são próprios da tela, com cores fixas; não há aviso de que o conteúdo não substitui avaliação profissional. | Média | Migrar para tokens e inserir aviso discreto, mantendo a identidade atual. |
| `src/app/treino.js` | Geração trata erros e loading, mas usa controles customizados e estilos locais; lista de exercícios é renderizada com `.map()`. | Baixa | Migrar componentes/tokens; adicionar semântica nos controles e estado acessível para resultado/erro. |
| `src/app/rotina.js` | Fluxo tem estados de loading/erro e rotina por dia; captura alguns erros de modo genérico, controles do catálogo usam `.map()` dentro de área limitada e não há ação de tentar novamente no erro inicial. | Média | Acrescentar retry, melhorar semântica de seleção, garantir rolagem eficiente e separar estados do editor e carregamento. |
| `src/app/sessao.js` | Carrega com proteção contra atualização após desmontagem e salva séries com bloqueio de toque duplo. Não confirma saída durante treino; erro pode expor `error.message`; atualização otimista só ocorre após salvar. | Média | Confirmar abandono, traduzir falhas e apresentar progresso persistido com recuperação segura. |
| `src/app/historico.js` | Tem estado vazio/erro/retry e confirmação de exclusão. Carrega histórico inteiro, não resume total/duração média e mensagens/datas de fallback são genéricas. | Média | Consultar com paginação, mostrar resumo e datas/estados úteis; padronizar `EmptyState`/`ErrorState`. |
| `src/app/perfil.js` e `src/components/ProfileEditor.js` | Não há exclusão de conta, validação inline ou reautenticação; estado do formulário nasce do contexto e não é sincronizado se a sessão mudar. | Alta | Implementar exclusão autenticada completa e sincronizar formulário por UID; validar nome e objetivo. |
| `src/app/configuracoes.js` | Tela cobre tema, mas não há política de privacidade, consentimentos ou preferências de dados. | Média | Adicionar acesso à política e controles de consentimento compatíveis com LGPD. |
| `src/app/admin.js` | A autorização visível depende do papel do cliente; não existe fila de aprovação de profissionais. A lista de exercícios/contas usa `.map()` e ações do catálogo não têm confirmação, loading nem todos os estados de erro/retry. Erros de Firestore podem ser mostrados por `error.message`. | Alta | Proteger pelo claim também nas regras; adicionar aprovação/revogação com registro profissional e estados/confirm dialogs; paginar listas. |
| `src/app/atendimentos.js` e `src/app/contato.js` | São wrappers mínimos para `ConversationCenter`; o controle de acesso fica no componente e nas regras. | Média | Manter bloqueio nas regras, não apenas na interface; renderizar estados de acesso com componentes consistentes. |
| `src/app/treinos.js` | Redireciona para `/rotina`; rota compatível, mas a nomenclatura “Treinos” e “Meus treinos” varia no app. | Baixa | Consolidar rótulos e links sem quebrar deep links existentes. |
| `src/components/ConversationCenter.js` | `onSnapshot` retorna unsubscribe nas três assinaturas; consulta mensagens ordenada por `createdAt` ascendente. Não há rolagem automática, horário visível, paginação ou retry dedicado; limite de 60 pode omitir histórico. | Média | Preservar cleanup, paginar mensagens, rolar para o final e mostrar horário `pt-BR`/retry. |
| `src/components/ConversationCenter.js` | Há bloqueio por `busy` para envio, mas lista de profissionais/conversas e bolhas são renderizadas com `.map()`. Anexo `workout` pode ser encaminhado sem checagem de proprietário/versionamento. | Alta | Usar lista virtualizada conforme volume, persistir treino recebido em “Meus treinos” com autoria/origem e validar anexos nas regras. |
| `src/components/ConversationCenter.js` | Alguns erros são amigáveis, porém o fluxo está concentrado em um componente extenso e mistura estados de busca, chat, envio e seleção. | Média | Extrair componentes reutilizáveis e normalizar estados/erros. |
| `src/components/AppShell.js` | Usa SafeAreaView/ScrollView e tem navegação responsiva; estilo e glifos são próprios, ações de logout não confirmam e o menu não sincroniza necessariamente com mudança de conta/rota. | Média | Adotar ícones consistentes, tokens, confirmação de saída e fechar/resetar menu em navegação/auth. |
| `src/components/ui.js` | Só oferece `PageHeading`, `Chip`, `Card`, `SectionTitle`; controles não têm estado de foco, disabled ou semântica completa. | Média | Criar Button, Input, estados de carregamento/vazio/erro, confirmação e Header reutilizáveis. |
| `src/components/ProfileEditor.js` | Botão bloqueia reenvio e mostra loading; falhas podem apresentar mensagens técnicas do contexto; input não está associado a label acessível e pode ter alvo menor que 48dp. | Média | Adotar `Input` com ajuda/erro e mensagens traduzidas. |
| `src/components/FirebaseSetupScreen.js` | Tem SafeArea e conteúdo rolável, mas instrução do comando é específica para PowerShell/Windows. | Baixa | Documentar comandos equivalentes para Windows, macOS e Linux. |
| `src/app` e `src/components` (geral) | Estilos/tipografia/bordas são repetidos e algumas cores claras são constantes em telas, afetando tema escuro e contraste WCAG AA. Glifos/emoji substituem ícones consistentes; acessibilidade está incompleta. | Média | Centralizar tokens, padronizar componentes, substituir glifos por ícones já disponíveis no SDK e revisar contraste/alvos nos dois temas. |

## Varredura transversal

| Verificação | Resultado inicial | Status |
|---|---|---|
| Listeners Firestore/Auth sem cleanup | As funções de `onSnapshot` retornam o unsubscribe; o listener de Auth também retorna o unsubscribe. | Corrigido na base |
| Corrida em leitura de autenticação | `AuthContext` compara o UID ativo; telas assíncronas variam, algumas têm guarda de desmontagem e outras não. | Parcial |
| Estados que sobrevivem a logout/troca de conta | A sessão é zerada no logout; não há reset compartilhado de estados locais/consultas de tela. | Parcial |
| Proteção contra toque duplo | Login, perfil, sessão e chat aplicam `loading`/`busy` em parte das ações; admin e algumas ações de rotina não. | Parcial |
| Estados loading/vazio/erro | Há estados em histórico, rotina, sessão e atendimento; admin não cobre todas as consultas e algumas telas não têm retry. | Parcial |
| Tema claro/escuro | Contexto e paletas existem; estilos próprios/hardcoded impedem consistência total. | Parcial |
| Texto técnico ou inglês | Auth traduz os principais códigos, porém admin/contexto e outras telas usam `error.message`; instruções técnicas aparecem na tela de configuração. | Parcial |
| Acessibilidade | Alguns controles têm `accessibilityRole`/`Label`; cobertura e alvos de 48dp não são uniformes. | Parcial |
| Teclado e Safe Area | Login usa `KeyboardAvoidingView`; setup e shell usam safe area; formulários em outras telas não evitam o teclado. | Parcial |
| Listas potencialmente longas | Conversas, histórico, contas e exercícios usam `.map()`; contas são paginadas, as demais consultas incluem coleções potencialmente sem limite. | Pendente |
| `console.log` e código morto | A varredura não encontrou `console.log` em `src/`; verificar rotas/imports e caminhos após as etapas. | Sem ocorrência na varredura |
| Segredos versionados | `.env` local está coberto por `.gitignore` e não aparece no índice Git; `.env.example` não deve conter valores reais. | Verificado |

## Plano e acompanhamento

1. **Etapa 1 — auditoria:** concluída; este arquivo registra o estado inicial antes de mudanças no código.
2. **Etapa 2 — segurança e dados:** pendente; foco em custom claims, aprovação profissional, validação de regras, exclusão de conta, consentimento, App Check e testes no Emulator.
3. **Etapa 3 — interface:** pendente; tema e componentes reutilizáveis, estados completos, acessibilidade, listas e fluxos de chat/sessão/histórico.
4. **Etapa 4 — documentação e qualidade:** pendente; README, configuração e execução de verificações, testes e evidências visuais.

## Decisões e dependências externas

- A solução permanece no Firebase (Auth, Firestore e Cloud Functions onde a exclusão segura exigir credenciais administrativas). Nenhuma API própria/Express/MySQL será introduzida.
- A criação do custom claim e a implantação de regras/functions exigem credenciais administrativas e ação de deploy no projeto Firebase.
- Capturas de tela precisam ser produzidas após as telas implementadas e executadas em ambiente Expo configurado; não são evidência válida antes da implementação.
