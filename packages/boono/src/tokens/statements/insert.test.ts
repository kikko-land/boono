import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import { insert } from "./insert";

const db = new Database(":memory:");

db.exec(
  "CREATE TABLE IF NOT EXISTS books (id, pages, title, otherCol, type1, type2, author)"
);
db.exec(
  "CREATE TABLE IF NOT EXISTS books2 (id, pages, title, otherCol, type1, type2, author)"
);
db.exec("CREATE TABLE IF NOT EXISTS comments (id)");

describe("insert", () => {
  it("works", () => {
    const query = insert({ id: "123" })
      .into("books")
      .orAbort()
      .returning("*");

    expect(query.toSql().preparedQuery).toStrictEqual({
      values: ["123"],
      text: 'INSERT OR ABORT INTO "books" ("id") VALUES (?) RETURNING *',
    });
  });

  it("works with upserts", () => {});
});
