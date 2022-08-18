import { ISql, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, isToken, TokenType } from "../../types";
import { alias } from "../alias";
import {
  except,
  ICompoundState,
  intersect,
  union,
  unionAll,
  withoutCompound,
} from "../compounds";
import { ICTEState, With, withoutWith, withRecursive } from "../cte";
import { from, fromToSql, IFromState } from "../from";
import {
  IJoinState,
  join,
  joinCross,
  joinFull,
  joinFullNatural,
  joinFullNaturalOuter,
  joinFullOuter,
  joinInner,
  joinInnerNatural,
  joinLeft,
  joinLeftNatural,
  joinLeftNaturalOuter,
  joinLeftOuter,
  joinNatural,
  joinRight,
  joinRightNatural,
  joinRightNaturalOuter,
  joinRightOuter,
  withoutJoin,
} from "../join";
import {
  buildInitialLimitOffsetState,
  ILimitOffsetState,
  limit,
  offset,
  withoutLimit,
  withoutOffset,
} from "../limitOffset";
import {
  IOrderState,
  orderBy,
  orderByForState,
  withoutOrderForState,
} from "../order";
import { toToken } from "../rawSql";
import { IWhereState, orWhere, where } from "../where";
import { IValuesStatement } from "./values";

export const isSelect = (val: unknown): val is ISelectStatement => {
  return (
    val !== null &&
    typeof val === "object" &&
    (val as ISelectStatement).type === TokenType.Select
  );
};

export interface ISelectStatement
  extends IBaseToken<TokenType.Select>,
    IOrderState,
    ICompoundState,
    ILimitOffsetState,
    ICTEState,
    IWhereState,
    IFromState,
    IJoinState {
  __state: {
    definedWindowFunctions: {
      name: string;
      windowBody: IBaseToken<TokenType.WindowBody>;
    }[];

    distinctValue: boolean;

    selectValues: {
      toSelect: "*" | string | ISelectStatement | IBaseToken;
      alias?: string;
    }[];

    groupByValues: (IBaseToken | string)[];
    havingValue?: IBaseToken;
  } & IFromState["__state"] &
    ILimitOffsetState["__state"] &
    ICTEState["__state"] &
    IJoinState["__state"] &
    IOrderState["__state"] &
    ICompoundState["__state"] &
    IWhereState["__state"];

  defineWindow(
    name: string,
    body: IBaseToken<TokenType.WindowBody>
  ): ISelectStatement;
  withoutDefinedWindows(): ISelectStatement;

  distinct(val: boolean): ISelectStatement;
  select(...args: ISelectArgType[]): ISelectStatement;

  groupBy(...values: (IBaseToken | ISqlAdapter | string)[]): ISelectStatement;
  having(val: IBaseToken | ISqlAdapter): ISelectStatement;
}

type ISelectArgType =
  | "*"
  | string
  | ISqlAdapter
  | ISelectStatement
  | IValuesStatement
  | { [key: string]: ISqlAdapter | string | ISelectStatement }
  | IBaseToken;

const selectArgsToValues = (
  args: ISelectArgType[]
): ISelectStatement["__state"]["selectValues"] => {
  if (args === null || args === undefined || args.length === 0)
    return [{ toSelect: "*" }];

  return args.flatMap((arg, i) => {
    if (arg === "*" && i === 0) return { toSelect: "*" };
    if (typeof arg === "string") return { toSelect: arg };
    if (isToken(arg) || sql.isSql(arg)) return { toSelect: toToken(arg) };

    return Object.entries(arg).map(([columnOrAs, aliasOrQuery]) =>
      typeof aliasOrQuery === "string"
        ? { toSelect: columnOrAs, alias: aliasOrQuery }
        : { toSelect: toToken(aliasOrQuery), alias: columnOrAs }
    );
  });
};

