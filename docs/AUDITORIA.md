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
| Listeners Firestore/Auth sem cleanup | As funções de `onSnapshot` e o listener de Auth retornam unsubscribe. | Corrigido |
| Corrida em leitura de autenticação | `AuthContext` compara o UID ativo; algumas cargas de tela ainda não cancelam/reiniciam todos os estados locais. | Parcial |
| Estados que sobrevivem a logout/troca de conta | Logout limpa a sessão e fecha o menu; não há reset compartilhado de todos os estados locais de telas. | Parcial |
| Proteção contra toque duplo | Login, perfil, sessão, chat, rotina e aprovação admin bloqueiam envios enquanto salvam; alguns controles administrativos não têm estado individual de carregamento. | Parcial |
| Estados loading/vazio/erro | Componentes compartilhados e retries foram adicionados, mas algumas consultas da administração ainda usam mensagens em linha. | Parcial |
| Tema claro/escuro | Paletas e tokens semânticos centralizados; algumas telas mantêm estilos e cores locais. | Parcial |
| Texto técnico ou inglês | Mensagens de sessão, chat, cadastro e administração foram normalizadas; há mensagens técnicas intencionais em diagnóstico/configuração. | Parcial |
| Acessibilidade | Labels, estados, alvos de toque e ícones foram ampliados; a conferência WCAG com leitor de tela ainda não foi feita. | Parcial |
| Teclado e Safe Area | Login/setup/shell respeitam Safe Area; teclado e rolagem não foram revisados manualmente em todas as telas/dispositivos. | Parcial |
| Listas potencialmente longas | Histórico e diretórios usam `FlatList`; mensagens têm limite de 60 e páginas de contas/catálogo têm limites. Treinos personalizados não têm paginação. | Parcial |
| `console.log` e código morto | A varredura não encontrou `console.log` em `src/`. | Corrigido/verificado |
| Segredos versionados | `.env` é ignorado e não está no índice; `.env.example` contém apenas marcadores. | Corrigido/verificado |

## Status final de cada achado

Os problemas da primeira tabela foram identificados antes de editar o código. A tabela abaixo registra o resultado do trabalho até esta versão.

