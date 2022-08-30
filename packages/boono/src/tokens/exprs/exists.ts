import { IPrimitiveValue, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";

export interface IExistsOperator extends IBaseToken<TokenType.Exists> {
  __state: {
    not: boolean;
    right: IBaseToken | ISqlAdapter | IPrimitiveValue;
  };
}

const performExists = (
  expr: IBaseToken | ISqlAdapter | IPrimitiveValue,
  not: boolean
): IExistsOperator => {
  return {
    __state: {
      not,
      right: expr,
    },
    type: TokenType.Exists,
    toSql() {
      return sql.join(
        [
          this.__state.not ? sql`NOT` : sql.empty,
          sql`EXISTS`,
          sql`(${this.__state.right})`,
        ],
        " "
      );
    },
  };
};

export const exists = (expr: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
  performExists(expr, false);

export const notExists = (expr: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
  performExists(expr, true);

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it("works", () => {
    expect(exists(sql`SELECT * FROM notes`).toSql().preparedQuery).toEqual({
      text: "EXISTS (SELECT * FROM notes)",
      values: [],
    });

    expect(notExists(sql`SELECT * FROM notes`).toSql().preparedQuery).toEqual({
      text: "NOT EXISTS (SELECT * FROM notes)",
      values: [],
    });
  });
}
