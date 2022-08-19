import { ISql, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../types";
import { and, conditionValuesToToken, IConditionValue } from "./binary";
import {
  IOrdersBoxTerm,
  IOrderTrait,
  orderBy,
  orderByTrait,
  withoutOrderTrait,
} from "./order";
import { toToken } from "./rawSql";

export interface IWindowClause extends IBaseToken<TokenType.WindowFn> {
  __state: {
    fn: ISqlAdapter;
    filterValue?: IBaseToken<TokenType>;
    overValue?: IBaseToken<TokenType.WindowBody>;
  };

  filter(...values: IConditionValue[]): this;
  over(arg?: IBaseToken<TokenType>): this;
}

export const windowFn = (fn: ISqlAdapter | IBaseToken): IWindowClause => {
  return {
    __state: {
      fn,
    },
    type: TokenType.WindowFn,
    filter(...values) {
      const finalValues = this.__state.filterValue
        ? [this.__state.filterValue, ...conditionValuesToToken(values)]
        : conditionValuesToToken(values);

      if (finalValues.length > 1) {
        return {
          ...this,
          __state: {
            ...this.__state,
            filterValue: and(...finalValues),
          },
        };
      } else {
        return {
          ...this,
          __state: { ...this.__state, filterValue: finalValues[0] },
        };
      }
    },
    over(body?: IWindowBodyClause) {
      return { ...this, __state: { ...this.__state, overValue: body } };
    },
    toSql() {
      return sql.join(
        [
          this.__state.fn,
          this.__state.filterValue
            ? sql`FILTER (WHERE ${this.__state.filterValue})`
            : sql.empty,
          sql`OVER`,
          this.__state.overValue ? sql`(${this.__state.overValue})` : sql`()`,
        ],
        " "
      );
    },
  };
};

export interface IWindowBodyClause
  extends IBaseToken<TokenType.WindowBody>,
    IOrderTrait {
  __state: {
    partitionByValues: (IBaseToken | ISql | string)[];
    baseWindowName?: string;
    ordersBox: IOrdersBoxTerm;
    frameValue?: IBaseToken | ISql;
  };
  fromBase(name: string): this;
  partitionBy(partitionBy: IBaseToken | ISql | string): this;
  withoutPartitionBy(): this;
  withFrame(sql: IBaseToken | ISql): this;
  withoutFrame(): this;
}

export const windowBody = (): IWindowBodyClause => {
  return {
    __state: {
      partitionByValues: [],
      ordersBox: orderBy(),
    },
    type: TokenType.WindowBody,
    fromBase(name: string) {
      return { ...this, __state: { ...this.__state, baseWindowName: name } };
    },
    orderBy: orderByTrait,
    withoutOrder: withoutOrderTrait,
    partitionBy(partitionBy: IBaseToken | ISql | string) {
      return {
        ...this,
        __state: {
          ...this.__state,
          partitionByValues: [...this.__state.partitionByValues, partitionBy],
        },
      };
    },
    withoutPartitionBy() {
      return { ...this, __state: { ...this.__state, partitionByValues: [] } };
    },
    withFrame(sql: IBaseToken | ISql) {
      return { ...this, __state: { ...this.__state, frameValue: sql } };
    },
    withoutFrame() {
      return { ...this, __state: { ...this.__state, frameValue: undefined } };
    },
    toSql() {
      return sql.join(
        [
          this.__state.baseWindowName
            ? sql.stripIdent(this.__state.baseWindowName)
            : sql.empty,
          this.__state.partitionByValues.length > 0
            ? sql`PARTITION BY ${sql.join(
                this.__state.partitionByValues.map((val) =>
                  typeof val === "string" ? sql.ident(val) : toToken(val)
                ),
                ", "
              )}`
            : sql.empty,
          this.__state.ordersBox,
          this.__state.frameValue ? this.__state.frameValue : sql.empty,
        ],
        " "
      );
    },
  };
};