| Item auditado | Status | Resultado e motivo |
|---|---|---|
| `firestore.rules` — administração por claim, aprovação de profissionais e diretório | Corrigido | Administração usa custom claim; registro profissional fica pendente até aprovação e só perfis verificados entram no diretório e no chat. |
| `firestore.rules` — `accountType` e validação de dados | Corrigido | Tipo de conta é imutável; documentos novos, treinos, séries, anexos e mensagens têm tipos e limites validados. Testes Emulator cobrem tentativas inválidas. |
| `firestore.rules` — frequência de mensagens e App Check | Parcial | Limite atômico de quatro segundos e validação de conteúdo foram implementados. App Check nativo foi adiado porque o cliente usa Firebase JS SDK e requer provedor de atestação próprio; essa condição e o procedimento de deploy estão documentados. |
| `firestore.rules` / Cloud Function — exclusão completa da conta | Parcial | Reautenticação e `deleteMyAccount` com remoção de subcoleções, conversas e conta foram implementadas. A função e as regras ainda precisam ser publicadas no projeto do responsável e validadas em produção. |
| `src/context/AuthContext.js` — papel de administrador/profissional e falha de perfil | Parcial | O papel admin vem do token; profissional depende de aprovação. Em falha de leitura, a interface assume usuário comum por segurança, mas não há uma tela dedicada para cada falha de sincronização do perfil. |
| `src/context/AuthContext.js` — consentimento, registro e dados de cadastro | Corrigido | Cadastro valida nome, e-mail, senha e registro profissional; grava versão e data do consentimento. |
| `src/context/AuthContext.js` — listener e troca de sessão | Parcial | Unsubscribe e comparação de UID foram mantidos. A limpeza dos estados locais de todas as telas ainda não é compartilhada. |
| `src/context/ThemeContext.js` — flash inicial e persistência | Parcial | Tema persiste e expõe estado `ready`; a árvore de navegação ainda não espera esse estado antes do primeiro desenho. Erro local de armazenamento continua silencioso. |
| `src/lib/theme.js` — cores e escalas globais | Parcial | Paletas claro/escuro, espaçamento, raio, tipografia e alvos de toque foram centralizados em `src/theme/`; telas antigas ainda mantêm parte das medidas locais. |
| `src/lib/firebaseConfig.js` — configuração ausente | Corrigido | Auth só monta com configuração válida; caso contrário, a tela explica como configurar `.env`. |
| `src/lib/firebase.native.js` — falha nativa de inicialização | Adiado | Não houve falha reproduzível além de configuração ausente. Uma tela para erros de inicialização do SDK precisa de reprodução em build nativo. |
| `src/lib/exercises.js` — validação e consistência de gravações | Parcial | Erros comuns são apresentados em português e os dados são validados nas regras. A remoção de plano e atualização da programação ainda são duas operações separadas. |
| `src/lib/exercises.js` — histórico e listas crescentes | Parcial | Histórico consulta páginas de 30 e calcula total/média no servidor. Catálogo, biblioteca personalizada e mensagens antigas ainda têm limites/consultas que não cobrem toda paginação. |
| `src/app/login.js` — cadastro profissional, consentimento e validação | Corrigido | Campos mostram erros inline, senha mínima é coerente com Auth, consentimento é exigido e o registro profissional fica pendente de aprovação. |
| `src/app/login.js` — acessibilidade e teclado | Parcial | `SafeAreaView`, `KeyboardAvoidingView`, navegação entre campos, estados de acessibilidade e layout responsivo foram revisados; leitor de tela não foi testado em aparelho. |
| `src/app/index.js` — carregamento acessível | Parcial | Há indicador de inicialização; ainda não usa o componente `LoadingState` nem anuncia mensagem específica. |
| `src/app/_layout.js` — tema e navegação segura | Parcial | Safe Area, StatusBar e controle de acesso permanecem. O tema inicial ainda pode aparecer antes da leitura de preferência e a StatusBar compara cor diretamente. |
| `src/app/inicio.js` — aviso de saúde e consistência visual | Parcial | Aviso de saúde e ícones do Expo foram adicionados. Os estilos de ilustração ainda usam medidas e tons locais próprios da marca. |
| `src/app/treino.js` — gerador e resultado | Parcial | Erros, loading, ícones, rótulos acessíveis e seleção responsiva existem. A lista de resultado não é virtualizada, pois contém apenas os exercícios de uma sessão. |
| `src/app/rotina.js` — programação, editor e estados | Parcial | Cada dia aceita um treino ou descanso; retry, exclusão confirmada, alvos maiores e estados vazios/loading/erro foram adicionados. Catálogo e biblioteca personalizada ainda usam renderização local sem paginação. |
| `src/app/sessao.js` — progresso e saída | Corrigido | Cada série salva ao alternar, o percentual evita divisão por zero, erros Firebase são traduzidos e qualquer navegação que remova a tela pede confirmação enquanto o treino está em andamento. |
| `src/app/historico.js` — resumo, paginação e exclusão | Corrigido | `FlatList`, atualização por gesto, páginas de 30, total/média e confirmação de exclusão foram implementados. |
| `src/app/perfil.js` e `src/components/ProfileEditor.js` — dados e exclusão | Corrigido | Formulário segue UID, valida nome no contexto, exclusão exige senha recente e chama a Cloud Function. O deploy externo continua pendente. |
| `src/app/configuracoes.js` — aparência e privacidade | Corrigido | Tema continua persistido e a política de privacidade pode ser aberta nas configurações. |
| `src/app/admin.js` — aprovação, catálogo e listas | Parcial | Claim, aprovação/revogação, paginação de contas e confirmação de exclusão de exercício foram implementados. Catálogo e consultas administrativas ainda não usam estados compartilhados em todos os casos. |
| `src/app/atendimentos.js` e `src/app/contato.js` — controle de acesso | Corrigido | São wrappers finos; bloqueio por papel/perfil e regras do Firestore protegem as operações. |
| `src/app/treinos.js` — rota compatível e rótulos | Corrigido | A rota antiga segue redirecionando para a rotina semanal e a navegação usa “Meus treinos”. |
| `src/components/ConversationCenter.js` — listeners, rolagem, horário e erros | Parcial | Assinaturas limpam listeners; mensagens têm hora `pt-BR`, rolagem automática e retry. A tela carrega até 60 mensagens e ainda não navega para mensagens anteriores. |
| `src/components/ConversationCenter.js` — listas e treinos anexados | Parcial | Diretório/inbox/mensagens usam `FlatList`; profissional escolhe exercícios e anexa treino, que o aluno salva antes de iniciar. Falta paginação de conversas e mensagens antigas. |
| `src/components/ConversationCenter.js` — tamanho do componente | Parcial | Estados de lista, chat, anexo e erro foram mantidos em um único componente; a divisão em subcomponentes não foi necessária para fechar o fluxo funcional. |
| `src/components/AppShell.js` — navegação, ícones e logout | Corrigido | Ícones Feather, confirmação de logout, fechamento do menu ao navegar e navegação móvel concentrada no menu foram adicionados. |
| `src/components/ui.js` — componentes compartilhados | Parcial | Button, Input, Card, Header, estados loading/vazio/erro e ConfirmDialog existem. Indicadores de foco e estados visuais não foram uniformizados em todas as telas antigas. |
| `src/components/ProfileEditor.js` — erros e acessibilidade | Parcial | Campos e botões têm alvos maiores, salvamento e estados de exclusão. Parte do formulário ainda usa estilos locais em vez do `Input` compartilhado. |
| `src/components/FirebaseSetupScreen.js` — configuração multiplataforma | Corrigido | Instruções agora cobrem PowerShell e macOS/Linux, mantêm Safe Area e usam Feather. |
| `src/app` e `src/components` — tokens, ícones e contraste | Parcial | Tokens e ícones vetoriais foram adotados nas telas principais; ainda falta revisar cada cor/tamanho e executar avaliação WCAG/leitor de tela nos dois temas. |

