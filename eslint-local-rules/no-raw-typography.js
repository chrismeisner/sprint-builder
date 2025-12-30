/**
 * Prevents using raw Tailwind typography/font classes in JSX className literals,
 * so type always flows through the design-system Typography scale.
 *
 * Allows:
 * - className composed from helpers/components (non-literal or expressions)
 * - Arbitrary classes unrelated to typography (e.g., layout, color)
 *
 * Blocks (when used in plain string literals):
 * - text-{size} (xs, sm, base, lg, xl, 2xl-9xl or arbitrary text-[...])
 * - font-{weight} (thin, extralight, light, normal, medium, semibold, bold, extrabold, black)
 * - leading-* and tracking-* (line-height/letter-spacing)
 * - font-gooper* families
 */

const DISALLOWED_PATTERNS = [
  /\btext-(xs|sm|base|lg|xl|[2-9]xl)\b/,
  /\btext-\[[^\]]+\]/,
  /\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/,
  /\bleading-[^\s]+/,
  /\btracking-[^\s]+/,
  /\bfont-gooper[^\s]*/,
];

function extractLiteralClassName(value) {
  if (!value) return null;

  if (value.type === "Literal" && typeof value.value === "string") {
    return value.value;
  }

  if (value.type === "TemplateLiteral" && value.expressions.length === 0) {
    return value.quasis.map((q) => q.value.cooked || "").join("");
  }

  // Non-literal (contains expressions) — skip
  return null;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow raw typography/font classes; require design-system typography helpers instead.",
    },
    schema: [],
    messages: {
      noRawTypography:
        "Use the Typography component or design-system helpers for type. Raw typography classes (text-*, font-*, leading-*, tracking-*, font-gooper*) are disallowed to keep the style guide as the single source of truth.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.name !== "className") return;
        const literalClassName = extractLiteralClassName(node.value);
        if (!literalClassName) return;

        const hits = DISALLOWED_PATTERNS.some((regex) => regex.test(literalClassName));
        if (hits) {
          context.report({
            node,
            messageId: "noRawTypography",
          });
        }
      },
    };
  },
};

