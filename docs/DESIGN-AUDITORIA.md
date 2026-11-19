# Auditoria visual do Actus

**Escopo:** inspeção visual estática de todas as rotas em `src/app/`, componentes compartilhados, tema e assets existentes. Nenhuma tela foi alterada nesta etapa.

## Identidade atual

- A marca usa o nome Actus e um símbolo de atividade/ritmo. A navegação e as telas usam `Feather` em vários pontos.
- A paleta atual combina verde floresta (`#194A38`), verde principal (`#2D7757`), verde-lima (`#C8F078`) e superfícies quase brancas. O tema escuro usa fundo verde-grafite (`#101B16`) e superfícies verdes mais claras.
- Os screenshots existentes mostram uma direção limpa, com bastante espaço, cards arredondados e uma página inicial de destaque em verde escuro. Login e construtor já têm uma hierarquia reconhecível.
- `assets/icon.png` ainda é um “A” azul genérico em fundo azul-claro e não corresponde à identidade verde do produto. `assets/splash-icon.png` e os assets adaptativos devem ser conferidos em conjunto antes de uma substituição. A auditoria não recomenda inventar um novo símbolo sem preservar a marca atual.

## Achados globais

- `src/theme/index.js` centraliza algumas cores, espaçamentos, raios e tamanhos, mas não possui nomes semânticos completos nem pesos/estilos tipográficos. Várias telas repetem cores, números e tamanhos em `StyleSheet` locais.
- `ThemeContext` já persiste claro/escuro, mas não oferece o modo “sistema” e pode mostrar o modo claro antes de terminar a leitura do AsyncStorage.
- A família tipográfica depende da fonte padrão. Pesos, tamanhos e letras espaçadas variam por tela; faltam papéis consistentes para display, título, corpo, legenda e rótulo.
- `Button`, `Input`, `Card`, `Chip` e `PageHeading` já existem, porém as telas ainda usam `Pressable`, `TextInput` e estilos locais diretamente. O toque, foco, carregamento e contraste não seguem um único padrão.
- A base é responsiva e usa `maxWidth` em algumas telas, mas os limites variam. Alguns formulários e áreas densas precisam de revisão em 360 dp e em tablets.
- O tema escuro é baseado na mesma estrutura de cores, mas não há evidência visual atual para todas as telas; cores fixas e texto branco podem escapar da paleta semântica.
- Há ícones Feather, mas também glifos de texto como setas, sinais de mais e marcas de seleção. Devem ser substituídos por ícones consistentes onde funcionarem como ícone, sem alterar rótulos ou ações.

## Auditoria por tela

| Rota | Estado visual observado e oportunidade |
|---|---|
| `/` | Tela de espera simples, com spinner e fundo temático. Falta alinhamento visual com a identidade final e um rótulo acessível. |
| `/login` | O screenshot mobile tem marca e cabeçalho escuro fortes, mas a transição para o formulário branco é abrupta. Formulário longo no cadastro, textos pequenos e muito estilo local; os cartões de tipo de conta e consentimento precisam de hierarquia e respiro. |
| `/inicio` | É a tela mais trabalhada: hero verde, chamada para montar treino, informação de movimento e atalhos. O hero ocupa bastante altura em telas pequenas e a composição desktop não deve ser comprimida no mobile. Falta um resumo visual derivado de dados que já existam; não criar métricas sem fonte de dados. |
| `/treino` | Chips e resultado do treino já dão estrutura. A tela tem muitas opções, estilos inline e valores fixos; no mobile, seleção e resultado podem ficar longos e competir pela atenção. Tornar a etapa atual e o resumo mais claros. |
| `/sessao` | Há cartões de progresso e exercícios, mas a tela precisa priorizar o exercício atual, progresso, conclusão das séries e ação de finalizar. Densidade, tamanhos e controles variam do restante do app. |
| `/historico` | Já tem estados de erro/vazio, resumo e cards. A lista pode ganhar leitura mais rápida com data, grupo muscular, duração e estado apresentados em posições consistentes; manter estados de retry. |
| `/rotina` | Junta biblioteca, planejamento semanal e editor. É a tela mais densa e seus controles de séries, repetições, descanso e seleção têm estilos diferentes. Em 360 dp, as colunas devem virar fluxo vertical e o editor precisa de seções e ações bem separadas. |
| `/treinos` | Apenas redireciona para `/rotina`. Preservar o alias e não redesenhar como tela independente. |
| `/perfil` | O formulário está contido em card, mas não começa com avatar/identidade visual e os campos/status, objetivo e zona de exclusão têm hierarquia semelhante. A zona de exclusão deve continuar claramente distinta. |
| `/configuracoes` | Configurações aparecem em cards simples. Tema e política estão acessíveis, porém a tela pode agrupar opções por seção, usar ícones e mostrar a aparência selecionada. |
| `/privacidade` | Conteúdo extenso em um único cartão, com títulos e separadores uniformes. Melhorar leitura em blocos sem modificar o texto legal nem o fluxo de voltar. |
| `/contato` | Wrapper do centro de conversas para aluno. A lista de profissionais pode parecer catálogo cru; cartões precisam apresentar avatar, disponibilidade e próxima ação com hierarquia. |
| `/atendimentos` | Wrapper do chat para profissional. Estados vazios, conversas, mensagens e envio compartilham a mesma superfície e precisam de separação visual mais nítida. |
| `/admin` | Formulário e listas de profissionais, exercícios e contas ficam em sequência de cards com estilos locais. Densidade alta; status e ações administrativas devem ser fáceis de distinguir e as listas precisam de linhas/card padronizados. |

## Componentes compartilhados

- `AppShell`: navegação desktop e menu compacto já existem; identidade, ícones, estado ativo e espaçamento precisam ser unificados. A barra móvel deve permanecer confortável e não competir com a tela.
- `ui.js`: `PageHeading`, `Button`, `Input`, `Chip`, `Card`, títulos, estados e diálogo são uma boa base, mas os estilos não cobrem todos os estados nem o conjunto de variações solicitado.
- `ProfileEditor`: estrutura funcional, mas campos e ações têm estilos próprios e a exclusão precisa manter contraste de perigo.
- `ConversationCenter`: concentra muitas áreas; a prioridade visual é lista/conversa/compositor, com bolhas, horários e controles consistentes. Alterações aqui devem preservar os listeners e ações atuais.
- `FirebaseSetupScreen`: útil para configuração, mas usa estilos e caracteres de texto para elementos decorativos; aplicar os tokens sem alterar as instruções.

## Direção visual recomendada

Preservar o verde floresta, o verde principal e o acento lima, reduzindo o verde intenso a ações e destaques. Usar superfícies neutras quentes no claro e grafite esverdeado no escuro, tokens semânticos com contraste AA, uma escala tipográfica única e espaçamentos/radios compartilhados. A evolução deve manter o nome Actus e o símbolo de atividade já presente na interface; atualizar ícone e splash exige assets válidos e revisão visual específica.
