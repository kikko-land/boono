import { IPrimitiveValue, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../types";
import { toToken } from "./rawSql";
import { wrapParentheses } from "./utils";

export interface ILimitOffsetTerm
  extends IBaseToken<TokenType.LimitOffsetTerm> {
  readonly __state: Readonly<{
    limitValue?: IBaseToken;
    offsetValue?: IBaseToken;
  }>;
}

export interface ILimitOffsetTrait {
  readonly __state: Readonly<{
    limitOffsetValue: ILimitOffsetTerm;
  }>;

  readonly limit: typeof limit;
  readonly offset: typeof offset;
  readonly withoutLimit: typeof withoutLimit;
  readonly withoutOffset: typeof withoutOffset;
}

export const buildInitialLimitOffset = (): ILimitOffsetTerm => {
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

export function limit<T extends ILimitOffsetTrait>(
  this: T,
  val: IBaseToken | ISqlAdapter | IPrimitiveValue
): T {
  const state: ILimitOffsetTrait["__state"] = {
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

export function withoutLimit<T extends ILimitOffsetTrait>(this: T): T {
  const state: ILimitOffsetTrait["__state"] = {
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

export function offset<T extends ILimitOffsetTrait>(
  this: T,
  val: IBaseToken | ISqlAdapter | IPrimitiveValue
): T {
  const state: ILimitOffsetTrait["__state"] = {
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

export function withoutOffset<T extends ILimitOffsetTrait>(this: T): T {
  const state: ILimitOffsetTrait["__state"] = {
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
