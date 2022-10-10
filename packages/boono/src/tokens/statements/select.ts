import { ISql, ISqlAdapter, sql } from "@kikko-land/boono-sql";

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
  IOrdersBoxTerm,
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
    ordersBox: IOrdersBoxTerm;
    definedWindowFunctions: {
      name: string;
      windowBody: IBaseToken<TokenType.WindowBody>;
    }[];
  };
  _distinctValue: boolean;

  _selectValues: {
    toSelect: "*" | string | ISelectStatement | IBaseToken;
    alias?: string;
  }[];

  _groupByValues: (IBaseToken | string)[];
  _havingValue?: IBaseToken;

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
): ISelectStatement["_selectValues"] => {
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
      ordersBox: orderBy(),
      definedWindowFunctions: [],
    },
    _fromValues: [],
    _selectValues: selectArgsToValues(selectArgs),
    _distinctValue: false,
    _groupByValues: [],
    _compoundValues: [],
    _joinValues: [],
    _limitOffsetValue: buildInitialLimitOffsetState(),
    select(...selectArgs: ISelectArgType[]): ISelectStatement {
      return {
        ...this,
        _selectValues: [
          ...this._selectValues,
          ...selectArgsToValues(selectArgs),
        ],
      };
    },
    distinct(val: boolean): ISelectStatement {
      return {
        ...this,
        _distinctValue: val,
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
        _groupByValues: values.map((val) =>
          typeof val === "string" ? val : toToken(val)
        ),
      };
    },
    having(val: IBaseToken | ISql): ISelectStatement {
      return { ...this, _havingValue: toToken(val) };
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
          this._cteValue ? this._cteValue : null,
          sql`SELECT`,
          this._distinctValue ? sql`DISTINCT` : null,
          sql.join(
            this._selectValues.map((val) => {
              if (val.toSelect === "*") {
                return sql`*`;
              } else if (typeof val.toSelect === "string") {
                return sql.liter(val.toSelect);
              } else {
                return val.alias
                  ? alias(val.toSelect, val.alias)
                  : val.toSelect;
              }
            })
          ),
          this._fromValues.length > 0 || this._joinValues.length > 0
            ? sql`FROM`
            : null,
          fromToSql(this),
          this._joinValues.length > 0
            ? sql.join(
                this._joinValues.map((expr) => expr.toSql()),
                " "
              )
            : null,
          this._whereValue ? sql`WHERE ${this._whereValue}` : null,
          this._groupByValues.length > 0
            ? sql`GROUP BY ${sql.join(
                this._groupByValues.map((val) =>
                  typeof val === "string" ? sql.liter(val) : val
                )
              )}`
            : null,
          this._groupByValues.length > 0 && this._havingValue
            ? sql`HAVING ${this._havingValue}`
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
          this._compoundValues.length > 0
            ? sql.join(this._compoundValues, " ")
            : null,
          this.__state.ordersBox,
          this._limitOffsetValue.toSql().isEmpty
            ? null
            : this._limitOffsetValue,
        ].filter((v) => v),
        " "
      );
    },
  };
};