## Verificações e riscos restantes

- `npx expo lint` e `npm.cmd run test:rules` passaram; a suíte do Emulator teve 9 testes aprovados. `npm.cmd --prefix functions run lint` também é exigido antes de fechar a documentação.
- `tsc --noEmit` não se aplica: o aplicativo é JavaScript e não possui `tsconfig.json`.
- A validação em Android real e os deploys de Firestore/Cloud Functions dependem do projeto Firebase e credenciais do responsável.
- App Check para o cliente mobile segue sem integração; não ative enforcement para esses builds antes de integrar o provedor nativo.
- `npm audit --omit=dev` encontrou 35 vulnerabilidades na árvore de produção (33 altas e 2 moderadas). Atualizações forçadas podem quebrar as versões acopladas ao Expo SDK 57; revisar as correções em uma etapa de dependências antes de publicar.

## Plano e acompanhamento

1. **Etapa 1 — auditoria:** concluída; este arquivo registra o estado inicial antes de mudanças no código.
2. **Etapa 2 — segurança e dados:** concluída no código e nos testes; App Check mobile e publicação Firebase estão documentados como dependências externas.
3. **Etapa 3 — interface:** concluída; tokens/componentes, navegação responsiva, programação semanal, histórico virtualizado, chat com treino anexado e confirmação de saída.
4. **Etapa 4 — documentação e qualidade:** em conclusão; README, instruções, capturas e verificações estão atualizados.

## Decisões e dependências externas

- A solução permanece no Firebase (Auth, Firestore e Cloud Functions onde a exclusão segura exigir credenciais administrativas). Nenhuma API própria/Express/MySQL será introduzida.
- A criação do custom claim e a implantação de regras/functions exigem credenciais administrativas e ação de deploy no projeto Firebase.
- Capturas responsivas geradas em Expo Web estão em `docs/screenshots/`; os fluxos Firebase e o layout Android ainda requerem teste no build/dispositivo do responsável.
