import { IPrimitiveValue, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../types";
import { toToken } from "./rawSql";
import { wrapParentheses } from "./utils";

export interface ILimitOffsetTerm
  extends IBaseToken<TokenType.LimitOffsetTerm> {
  __state: {
    limitValue?: IBaseToken;
    offsetValue?: IBaseToken;
  };
}

export interface ILimitOffsetState {
  __state: {
    limitOffsetValue: ILimitOffsetTerm;
  };

  limit: typeof limit;
  offset: typeof offset;
  withoutLimit: typeof withoutLimit;
  withoutOffset: typeof withoutOffset;
}

export const buildInitialLimitOffsetState = (): ILimitOffsetTerm => {
  return {
    type: TokenType.LimitOffsetTerm,
    __state: {},
    toSql() {
      return this.__state.limitValue
        ? sql.join(
            [
              this.__state.limitValue
                ? sql`LIMIT ${wrapParentheses(this.__state.limitValue)}`
                : null,
              this.__state.offsetValue && this.__state.limitValue
                ? sql`OFFSET ${wrapParentheses(this.__state.offsetValue)}`
                : null,
            ].filter((v) => v),
            " "
          )
        : sql.empty;
    },
  };
};

export function limit<T extends ILimitOffsetState>(
  this: T,
  val: IBaseToken | ISqlAdapter | IPrimitiveValue
): T {
  const state: ILimitOffsetState["__state"] = {
    ...this.__state,
    limitOffsetValue: {
      ...this.__state.limitOffsetValue,
      __state: {
        ...this.__state.limitOffsetValue.__state,
        limitValue: toToken(val),
      },
    },
  };

  return {
    ...this,
    __state: state,
  };
}

export function withoutLimit<T extends ILimitOffsetState>(this: T): T {
  const state: ILimitOffsetState["__state"] = {
    ...this.__state,
    limitOffsetValue: {
      ...this.__state.limitOffsetValue,
      __state: {
        ...this.__state.limitOffsetValue.__state,
        limitValue: undefined,
      },
    },
  };

  return {
    ...this,
    __state: state,
  };
}

export function offset<T extends ILimitOffsetState>(
  this: T,
  val: IBaseToken | ISqlAdapter | IPrimitiveValue
): T {
  const state: ILimitOffsetState["__state"] = {
    ...this.__state,
    limitOffsetValue: {
      ...this.__state.limitOffsetValue,
      __state: {
        ...this.__state.limitOffsetValue.__state,
        offsetValue: toToken(val),
      },
    },
  };

  return {
    ...this,
    __state: state,
  };
}

export function withoutOffset<T extends ILimitOffsetState>(this: T): T {
  const state: ILimitOffsetState["__state"] = {
    ...this.__state,
    limitOffsetValue: {
      ...this.__state.limitOffsetValue,
      __state: {
        ...this.__state.limitOffsetValue.__state,
        offsetValue: undefined,
      },
    },
  };

  return {
    ...this,
    __state: state,
  };
}
