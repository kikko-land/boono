import { describe, expect, it } from "vitest";

import { select } from "../statements/select";
import { between, between$, notBetween, notBetween$ } from "./between";

describe("between", () => {
  it("works", () => {
    expect(between(10, 5, 15).toSql().preparedQuery).toEqual({
      values: [10, 5, 15],
      text: "? BETWEEN ? AND ?",
    });

    expect(notBetween(10, 5, 15).toSql().preparedQuery).toEqual({
      values: [10, 5, 15],
      text: "? NOT BETWEEN ? AND ?",
    });

    expect(
      select()
        .from("books")
        .where({ pages: between$(10, 20) })
        .toSql().preparedQuery
    ).toEqual({
      values: [10, 20],
      text: 'SELECT * FROM "books" WHERE "pages" BETWEEN ? AND ?',
    });

    expect(
      select()
        .from("books")
        .where({ pages: notBetween$(10, 20) })
        .toSql().preparedQuery
    ).toEqual({
      values: [10, 20],
      text: 'SELECT * FROM "books" WHERE "pages" NOT BETWEEN ? AND ?',
    });
  });
});
