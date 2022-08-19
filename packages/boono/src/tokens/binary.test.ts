import { sql } from "@kikko-land/sql";
import { describe, expect, it } from "vitest";

import { like } from "./binary";

describe("binary", () => {
  it("builds LIKE", () => {
    expect(like(sql.ident("author"), "%James%").toSql().raw).to.eq(
      `"author" LIKE '%James%'`
    );

    expect(like(sql.ident("author"), "%James%", "'hey\\").toSql().raw).to.eq(
      `"author" LIKE '%James%' ESCAPE '\\'hey\\\\'`
    );

    expect(like(sql.ident("author"), "%James\\%", "\\").toSql().raw).to.eq(
      `"author" LIKE '%James\\%' ESCAPE '\\\\'`
    );
  });
});
