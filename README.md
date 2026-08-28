# StudyCam AI — landing page + aplicação web (Sprint 3)

Projeto único em **React** que reúne as duas entregas da equipe para o
**Eng. Software Challenge 2026 (FIAP × JOVI)**:

- a **landing page** do StudyCam AI (Front-End Design), que apresenta o problema,
  a solução, a galeria, a equipe e o formulário de contato;
- a **aplicação web** (Web Development), que reproduz no navegador o aplicativo
  **StudyCam AI** — o modo Estudo criado pela equipe para a câmera dos celulares
  **JOVI**.

A landing page é a página inicial e leva ao protótipo do aplicativo pelos botões
*"Abrir o protótipo"* (cabeçalho, hero, galeria e rodapé). Veja
[Rotas do projeto](#rotas-do-projeto).

A interface segue as telas do protótipo do aplicativo: câmera no modo StudyCam AI,
álbuns por matéria, grade de anotações de cada matéria e menu de opções do álbum
(renomear, alterar cor, excluir). Além dessas, a aplicação implementa as
funcionalidades sugeridas no enunciado da Sprint: central de conteúdo com busca,
organização livre dos álbuns, histórico e estatísticas, privacidade e ações sobre
o conteúdo (exportar e lixeira com recuperação).

> **Integrações externas:** o OCR da captura, a análise com IA e a leitura em voz
> alta usam as APIs do Google (Gemini e Text-to-Speech). Veja a seção
> [Integrações de API](#integrações-de-api).

---

## Sumário

1. [Tecnologias utilizadas](#tecnologias-utilizadas)
2. [Como instalar as dependências](#como-instalar-as-dependências)
3. [Como executar o projeto](#como-executar-o-projeto)
4. [Rotas do projeto](#rotas-do-projeto)
5. [Usuários e senhas](#usuários-e-senhas)
6. [Telas e funcionalidades](#telas-e-funcionalidades)
7. [Estrutura de pastas](#estrutura-de-pastas)
8. [Requisitos da Sprint atendidos](#requisitos-da-sprint-atendidos)
9. [Integrações de API](#integrações-de-api)
10. [Onde e como a IA foi utilizada no projeto](#onde-e-como-a-ia-foi-utilizada-no-projeto)
11. [Link do repositório Git e do Deploy na Vercel](#link-do-repositório-git-e-do-deploy-na-vercel)

---

## Tecnologias utilizadas

| Tecnologia | Uso no projeto |
| --- | --- |
| **React 19** | Componentes funcionais, props (pai → filho), hooks nativos e customizados |
| **Vite 8** | Servidor de desenvolvimento e build de produção |
| **JavaScript (ES2022)** | Regras de negócio, utilitários e serviços |
| **CSS puro** | Variáveis de tema, Flexbox, CSS Grid e media queries (Desktop, Tablet e Mobile) |
| **localStorage** | Persistência de álbuns, anotações, histórico, ajustes, tema da landing e mensagens do contato |
| **SVG inline** | Todos os ícones e as miniaturas geradas das anotações |
| **ESLint** | Padronização do código |

Não há dependências de terceiros além do React — nenhuma biblioteca de ícones,
de UI ou de rotas foi usada. A troca entre a landing page e o aplicativo é feita
pelo hook próprio `useRota`, que lê o `hash` da URL.

## Como instalar as dependências

Pré-requisito: **Node.js 18 ou superior** (o projeto foi desenvolvido no Node 24).

```bash
npm install
```

## Como executar o projeto

```bash
npm run dev
```

O terminal exibe o endereço local (por padrão `http://localhost:5173`). Abra esse
endereço no navegador.

Outros scripts:

```bash
npm run build     # gera a versão de produção na pasta /dist
npm run preview   # serve a build de produção localmente
npm run lint      # roda o ESLint (o projeto está sem erros e sem avisos)
```

**Back-end:** o projeto não possui servidor próprio. Toda a persistência é feita
no `localStorage` do navegador, então basta executar o comando acima.

## Rotas do projeto

As duas partes vivem na mesma aplicação e são escolhidas pelo `hash` da URL:

| Rota | Página |
| --- | --- |
| `/` (ou `/#/`) | **Landing page** — apresentação do StudyCam AI |
| `/#/app` | **Protótipo do aplicativo** — o aparelho navegável |

O hash foi usado no lugar do History API para que a aplicação funcione em
qualquer hospedagem estática, sem regra de reescrita no servidor, e para que os
links internos da landing (`#solucao`, `#equipe`…) continuem rolando a página — só
o prefixo `#/` identifica uma rota.

Para voltar da aplicação para a landing: o link **"← Voltar para o site"**, no
canto superior esquerdo (a partir de 700px de largura), ou o botão *voltar* do
navegador — que funciona porque a rota está na URL.

O atributo `data-pagina` (`site` ou `app`), escrito no `<html>`, é o que separa os
dois conjuntos de CSS: as regras de base de cada parte são presas a ele, então a
landing (que rola a página e tem tema claro/escuro) e o aplicativo (que ocupa a
tela inteira com fundo escuro fixo) não interferem um no outro.

## Usuários e senhas

Não há autenticação nesta Sprint. A aplicação abre direto na câmera e todas as
telas são acessíveis. (Rotas públicas e privadas estão previstas para a Sprint 4.)

## Telas e funcionalidades

| Tela | O que faz |
| --- | --- |
| **Câmera (StudyCam AI)** | Flash, proporção (4:3, 1:1, 16:9), temporizador (desligado, 3s, 10s), botão de IA, ajustes, zoom 0,6x/1x/2x, detecção de documento e obturador. A captura gera uma anotação, com a matéria sugerida pela IA e a confiança do reconhecimento. **Tocar** no ícone da galeria abre a galeria; **segurar** revela o atalho dos álbuns (os modos nativos — Retrato, Foto, Vídeo e Mais — aparecem no trilho, mas não fazem nada) |
| **Galeria** | Todas as fotos guardadas, separadas por dia ("Hoje", "Ontem", data), com importação de imagens do dispositivo e menu por foto (renomear, mover, exportar, excluir) |
| **Álbuns** | Total de anotações, data da última atualização e grade de matérias. Menu de cada álbum: renomear, alterar cor e excluir. Menu do topo: nova matéria, reorganizar, histórico, lixeira e ajustes |
| **Álbum (matéria)** | Grade de anotações, importação de imagem do computador, ordenação e menu por anotação (renomear, mover, ouvir, privacidade, exportar, excluir) |
| **Anotação** | Foto da captura (com giro da imagem) e a análise da IA: assunto identificado, palavras-chave, resumo (com leitura em voz alta que pode ser interrompida), pontos-chave, quiz de 3 perguntas gerado a pedido e corrigido na hora e atalhos de busca na Web e no YouTube. No topo, compartilhar e baixar (a foto da captura ou o JSON da anotação) |
| **Central de conteúdo** | Visão única com números de uso, atalhos e as capturas mais recentes |
| **Busca** | Procura por título, matéria ou tipo de captura |
| **Histórico e estatísticas** | Registro do que foi adicionado, editado, removido ou restaurado + uso por matéria e por período |
| **Lixeira** | Anotações excluídas, com prazo restante, restauração e exclusão definitiva |
| **Ajustes** | Preferências da câmera, da IA e de privacidade, status das integrações e restauração do conteúdo de exemplo |

A barra inferior reproduz a navegação do Android: **recentes**, **início** (volta
para a câmera) e **voltar** (desempilha a tela atual).

O visor funciona de duas formas: por padrão exibe a cena simulada (igual às telas
do protótipo) e, se a opção *"Usar a câmera do dispositivo"* for ligada em
**Ajustes**, passa a exibir a imagem real da webcam — nesse caso as capturas são
fotos de verdade. Se o navegador negar a permissão, a aplicação volta sozinha para
o visor simulado.

## Estrutura de pastas

```
src/
├── App.jsx                  raiz: escolhe entre a landing page e o aplicativo
├── main.jsx                 ponto de entrada do React
├── index.css                importa os arquivos de estilo das duas páginas
├── paginas/
│   ├── PaginaSite.jsx       landing page (rota inicial)
│   └── PaginaAplicativo.jsx aparelho navegável (rota #/app)
├── site/
│   ├── components/          cabeçalho, hero, solução, público-alvo, recursos,
│   │                        galeria, estatísticas, dica do dia, equipe, contato
│   │                        e rodapé da landing
│   └── data/                recursos, galeria, estatísticas, equipe e dicas
├── components/
│   ├── dispositivo/         barra de status e barra do sistema (cabeçalho e rodapé)
│   ├── camera/              barra da câmera, visor, zoom, modos, captura e painel pós-captura
│   ├── albuns/              cartão de resumo, grade e cartão de matéria, seletor de cores
│   ├── notas/               grade e itens de anotação, tela do álbum e tela da anotação
│   ├── paineis/             galeria, central, busca, histórico, lixeira e ajustes
│   └── ui/                  ícones em SVG e componentes reutilizáveis (menu, diálogo, aviso…)
├── hooks/
│   ├── useLocalStorage.js   espelha um estado do React no localStorage
│   ├── useRota.js           rota pelo hash da URL (landing ↔ aplicativo)
│   ├── useBiblioteca.js     regra de negócio (álbuns, anotações, lixeira, histórico, estatísticas)
│   ├── useNavegacao.js      navegação em pilha, como no Android
│   ├── useCamera.js         temporizador, clarão e montagem da anotação capturada
│   ├── usePressaoLonga.js   separa o toque rápido da pressão longa no mesmo botão
│   ├── useWebcam.js         acesso opcional à câmera real do dispositivo
│   └── useRelogio.js        relógio da barra de status
├── data/                    conteúdo inicial, cores, modos e dicas
├── utils/                   formatação, aleatoriedade, imagem, exportação e posição de menus
├── services/                integrações externas (Gemini e text-to-speech)
└── css/
    ├── (raiz)               estilos do aplicativo: base, dispositivo, câmera,
    │                        álbuns, notas, painéis e componentes
    └── site/                estilos da landing page (base e design system)
```



## Integrações de API

Dois arquivos — e somente eles — concentram as chamadas de rede da aplicação:

| Arquivo | Recurso | Serviço |
| --- | --- | --- |
| `src/services/api.js` | OCR da captura, análise da anotação (resumo e pontos-chave), quiz sob demanda e classificação da matéria | Google Gemini (`gemini-3.5-flash-lite`) |
| `src/services/textToSpeech.js` | Leitura da anotação em voz alta | Google Cloud Text-to-Speech, com a síntese nativa do navegador como alternativa |

As chaves ficam no arquivo `.env` da raiz, nas variáveis `VITE_GOOGLE_API_KEY` e
`VITE_GOOGLE_TTS_KEY`. O Vite só expõe ao navegador as variáveis com o prefixo
`VITE_` e as lê durante o build, então reinicie o `npm run dev` depois de
alterá-las.



Para usar chaves próprias sem mexer no `.env`, copie o modelo:

```bash
cp .env.example .env.local
```

As funções devolvem `{ ok: false, mensagem }` quando a chamada falha, e a
interface mostra o recado no lugar do resultado — a aplicação continua
funcionando mesmo sem rede. Detalhes em `src/services/INTEGRACOES.md`.


## Link do repositório Git e do Deploy na Vercel

- **Repositório Git:** _adicionar o link após o push para o GitHub._ O repositório
  local já está criado; para publicar:

  ```bash
  git remote add origin https://github.com/<usuario>/<repositorio>.git
  git push -u origin main
  ```

- **Deploy na Vercel:** _adicionar o link após publicar (`vercel --prod` ou
  integração com o GitHub). O projeto é um Vite + React padrão: a Vercel detecta
  sozinha o comando `npm run build` e a pasta de saída `dist`._

---

StudyCam AI · Challenge 2026 · FIAP × JOVI
