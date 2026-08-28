/**
 * ESLint plugin "meta-construtor" — regra `no-unsourced-claims`.
 *
 * PREVENÇÃO do padrão FALSO-036 → FALSO-055 → FALSO-056 (PRD_falso.md):
 * claims numéricas / social-proof hardcoded SEM fonte auditável.
 *
 * O que é sinalizado (WARNING no lint; ERROR no check de CI):
 *   - Contagem social-proof: "1.500+ obras", "300+ construtoras", "50k+ RDOs"
 *     (números "grandes/redondos" — >= 50, com sufixo k/M ou separador de milhar)
 *   - Percentual de prova social: "98% satisfação", "99.2% uptime", "100% operacional"
 *   - Avaliação/rating: "4.9 de avaliação", "4.9/5", "4.9/5.0"
 *   - Contagem de avaliações: "1.250 avaliações"
 *
 * Escape hatch ("com fonte"): a métrica NÃO é sinalizada quando
 *   (a) há um comentário com marca de fonte na MESMA linha ou na linha ANTERIOR:
 *         // fonte: <url|referência>
 *         // @source <url|referência>
 *       (também funciona o disable padrão do ESLint:
 *         // eslint-disable-next-line meta-construtor/no-unsourced-claims)
 *   (b) o próprio texto já contém uma anotação explícita de fonte:
 *         "fonte: https://..." ou "@source ..." ou uma URL http(s)://.
 *
 * A severidade é definida pela config (WARN no `npm run lint`, ERROR no
 * `scripts/check-unsourced-claims.mjs` usado no CI). Esta regra NUNCA deve ser
 * configurada como "error" no lint padrão do projeto.
 */

// ---------------------------------------------------------------------------
// Padrões de detecção
// ---------------------------------------------------------------------------

// Substantivos de "prova social" do produto (mesmos da auditoria FALSO).
const SOCIAL_PROOF_NOUN =
  "(?:obras|construtoras|clientes|usu[áa]rios|avalia[çc][õo]es|rdo[s]?|projetos|empreiteiras|empresas)";

const PATTERNS = [
  {
    kind: "contagem",
    // "1.500+ obras", "300+ construtoras", "50k+ RDOs", "450+ construtoras"
    regex: new RegExp(
      "\\b(\\d{1,3}(?:[.,]\\d{1,3})*(?:\\s*[kKmM])?)\\s*\\+\\s*(?:de\\s+)?" +
        SOCIAL_PROOF_NOUN +
        "\\b",
      "gi",
    ),
    requiresLargeNumber: true,
  },
  {
    kind: "percentual",
    // "98% satisfação", "99.2% uptime", "100% operacional"
    regex:
      /\b\d{1,3}(?:[.,]\d+)?\s*%\s*(?:de\s+)?(?:satisfa[çc][ãa]o|operacional|uptime|disponibilidade)\b/gi,
    requiresLargeNumber: false,
  },
  {
    kind: "avaliação",
    // "4.9 de avaliação", "4.9/5", "4.9/5.0"
    regex:
      /\b\d[.,]\d\s*(?:\/\s*5(?:[.,]0)?|\s*(?:de\s+)?avalia[çc][ãa]o)\b/gi,
    requiresLargeNumber: false,
  },
  {
    kind: "avaliações",
    // "1.250 avaliações"
    regex: new RegExp("\\b(\\d{1,3}(?:[.,]\\d{1,3})*)\\s+avalia[çc][õo]es\\b", "gi"),
    requiresLargeNumber: true,
  },
];

// Marca explícita de fonte em COMENTÁRIO.
const COMMENT_SOURCE = /(?:fonte|@source|ref(?:er[êe]ncia)?)\s*:|https?:\/\//i;

// Marca explícita de fonte NO PRÓPRIO TEXTO.
const INLINE_SOURCE = /(?:fonte\s*:|@source|https?:\/\/)/i;

/**
 * Números "grandes/redondos" de prova social (>= 50, com sufixo k/M ou com
 * separador de milhar como "1.500"). Evita falsos positivos em ranges comuns
 * de UI (ex.: "9+ obras" numa opção de formulário de porte da empresa).
 */
function isLargeNumber(match) {
  const numRaw = (match[1] ?? match[0]).trim();
  const hasSuffix = /[kKmM]\s*$/.test(numRaw);
  const hasSeparator = /[.,]\d{3}/.test(numRaw);
  const digits = numRaw.replace(/[^\d]/g, "");
  const value = Number.parseInt(digits, 10);
  return hasSuffix || hasSeparator || value >= 50;
}

// ---------------------------------------------------------------------------
// Regra
// ---------------------------------------------------------------------------

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Bloqueia claims numéricas/social-proof hardcoded sem fonte auditável (padrão FALSO-036/055/056).",
    },
    messages: {
      unsourcedClaim:
        "Claim numérica/social-proof '{{claim}}' ({{kind}}) sem fonte auditável — padrão FALSO-036/055/056. " +
        "Documente com um comentário `// fonte: <url|ref>` na mesma linha (ou na anterior) ou remova a métrica.",
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    // Linhas que possuem um comentário com marca de fonte (pré-computado 1x).
    // Usa getAllComments() para cobrir também comentários dentro de JSX
    // (`{/* fonte: ... */}`), que getCommentsBefore/After não associa ao nó de texto.
    const sourceCommentLines = new Set();
    for (const c of sourceCode.getAllComments()) {
      if (COMMENT_SOURCE.test(c.value)) {
        sourceCommentLines.add(c.loc.end.line);
      }
    }

    function isSourced(node, text) {
      // (b) fonte explícita no próprio texto.
      if (text && INLINE_SOURCE.test(text)) return true;

      // (a) comentário com fonte na mesma linha ou na linha imediatamente anterior.
      const line = node.loc.start.line;
      return sourceCommentLines.has(line) || sourceCommentLines.has(line - 1);
    }

    function checkText(rawText, node) {
      if (typeof rawText !== "string" || rawText.length === 0) return;
      if (isSourced(node, rawText)) return;

      for (const pat of PATTERNS) {
        pat.regex.lastIndex = 0;
        let m;
        while ((m = pat.regex.exec(rawText)) !== null) {
          if (pat.requiresLargeNumber && !isLargeNumber(m)) continue;
          context.report({
            node,
            messageId: "unsourcedClaim",
            data: { claim: m[0].trim(), kind: pat.kind },
          });
        }
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          checkText(node.value, node);
        }
      },
      JSXText(node) {
        checkText(node.value, node);
      },
      TemplateElement(node) {
        const v = node.value.cooked ?? node.value.raw;
        checkText(v, node);
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Plugin (objeto flat-config)
// ---------------------------------------------------------------------------

const plugin = {
  meta: {
    name: "meta-construtor",
    version: "1.0.0",
  },
  rules: {
    "no-unsourced-claims": rule,
  },
};

export { rule, plugin };
export default plugin;
