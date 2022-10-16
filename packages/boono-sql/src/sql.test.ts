import { describe, expect, it } from "vitest";

import { sql } from "./sql";

describe("sql", () => {
  it("works", () => {
    const query = sql`SELECT * FROM ${sql.table`users`} WHERE ${sql.liter(
      "num"
    )}=${1} AND nullColl=${null} AND ids IN ${sql.join(
      [1, 2, 3],
      ", ",
      "(",
      ")"
    )}${sql.empty}`;

    expect(query.preparedQuery).toEqual({
      values: [1, null, 1, 2, 3],
      text:
        'SELECT * FROM "users" WHERE "num"=? AND nullColl=? AND ids IN (?, ?, ?)',
    });
  });

  describe("strip", () => {
    it("strips all bad values", () => {
      expect(sql.strip('d-f.').raw).toEqual('df')
      expect(sql.strip`'d-f`.raw).toEqual('df')
      expect(sql.strip`'d-f${'kek'}.`.raw).toEqual('dfkek')
    });
  });

  describe("table", () => {
    it("works", () => {
      const query = sql`SELECT * FROM ${sql.table`notes`}`;
      expect(query.tables.map(({name}) => name)).toStrictEqual(['notes'])

      const query2 = sql`SELECT * FROM ${sql.table('notes', [sql.table`user`])}`;
      expect(query2.tables.map(({name}) => name)).toStrictEqual(['notes', 'users'])
    });
  });

  describe("join", () => {
    it("works with all values", () => {
      expect(
        sql.join([
          null,
          sql``,
          sql.empty,
          0,
          1,
          2,
          3,
          new Uint8Array([0, 0, 0]),
        ]).preparedQuery
      ).toEqual({
        values: [null, 0, 1, 2, 3, new Uint8Array([0, 0, 0])],
        text: "?, ?, ?, ?, ?, ?",
      });
    });
  });

  describe("join", () => {
    it("works with a lot of values", () => {
      const toJoin: number[] = [];

      for (let i = 0; i < 10_000_000; i++) {
        toJoin.push(i);
      }

      expect(() => {
        void sql.join(toJoin);
      }).not.toThrowError();
    });
  });
});
