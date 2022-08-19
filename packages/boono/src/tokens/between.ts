import { IPrimitiveValue, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../types";
import { toToken } from "./rawSql";
import { wrapParentheses } from "./utils";

export interface IBetweenOperator extends IBaseToken<TokenType.Between> {
  __state: {
    base: IBaseToken | ISqlAdapter | IPrimitiveValue;
    left: IBaseToken | ISqlAdapter | IPrimitiveValue;
    right: IBaseToken | ISqlAdapter | IPrimitiveValue;
    not: boolean;
  };
}

const buildBetween = (
  base: IBaseToken | ISqlAdapter | IPrimitiveValue,
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue,
  not: boolean
): IBetweenOperator => {
  return {
    type: TokenType.Between,
    __state: {
      base,
      left,
      right,
      not,
    },
    toSql() {
      return sql.join(
        [
          wrapParentheses(toToken(this.__state.base)),
          this.__state.not ? sql`NOT` : sql.empty,
          sql`BETWEEN`,
          wrapParentheses(toToken(this.__state.left)),
          sql`AND`,
          wrapParentheses(toToken(this.__state.right)),
        ],
        " "
      );
    },
  };
};

export const between = (
  base: IBaseToken | ISqlAdapter | IPrimitiveValue,
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return buildBetween(base, left, right, false);
};
export const between$ = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return (base: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    buildBetween(base, left, right, false);
};

export const notBetween = (
  base: IBaseToken | ISqlAdapter | IPrimitiveValue,
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return buildBetween(base, left, right, true);
};
export const notBetween$ = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return (base: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    buildBetween(base, left, right, true);
};
