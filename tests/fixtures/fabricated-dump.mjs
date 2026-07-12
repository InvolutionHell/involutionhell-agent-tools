import { create, insertMultiple, save } from "@orama/orama";
import { createTokenizer } from "@orama/tokenizers/mandarin";
import { SEARCH_SCHEMA } from "../../src/search.mjs";

export async function createFabricatedDump(locale = "zh") {
  const db = create({
    schema: SEARCH_SCHEMA,
    ...(locale === "zh" ? { components: { tokenizer: createTokenizer() } } : { language: "english" }),
  });
  const records = locale === "zh" ? [
    { id: "/zh/docs/array", page_id: "/zh/docs/array", type: "page", tags: ["cs"], url: "/zh/docs/array", content: "动态数组指南" },
    { id: "/zh/docs/array-0", page_id: "/zh/docs/array", type: "text", tags: ["cs"], url: "/zh/docs/array", content: "介绍数组扩容、摊还复杂度与工程权衡。" },
    { id: "/zh/docs/array-1", page_id: "/zh/docs/array", type: "heading", tags: ["cs"], url: "/zh/docs/array#growth", content: "动态数组扩容" },
    { id: "/zh/docs/array-2", page_id: "/zh/docs/array", type: "text", tags: ["cs"], url: "/zh/docs/array#growth", content: "动态数组通常在容量不足时进行倍增扩容。" },
    { id: "/zh/docs/sort", page_id: "/zh/docs/sort", type: "page", tags: ["cs"], url: "/zh/docs/sort", content: "数组排序" },
    { id: "/zh/docs/sort-0", page_id: "/zh/docs/sort", type: "text", tags: ["cs"], url: "/zh/docs/sort", content: "比较常见数组排序算法。" },
  ] : [
    { id: "/en/docs/dynamic-array", page_id: "/en/docs/dynamic-array", type: "page", tags: ["cs"], url: "/en/docs/dynamic-array", content: "Dynamic Array Guide" },
    { id: "/en/docs/dynamic-array-0", page_id: "/en/docs/dynamic-array", type: "text", tags: ["cs"], url: "/en/docs/dynamic-array", content: "A guide to dynamic array growth and amortized complexity." },
  ];
  await insertMultiple(db, records);
  return { type: "advanced", ...save(db) };
}