export const select = (...selectArgs: ISelectArgType[]): ISelectStatement => {
  return {
    type: TokenType.Select,
    __state: {
      compoundValues: [],
      ordersBox: orderBy(),
      definedWindowFunctions: [],
      distinctValue: false,
      selectValues: selectArgsToValues(selectArgs),
      groupByValues: [],
      joinValues: [],
      limitOffsetValue: buildInitialLimitOffsetState(),
      fromValues: [],
    },
    select(...selectArgs: ISelectArgType[]): ISelectStatement {
      return {
        ...this,
        __state: {
          ...this.__state,
          selectValues: [
            ...this.__state.selectValues,
            ...selectArgsToValues(selectArgs),
          ],
        },
      };
    },
    distinct(val: boolean): ISelectStatement {
      return {
        ...this,
        __state: {
          ...this.__state,
          distinctValue: val,
        },
      };
    },
    from,
    where,
    orWhere,
    limit,
    offset,
    withoutLimit,
    withoutOffset,
    groupBy(...values: (IBaseToken | ISql | string)[]): ISelectStatement {
      return {
        ...this,
        __state: {
          ...this.__state,
          groupByValues: values.map((val) =>
            typeof val === "string" ? val : toToken(val)
          ),
        },
      };
    },
    having(val: IBaseToken | ISql): ISelectStatement {
      return {
        ...this,
        __state: { ...this.__state, havingValue: toToken(val) },
      };
    },
    orderBy: orderByForState,
    withoutOrder: withoutOrderForState,

    defineWindow(name: string, body: IBaseToken<TokenType.WindowBody>) {
      return {
        ...this,
        __state: {
          ...this.__state,
          definedWindowFunctions: [
            ...this.__state.definedWindowFunctions,
            {
              name: name,
              windowBody: body,
            },
          ],
        },
      };
    },
    withoutDefinedWindows() {
      return {
        ...this,
        __state: {
          ...this.__state,
          definedWindowFunctions: [],
        },
      };
    },

    with: With,
    withoutWith,
    withRecursive,

    union,
    unionAll,
    intersect,
    except,
    withoutCompound,

    withoutJoin,

    join,
    joinCross,

    joinNatural,

    joinLeft,
    joinLeftOuter,
    joinLeftNatural: joinLeftNatural,
    joinLeftNaturalOuter: joinLeftNaturalOuter,

    joinRight,
    joinRightOuter,
    joinRightNatural: joinRightNatural,
    joinRightNaturalOuter: joinRightNaturalOuter,

    joinFull,
    joinFullOuter,
    joinFullNatural: joinFullNatural,
    joinFullNaturalOuter: joinFullNaturalOuter,

    joinInner,
    joinInnerNatural: joinInnerNatural,

    toSql() {
      return sql.join(
        [
          this.__state.cteValue ? this.__state.cteValue : null,
          sql`SELECT`,
          this.__state.distinctValue ? sql`DISTINCT` : null,
          sql.join(
            this.__state.selectValues.map((val) => {
              if (val.toSelect === "*") {
                return sql`*`;
              } else if (typeof val.toSelect === "string" && !val.alias) {
                return sql.liter(val.toSelect);
              } else {
                return val.alias
                  ? alias(val.toSelect, val.alias)
                  : val.toSelect;
              }
            })
          ),
          this.__state.fromValues.length > 0 ||
          this.__state.joinValues.length > 0
            ? sql`FROM`
            : null,
          fromToSql(this),
          this.__state.joinValues.length > 0
            ? sql.join(
                this.__state.joinValues.map((expr) => expr.toSql()),
                " "
              )
            : null,
          this.__state.whereValue
            ? sql`WHERE ${this.__state.whereValue}`
            : null,
          this.__state.groupByValues.length > 0
            ? sql`GROUP BY ${sql.join(
                this.__state.groupByValues.map((val) =>
                  typeof val === "string" ? sql.liter(val) : val
                )
              )}`
            : null,
          this.__state.groupByValues.length > 0 && this.__state.havingValue
            ? sql`HAVING ${this.__state.havingValue}`
            : null,
          ...(this.__state.definedWindowFunctions.length > 0
            ? [
                sql`WINDOW`,
                sql.join(
                  this.__state.definedWindowFunctions.map(
                    ({ name, windowBody }) =>
                      sql`${sql.strip(name)} AS (${windowBody})`
                  ),
                  ", "
                ),
              ]
            : []),
          this.__state.compoundValues.length > 0
            ? sql.join(this.__state.compoundValues, " ")
            : null,
          this.__state.ordersBox,
          this.__state.limitOffsetValue.toSql().isEmpty
            ? null
            : this.__state.limitOffsetValue,
        ].filter((v) => v),
        " "
      );
    },
  };
};
