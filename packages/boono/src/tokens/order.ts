import { ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../types";
import { toToken } from "./rawSql";

export interface IOrderTerm extends IBaseToken<TokenType.OrderTerm> {
  _orderType: "DESC" | "ASC";
  _val: IBaseToken | string;
  _nullOrder?: "NULLS FIRST" | "NULLS LAST";
}

const orderTerm = (
  type: IOrderTerm["_orderType"],
  val: IBaseToken | ISqlAdapter | string,
  nullOrder: IOrderTerm["_nullOrder"]
): IOrderTerm => {
  return {
    type: TokenType.OrderTerm,
    _orderType: type,
    _val: typeof val === "string" ? val : toToken(val),
    _nullOrder: nullOrder,
    toSql() {
      return sql.join(
        [
          typeof this._val === "string" ? sql.liter(this._val) : this._val,
          sql.raw(this._orderType),
          nullOrder ? sql.raw(nullOrder) : sql.empty,
        ],
        " "
      );
    },
  };
};

export interface IOrdersBoxTerm extends IBaseToken<TokenType.OrdersBoxTerm> {
  _values: IOrderTerm[];
}

export const orderBy = (...args: IOrderTerm[]): IOrdersBoxTerm => {
  return {
    _values: args,
    type: TokenType.OrdersBoxTerm,
    toSql() {
      return this._values.length > 0
        ? sql.join([sql`ORDER BY`, sql.join(this._values)], " ")
        : sql.empty;
    },
  };
};

export const desc = (
  val: IBaseToken | ISqlAdapter | string,
  nullOrder?: "NULLS FIRST" | "NULLS LAST"
) => {
  return orderTerm("DESC", val, nullOrder);
};

export const asc = (
  val: IBaseToken | ISqlAdapter | string,
  nullOrder?: "NULLS FIRST" | "NULLS LAST"
) => {
  return orderTerm("ASC", val, nullOrder);
};

export interface IOrderState {
  _ordersBox: IOrdersBoxTerm;

  orderBy: typeof orderByForState;
  withoutOrder: typeof withoutOrderForState;
}

export function orderByForState<T extends IOrderState>(
  this: T,
  ...orderTerm: IOrderTerm[]
): T {
  return {
    ...this,
    _ordersBox: {
      ...this._ordersBox,
      _values: [...this._ordersBox._values, ...orderTerm],
    },
  };
}

export function withoutOrderForState<T extends IOrderState>(this: T): T {
  return {
    ...this,
    _ordersBox: {
      ...this._ordersBox,
      _values: [],
    },
  };
}
