import { sql } from "@kikko-land/sql";
import { describe, expect, it } from "vitest";

import { like, notLike } from "./binary";

describe("binary", () => {
  it("builds LIKE", () => {
    expect(like(sql.ident("author"), "%James%").toSql().preparedQuery).toEqual({
      text: '"author" LIKE ?',
      values: ["%James%"],
    });

    expect(
      like(sql.ident("author"), "%James%", "'hey\\").toSql().preparedQuery
    ).toEqual({
      text: `"author" LIKE ? ESCAPE '\\'hey\\\\'`,
      values: ["%James%"],
    });

    expect(
      like(sql.ident("author"), "%James\\%", "\\").toSql().preparedQuery
    ).toEqual({
      text: `"author" LIKE ? ESCAPE '\\\\'`,
      values: ["%James\\%"],
    });

    expect(
      notLike(sql.ident("author"), "%James%").toSql().preparedQuery
    ).toEqual({
      text: `"author" NOT LIKE ?`,
      values: ["%James%"],
    });
  });
});
