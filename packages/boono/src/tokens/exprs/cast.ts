import { IPrimitiveValue, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";

export interface ICastOperator extends IBaseToken<TokenType.Cast> {
  readonly __state: Readonly<{
    left: IBaseToken | ISqlAdapter | IPrimitiveValue;
    typeName: "NONE" | "TEXT" | "REAL" | "INTEGER" | "NUMERIC";
  }>;
}

export const cast = (
  expr: IBaseToken | ISqlAdapter | IPrimitiveValue,
  typeName: "NONE" | "TEXT" | "REAL" | "INTEGER" | "NUMERIC"
): ICastOperator => {
  if (
    !["NONE", "TEXT", "REAL", "INTEGER", "NUMERIC"].includes(
      typeName.toUpperCase()
    )
  ) {
    throw new Error(`Unknown type '${typeName}' to cast`);
  }

  return {
    __state: {
      left: expr,
      typeName,
    },
    type: TokenType.Cast,
    toSql() {
      return sql`CAST (${this.__state.left} AS ${sql.strip(
        this.__state.typeName
      )})`;
    },
  };
};

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it("works", () => {
    expect(cast(sql`kek.user`, "TEXT").toSql().preparedQuery).toEqual({
      text: "CAST (kek.user AS TEXT)",
      values: [],
    });

    expect(
      () =>
        cast(sql`kek.user`, "TEXT' SELECT * FROM" as "TEXT").toSql()
          .preparedQuery
    ).toThrowError(`Unknown type 'TEXT' SELECT * FROM' to cast`);
  });
}
