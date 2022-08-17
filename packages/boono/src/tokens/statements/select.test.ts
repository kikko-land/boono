import { sql } from "@kikko-land/sql";
import { describe, expect, it } from "vitest";

import { alias } from "../alias";
import { desc } from "../order";
import { windowBody, windowFn } from "../windowFn";
import { select } from "./select";

describe("select", () => {
  it("works", () => {
    expect(
      select()
        .from("notes")
        .toSql().raw
    ).to.eq('SELECT * FROM "notes"');

    expect(
      select({ a: sql`LOWER(X)` })
        .from("notes")
        .toSql().raw
    ).to.eq('SELECT LOWER(X) AS "a" FROM "notes"');
  });

  it("works with window", () => {
    expect(
      select(
        {
          a: windowFn(sql`group_concat(a, '.')`).over(
            windowBody()
              .fromBase("func")
              .partitionBy("kek")
              .partitionBy("puk")
              .orderBy(desc("kek"))
          ),
        },
        windowFn(sql`group_concat(b, '.')`),
        alias(windowFn(sql`group_concat(c, '.')`), "test")
      )
        .from("notes")
        .toSql().raw
    ).to.eq(
      `SELECT group_concat(a, '.') OVER (func PARTITION BY "kek", "puk" ORDER BY "kek" DESC) AS "a", group_concat(b, '.') OVER (), group_concat(c, '.') OVER () AS "test" FROM "notes"`
    );
  });
});
