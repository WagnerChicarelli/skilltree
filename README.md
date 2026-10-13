# Árvore de Skills

Aplicação web (React + TypeScript + Vite) para **gerenciar e distribuir pontos** da
"Árvore de Skills" de RPG, construída a partir dos dados reais da planilha
`ARVORE DE SKILLS.xlsx` (aba **"Divisão de Pontos"**).

Cada visitante monta a **sua própria configuração**, salva automaticamente no
**navegador** (localStorage). Não há servidor, banco de dados nem sincronização
entre usuários — a aplicação é 100% estática e pode ser publicada no Vercel.

> Importante: os dados de origem não descrevem habilidades individuais com
> descrições/pré-requisitos. O conteúdo real é um **sistema de pontos** com 24
> linhas/classes e 5 patentes de custo fixo. A aplicação é fiel a esses dados.

---

## Regras do sistema (extraídas da planilha)

- **Orçamento total:** 31.500 pontos (`PONTOS TOTAIS ORÇADOS`).
- **Patentes e custos fixos:**

  | Patente      | Custo |
  | ------------ | ----- |
  | Novato       | 1000  |
  | Aprendiz     | 1500  |
  | Adepto       | 2000  |
  | Especialista | 2500  |
  | Mestre       | 3500  |

- **24 linhas/classes:** Assassino, Batedor, Cavaleiro, Precursor, Espião,
  Bandido, Berserker, Brutamontes, Arqueiro, Espadachim, Lâmina, Lenhador de
  Guerra, Destruidor, Monge, Lanceiro, Guarda, Soldado, Cavaleiro Pesado,
  Escudeiro, Conjurador, Místico, Feiticeiro, Ilusionista, Curandeiro.
- **Pontos consumidos por linha** = soma dos custos das patentes adquiridas
  (coluna `H`).
- **Nível atual da linha** = patente mais alta adquirida (coluna `G`;
  "Nenhum" se vazia).
- **Nível global** = quantidade de patentes adquiridas (semelhante ao
  `COUNTIF(B:F, TRUE)` da célula `G5`).
- **Saldo restante** = orçamento total − pontos consumidos.
- **Compra sequencial (padrão):** para adquirir uma patente é preciso ter as
  anteriores na mesma linha. Configurável no botão **Config.**

A aplicação inicia com a **árvore limpa** (nenhuma patente adquirida) e o
orçamento total de 31.500 pontos. O exemplo da planilha de origem (Conjurador e
Feiticeiro completos, etc. → 31.500 pontos, nível global 20) permanece disponível
em `SPREADSHEET_EXAMPLE_PURCHASED` para referência/testes.

---

## Tecnologias

- **React 18** + **TypeScript**
- **Vite 5** (build / dev server)
- **SVG** para desenhar nós e conexões da árvore (com pan e zoom)
- **lucide-react** para ícones
- **Vitest** para testes unitários
- CSS moderno (tema escuro de fantasia medieval) — sem imagens externas

---

## Requisitos

- Node.js 18+ (testado com Node 20)
- npm

## Executar localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`).

## Scripts

| Script              | Descrição                                 |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Ambiente de desenvolvimento               |
| `npm run build`     | Verifica tipos (`tsc`) e gera `dist/`      |
| `npm run preview`   | Pré-visualiza a build de produção         |
| `npm run typecheck` | Verificação de tipos sem emitir arquivos  |
| `npm test`          | Executa os testes unitários (Vitest)      |

> Não há lint configurado neste projeto (apenas typecheck + testes).

---

## Arquitetura

A aplicação separa **dados**, **regras de negócio** e **interface**:

```
src/
  types.ts                     Tipos centrais
  data/
    skills.ts                  Dados convertidos da planilha (patentes, linhas, orçamento)
    classDescriptions.ts       Descrições das classes e efeitos por patente (atributos_classes.txt)
  logic/
    progression.ts             Regras puras: custos, níveis, validação de compra/remoção
    storage.ts                 localStorage, versionamento, importação/exportação validada
    __tests__/                 Testes unitários (Vitest)
  hooks/
    useBuild.ts                Estado da construção + salvamento automático
  components/
    SkillTree.tsx              Árvore SVG (nós, conexões, pan/zoom, busca/filtro)
    Toolbar.tsx                Busca, filtro, exportar/importar, reiniciar, configurações
    StatsPanel.tsx             Orçamento, usados, saldo, nível global, linhas ativas
    DetailPanel.tsx            Detalhes da linha + descrição geral + efeitos por patente
    ConfirmDialog.tsx          Diálogo de confirmação
  App.tsx                      Composição da tela
  index.css                    Tema e responsividade
```

As funções em `logic/` são puras e independentes do React, o que as torna
testáveis e reutilizáveis.

---

## Funcionalidades

- Visualização da árvore em SVG com conexões entre patentes.
- **Pan** (arrastar) e **zoom** (roda do mouse, botões + / − / Ajustar).
- Busca por linha ou patente e filtros (todas, adquiridas, disponíveis, bloqueadas).
- Seleção de nó com painel de detalhes (nível atual, pontos da linha, custos).
- **Descrições das classes e efeitos por patente** no painel de detalhes: descrição
  geral da classe, efeito completo de cada patente (texto integral, sem corte) e
  destaque do efeito da patente selecionada. Fonte única em
  `src/data/classDescriptions.ts`, extraída de `atributos_classes.txt`.
