import { sql } from "@kikko-land/sql";
import { describe, expect, it } from "vitest";

import {
  glob,
  like,
  match,
  notGlob,
  notLike,
  notMatch,
  notRegexp,
  regexp,
} from "./binary";

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

  [
    { name: "GLOB", func: glob, notFunc: notGlob },
    { name: "MATCH", func: match, notFunc: notMatch },
    { name: "REGEXP", func: regexp, notFunc: notRegexp },
  ].forEach(({ name, func, notFunc }) => {
    it(`builds ${name}`, () => {
      expect(func(sql.ident("author"), "James").toSql().preparedQuery).toEqual({
        text: `"author" ${name} ?`,
        values: ["James"],
      });

      expect(
        notFunc(sql.ident("author"), "James").toSql().preparedQuery
      ).toEqual({
        text: `"author" NOT ${name} ?`,
        values: ["James"],
      });
    });
  });
});
