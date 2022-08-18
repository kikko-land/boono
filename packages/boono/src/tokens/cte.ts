import { ISql, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../types";
import { buildRawSql } from "./rawSql";
import { ISelectStatement } from "./statements/select";
import { IValuesStatement } from "./statements/values";

export interface ICTETerm extends IBaseToken<TokenType.CTE> {
  __state: {
    recursive: boolean;
    values: {
      table: string;
      columns: string[];
      select:
        | ISelectStatement
        | IValuesStatement
        | IBaseToken<TokenType.RawSql>;
    }[];
  };
}

export interface ICTETrait {
  __state: {
    cteValue?: ICTETerm;
  };

  with: typeof With;
  withRecursive: typeof withRecursive;
  withoutWith: typeof withoutWith;
}

const cteTerm = (args: {
  table: string;
  columns: string[];
  recursive: boolean;
  select: ISelectStatement | IValuesStatement | IBaseToken<TokenType.RawSql>;
}): ICTETerm => {
  return {
    type: TokenType.CTE,
    __state: {
      recursive: args.recursive,
      values: [
        {
          table: args.table,
          columns: args.columns,
          select: args.select,
        },
      ],
    },
    toSql() {
      return sql.join(
        [
          sql`WITH`,
          this.__state.recursive ? sql`RECURSIVE` : null,
          sql.join(
            this.__state.values.map(
              (v) =>
                sql`${sql.liter(v.table)}(${sql.join(
                  v.columns.map(sql.liter)
                )}) AS (${v.select})`
            )
          ),
        ].filter((b) => b),
        " "
      );
    },
  };
};

const cteTermToken = <T extends ICTETrait>(
  current: T,
  args: {
    table: string;
    columns: string[];
    recursive: boolean;
    select: ISelectStatement | IValuesStatement | ISql;
  }
): T => {
  if (
    current.__state.cteValue?.__state.recursive === true &&
    args.recursive === false
  ) {
    throw new Error("WITH is already recursive");
  }

  if (
    current.__state.cteValue?.__state.recursive === false &&
    args.recursive === true
  ) {
    throw new Error("WITH is not recursive");
  }

  const newState: ICTETrait["__state"] = {
    ...current.__state,
    cteValue: current.__state.cteValue
      ? {
          ...current.__state.cteValue,
          __state: {
            ...current.__state.cteValue.__state,
            values: [
              ...current.__state.cteValue.__state.values,
              {
                table: args.table,
                columns: args.columns,
                select: sql.isSql(args.select)
                  ? buildRawSql(args.select)
                  : args.select,
              },
            ],
          },
        }
      : cteTerm({
          table: args.table,
          columns: args.columns,
          recursive: args.recursive,
          select: sql.isSql(args.select)
            ? buildRawSql(args.select)
            : args.select,
        }),
  };

  return {
    ...current,
    __state: newState,
  };
};

export function With<T extends ICTETrait>(
  this: T,
  args: {
    table: string;
    columns: string[];
    select: ISelectStatement | IValuesStatement | ISql;
  }
): T {
  return cteTermToken(this, { ...args, recursive: false });
}

export function withRecursive<T extends ICTETrait>(
  this: T,
  args: {
    table: string;
    columns: string[];
    select: ISelectStatement | IValuesStatement | ISql;
  }
): T {
  return cteTermToken(this, { ...args, recursive: true });
}

export function withoutWith<T extends ICTETrait>(this: T): T {
  const newState: ICTETrait["__state"] = {
    ...this.__state,
    cteValue: undefined,
  };

  return { ...this, __state: newState };
}
