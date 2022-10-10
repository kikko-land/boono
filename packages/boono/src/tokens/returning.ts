import { ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, isToken, TokenType } from "../types";
import { alias } from "./alias";
import { toToken } from "./rawSql";
import { ISelectStatement } from "./statements/select";

type IReturnValue = Readonly<{
  toSelect: "*" | string | ISelectStatement | IBaseToken;
  alias?: string;
}>;
export interface IReturningClause extends IBaseToken<TokenType.Returning> {
  readonly __state: {
    readonly values: IReturnValue[];
  };
}

type IReturningArg =
  | "*"
  | string
  | ISqlAdapter
  | IBaseToken
  | { [key: string]: ISqlAdapter | string | ISelectStatement };

export interface IReturningTrait {
  readonly __state: Readonly<{
    returningValue: IReturningClause;
  }>;

  readonly returning: typeof returningTrait;
  readonly withoutReturning: typeof withoutReturningTrait;
}

export const returning = (...args: IReturningArg[]): IReturningClause => {
  return {
    type: TokenType.Returning,
    __state: {
      values: args.flatMap((arg): IReturnValue | IReturnValue[] => {
        if (sql.isSql(arg) || isToken(arg)) {
          return { toSelect: toToken(arg) };
        } else if (typeof arg === "string") {
          return { toSelect: arg };
        } else {
          return Object.entries(arg).map(([columnOrAs, aliasOrQuery]) => {
            return typeof aliasOrQuery === "string"
              ? { toSelect: columnOrAs, alias: aliasOrQuery }
              : { toSelect: toToken(aliasOrQuery), alias: columnOrAs };
          });
        }
      }),
    },
    toSql() {
      return this.__state.values.length > 0
        ? sql`RETURNING ${sql.join(
            this.__state.values.map((val) => {
              if (val.toSelect === "*") {
                return sql`*`;
              } else {
                return val.alias
                  ? alias(val.toSelect, val.alias)
                  : val.toSelect;
              }
            })
          )}`
        : sql.empty;
    },
  };
};

export function returningTrait<T extends IReturningTrait>(
  this: T,
  ...args: IReturningArg[]
): T {
  const state: IReturningTrait["__state"] = {
    ...this.__state,
    returningValue: {
      ...this.__state.returningValue,
      __state: {
        ...this.__state.returningValue.__state,
        values: [
          ...this.__state.returningValue.__state.values,
          ...returning(...args).__state.values,
        ],
      },
    },
  };
  return {
    ...this,
    __state: state,
  };
}

export function withoutReturningTrait<T extends IReturningTrait>(this: T): T {
  const state: IReturningTrait["__state"] = {
    ...this.__state,
    returningValue: returning(),
  };

  return {
    ...this,
    __state: state,
  };
}
