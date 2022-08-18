import {
  IContainsTable,
  IPrimitiveValue,
  ISqlAdapter,
  sql,
} from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../types";
import { toToken } from "./rawSql";
import { wrapParentheses } from "./utils";

export type IAlias = IBaseToken<TokenType.Alias> & {
  __state: {
    left: IBaseToken;
    right: string;
  };
};

export const alias = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue | IContainsTable,
  right: string
): IAlias => {
  return {
    type: TokenType.Alias,
    __state: {
      left: toToken(left),
      right: right,
    },
    toSql() {
      return sql`${wrapParentheses(this.__state.left)} AS ${sql.liter(
        this.__state.right
      )}`;
    },
  };
};
