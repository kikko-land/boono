import {
  IContainsTable,
  IPrimitiveValue,
  ISql,
  ISqlAdapter,
  sql,
} from "@kikko-land/sql";

import { IBaseToken, isToken, TokenType } from "../types";
import { isBinaryOperator } from "./exprs/binary";

export const wrapParentheses = <
  T extends IBaseToken | ISqlAdapter | IPrimitiveValue | IContainsTable
>(
  val: T
): T | ISql =>
  (isBinaryOperator(val) && val.__state.operator === "OR") ||
  (isToken(val) &&
    (val.type === TokenType.Select || val.type === TokenType.Values))
    ? sql`(${val})`
    : val;