- Adquirir/remover patentes respeitando pré-requisitos sequenciais e o orçamento.
- Mensagens claras do motivo de bloqueio ("Requer Novato nesta linha",
  "Pontos insuficientes: faltam X", etc.).
- **Salvamento automático** no `localStorage` e restauração ao reabrir.
- **Exportar** a configuração para JSON e **importar** com validação completa.
- **Reiniciar** com confirmação.
- Navegação por teclado (foco nos nós, `Enter`/`Espaço` para selecionar).

### Progresso individual e armazenamento

- O progresso é salvo **apenas no navegador daquele usuário** (localStorage).
- Nada é enviado para a nuvem e não há sincronização entre dispositivos.
- Arquivos exportados carregam um campo `version` (versionamento de formato).
- Arquivos inválidos/corrompidos são rejeitados com mensagem amigável; referências
  desconhecidas são descartadas com aviso; configurações acima do orçamento ou
  com lacunas sequenciais são recusadas.

Formato do arquivo:

```json
{
  "version": 1,
  "totalPoints": 31500,
  "sequential": true,
  "purchased": ["assassino:novato", "curandeiro:novato"]
}
```

---

## Testes

```bash
npm test        # 36 testes (progressão, armazenamento/importação e cobertura das descrições)
npm run build   # typecheck + build de produção
```

Cobertura dos testes: cálculo de custos e níveis, pré-requisitos sequenciais,
limite de orçamento, compra/remoção coerentes, round-trip de exportação/importação,
rejeição de dados corrompidos e de referências inexistentes, além da **cobertura
das descrições** (cada classe/patente descrita, sem duplicatas e com valores
preservados).

---

## Atualizando os dados

### Custos e linhas — `src/data/skills.ts`

- `TIERS`: patentes e custos (`novato`, `aprendiz`, `adepto`, `especialista`, `mestre`).
- `LINES`: linhas/classes (mantenha os `id` estáveis).
- `TOTAL_POINTS`: orçamento total.
- `DEFAULT_PURCHASED`: estado inicial (vazio — árvore limpa).
- `SPREADSHEET_EXAMPLE_PURCHASED`: exemplo da planilha (referência/testes).

### Descrições — `src/data/classDescriptions.ts`

- `CLASS_DESCRIPTIONS`: lista de `{ lineId, name, general, tiers[] }`, associada
  por `lineId` estável. Fonte original: `atributos_classes.txt`.
- Cada patente guarda o texto **integral** do efeito (`tierId` + `effect`).

Ao mudar os dados, ajuste os testes se necessário e rode `npm test`.

> Validações de integridade: os `id` devem ser únicos e todas as chaves
> `linha:patente` são verificadas por `VALID_KEYS` (importação rejeita
> referências inexistentes). Duplicatas são removidas automaticamente.
>
> `validateCoverage()` e `assertNamesMatch()` (em `classDescriptions.ts`) são
> usados pelos testes para detectar classes sem descrição, patentes em falta,
> `lineId` duplicados/desconhecidos e nomes divergentes.

---

## Publicar no Vercel

Não é necessário `vercel.json`: a aplicação é uma SPA sem rotas do lado do
cliente e o Vercel detecta o preset **Vite**, publicando a pasta `dist`.

### 1. Criar um repositório no GitHub

1. Instale o Git (não estava instalado: https://git-scm.com/downloads).
2. Na pasta do projeto:

   ```bash
   git init
   git add .
   git commit -m "Arvore de Skills: app web"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/arvore-de-skills.git
   git push -u origin main
   ```

   > A planilha original está no `.gitignore` e **não** será publicada.

### 2. Importar no Vercel

1. Acesse https://vercel.com e faça login (pode usar a conta GitHub).
2. **Add New… → Project → Import Git Repository** e escolha o repositório.
3. Framework preset: **Vite**.
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Clique em **Deploy**.

### 3. Publicar e obter o endereço

- Ao final do deploy, o Vercel fornece uma URL pública
  (ex.: `https://arvore-de-skills.vercel.app`).
- Cada `push` na branch `main` dispara um **novo deploy automático**.
- Alternativa via CLI:

  ```bash
  npm i -g vercel
  vercel        # primeiro deploy (preview)
  vercel --prod # deploy de produção
  ```

> A URL acima é um exemplo. O endereço real só existe após o deploy ser
> efetivamente executado (o deploy **não** foi realizado por mim).

---

## Dúvidas encontradas na planilha

1. **Sequência das patentes:** a planilha não declara explicitamente que as
   patentes devem ser compradas em ordem; todos os exemplos preenchidos, porém,
   usam prefixos contínuos. Implementei como **sequencial por padrão**, com opção
   de desligar em **Config.**
2. **Pré-requisitos entre linhas:** não há qualquer dado que indique dependência
   entre linhas diferentes, então **não foram criados**.
3. **Limite de nível global:** `G5` é apenas uma contagem de patentes; não há teto
   documentado, então o nível global é ilimitado (limitado apenas pelo orçamento).
4. **Sem descrições/categorias/ícones:** como a fonte não os possui, não foram
   inventados.

## Limitações

- Sem sincronização entre dispositivos/usuários (por design nesta versão).
- Sem backend/autenticação.
- Sem lint configurado.
- A planilha de origem não distingue categorias, portanto o filtro é por
  situação (adquirida/disponível/bloqueada), não por categoria.
- O deploy no Vercel **não foi executado** por mim; as instruções acima devem ser
  seguidas para obter a URL pública.
