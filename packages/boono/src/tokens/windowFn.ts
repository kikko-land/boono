import { ISql, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../types";
import { and, conditionValuesToToken, IConditionValue } from "./binary";
import {
  IOrderState,
  orderBy,
  orderByForState,
  withoutOrderForState,
} from "./order";
import { toToken } from "./rawSql";

export interface IWindowClause extends IBaseToken<TokenType.WindowFn> {
  _fn: ISqlAdapter;
  _filterValue?: IBaseToken<TokenType>;
  _overValue?: IBaseToken<TokenType.WindowBody>;

  filter(...values: IConditionValue[]): this;
  over(arg?: IBaseToken<TokenType>): this;
}

export const windowFn = (fn: ISqlAdapter | IBaseToken): IWindowClause => {
  return {
    _fn: fn,
    type: TokenType.WindowFn,
    filter(...values) {
      const finalValues = this._filterValue
        ? [this._filterValue, ...conditionValuesToToken(values)]
        : conditionValuesToToken(values);

      if (finalValues.length > 1) {
        return {
          ...this,
          _filterValue: and(...finalValues),
        };
      } else {
        return { ...this, _filterValue: finalValues[0] };
      }
    },
    over(body?: IWindowBodyClause) {
      return { ...this, _overValue: body };
    },
    toSql() {
      return sql.join(
        [
          this._fn,
          this._filterValue
            ? sql`FILTER (WHERE ${this._filterValue})`
            : sql.empty,
          sql`OVER`,
          this._overValue ? sql`(${this._overValue})` : sql`()`,
        ],
        " "
      );
    },
  };
};

export interface IWindowBodyClause
  extends IBaseToken<TokenType.WindowBody>,
    IOrderState {
  _partitionByValues: (IBaseToken | ISql | string)[];
  _baseWindowName?: string;
  fromBase(name: string): this;
  partitionBy(partitionBy: IBaseToken | ISql | string): this;
  withoutPartitionBy(): this;
  // _fn: ISqlAdapter;
  // _filterValue?: IBaseToken<TokenType>;
  // _overValue?: IBaseToken<TokenType.WindowBody>;
  // filter(...values: IConditionValue[]): this;
  // over(arg: IBaseToken<TokenType>): this;
}

export const windowBody = (): IWindowBodyClause => {
  return {
    _partitionByValues: [],
    _ordersBox: orderBy(),
    type: TokenType.WindowBody,
    fromBase(name: string) {
      return { ...this, _baseWindowName: name };
    },
    orderBy: orderByForState,
    withoutOrder: withoutOrderForState,
    partitionBy(partitionBy: IBaseToken | ISql | string) {
      return {
        ...this,
        _partitionByValues: [...this._partitionByValues, partitionBy],
      };
    },
    withoutPartitionBy() {
      return { ...this, _partitionByValues: [] };
    },
    toSql() {
      return sql.join(
        [
          this._baseWindowName ? sql.strip(this._baseWindowName) : sql.empty,
          this._partitionByValues.length > 0
            ? sql`PARTITION BY ${sql.join(
                this._partitionByValues.map((val) =>
                  typeof val === "string" ? sql.liter(val) : toToken(val)
                ),
                ", "
              )}`
            : sql.empty,
          this._ordersBox,
        ],
        " "
      );
    },
  };
};
