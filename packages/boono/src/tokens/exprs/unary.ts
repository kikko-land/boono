import { IPrimitiveValue, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";

export interface IUnaryOperator extends IBaseToken<TokenType.Unary> {
  readonly __state: Readonly<{
    operator: "NOT";
    expr: IBaseToken | ISqlAdapter | IPrimitiveValue;
  }>;
}

export const not = (
  expr: IBaseToken | ISqlAdapter | IPrimitiveValue
): IUnaryOperator => {
  return {
    __state: {
      operator: "NOT",
      expr: expr,
    },
    type: TokenType.Unary,
    toSql() {
      return sql`NOT (${this.__state.expr})`;
    },
  };
};

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it("works", () => {
    expect(not(sql`5 = 6`).toSql().preparedQuery).toEqual({
      text: "NOT (5 = 6)",
      values: [],
    });
  });
}
