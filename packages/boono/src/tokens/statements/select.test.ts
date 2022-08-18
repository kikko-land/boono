import { sql } from "@kikko-land/sql";
import Database from "better-sqlite3";
import { format } from "sql-formatter";
import { describe, expect, it } from "vitest";

import { alias } from "../alias";
import { and, eq$, gtEq, gtEq$, like$, or } from "../binary";
import { asc, desc } from "../order";
import { not } from "../unary";
import { windowBody, windowFn } from "../windowFn";
import { select } from "./select";

const db = new Database(":memory:");

db.exec(
  "CREATE TABLE IF NOT EXISTS books (id, pages, title, otherCol, type1, type2, author)"
);
db.exec(
  "CREATE TABLE IF NOT EXISTS books2 (id, pages, title, otherCol, type1, type2, author)"
);
db.exec("CREATE TABLE IF NOT EXISTS comments (id)");

describe("select", () => {
  it("works with window", () => {
    const query = format(
      select(
        {
          a: windowFn(sql`group_concat(author, '.')`).over(
            windowBody()
              .partitionBy("title")
              .partitionBy("author")
              .orderBy(desc("pages"))
          ),
        },
        windowFn(sql`group_concat(author, '.')`),
        alias(windowFn(sql`group_concat(author, '.')`), "test")
      )
        .from("books")
        .toSql().raw
    );

    expect(() => db.prepare(query)).not.toThrow();

    expect(format(query)).to.eq(
      `
SELECT
  group_concat (author, '.') OVER (
    PARTITION BY
      "title",
      "author"
    ORDER BY
      "pages" DESC
  ) AS "a",
  group_concat (author, '.') OVER (),
  group_concat (author, '.') OVER () AS "test"
FROM
  "books"
      `.trim()
    );
  });

  it("allows to define window function", () => {
    const query = select("author", {
      a: windowFn(sql`group_concat(author, '.')`).over(
        windowBody().fromBase("kek")
      ),
    })
      .defineWindow(
        "kek",
        windowBody()
          .partitionBy("author")
          .partitionBy("title")
          .orderBy(desc("pages"))
      )
      .defineWindow("pog", windowBody().partitionBy("title"))
      .from("books")
      .toSql().raw;

    expect(() => db.prepare(query)).not.toThrow();

    expect(format(query)).to.eq(
      `
SELECT
  "author",
  group_concat (author, '.') OVER (kek) AS "a"
FROM
  "books"
WINDOW
  kek AS (
    PARTITION BY
      "author",
      "title"
    ORDER BY
      "pages" DESC
  ),
  pog AS (
    PARTITION BY
      "title"
  )`.trim()
    );
  });

  it("works", () => {
    const res = select("author", "title")
      .distinct(true)
      .joinRight("comments")
      .from(
        "books",
        select()
          .from("comments")
          .limit(10)
      )
      .where(not(and({ title: eq$("Harry Potter") }, { pages: gtEq$(5) })))
      .where(or({ title: eq$("Little Prince"), otherCol: like$("Little") }))
      // Or you can use the full version, like gtEq(col, val)
      .where(gtEq("pages", 10))
      // You can also use raw sql in where
      .orWhere(sql`"books".author = 'James'`, sql`"books".title = 'Harry'`)
      .orderBy(asc("author", "NULLS FIRST"), desc("title", "NULLS LAST"))
      .groupBy("books.author")
      .having(gtEq(sql`COUNT(pages)`, 5))
      // support union
      .union(select({ author: "James", title: "Harry" }).limit(5))
      .toSql().raw;

    expect(() => db.prepare(res)).not.toThrow();

    expect(format(res)).to.eq(
      `
SELECT DISTINCT
  "author",
  "title"
FROM
  "books",
  (
    SELECT
      *
    FROM
      "comments"
    LIMIT
      10
  )
  RIGHT JOIN "comments"
WHERE
  (
    NOT (
      "title" = 'Harry Potter'
      AND "pages" >= 5
    )
    AND (
      "title" = 'Little Prince'
      OR "otherCol" LIKE 'Little'
    )
    AND 'pages' >= 10
    OR "books".author = 'James'
  )
  OR "books".title = 'Harry'
GROUP BY
  "books"."author"
HAVING
  COUNT(pages) >= 5
UNION
SELECT
  'author' AS "James",
  'title' AS "Harry"
ORDER BY
  "author" ASC NULLS FIRST,
  "title" DESC NULLS LAST
`.trim()
    );
  });
});
