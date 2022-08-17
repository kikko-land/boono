import { ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../types";
import { toToken } from "./rawSql";

export interface IOrderTerm extends IBaseToken<TokenType.OrderTerm> {
  __state: {
    orderType: "DESC" | "ASC";
    val: IBaseToken | string;
    nullOrder?: "NULLS FIRST" | "NULLS LAST";
  };
}

const orderTerm = (
  type: IOrderTerm["__state"]["orderType"],
  val: IBaseToken | ISqlAdapter | string,
  nullOrder: IOrderTerm["__state"]["nullOrder"]
): IOrderTerm => {
  return {
    type: TokenType.OrderTerm,
    __state: {
      orderType: type,
      val: typeof val === "string" ? val : toToken(val),
      nullOrder: nullOrder,
    },
    toSql() {
      return sql.join(
        [
          typeof this.__state.val === "string"
            ? sql.liter(this.__state.val)
            : this.__state.val,
          sql.raw(this.__state.orderType),
          nullOrder ? sql.raw(nullOrder) : sql.empty,
        ],
        " "
      );
    },
  };
};

export interface IOrdersBoxTerm extends IBaseToken<TokenType.OrdersBoxTerm> {
  __state: {
    values: IOrderTerm[];
  };
}

export const orderBy = (...args: IOrderTerm[]): IOrdersBoxTerm => {
  return {
    __state: {
      values: args,
    },
    type: TokenType.OrdersBoxTerm,
    toSql() {
      return this.__state.values.length > 0
        ? sql.join([sql`ORDER BY`, sql.join(this.__state.values)], " ")
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
  __state: {
    ordersBox: IOrdersBoxTerm;
  };

  orderBy: typeof orderByForState;
  withoutOrder: typeof withoutOrderForState;
}

export function orderByForState<T extends IOrderState>(
  this: T,
  ...orderTerm: IOrderTerm[]
): T {
  return {
    ...this,
    __state: {
      ...this.__state,
      ordersBox: {
        ...this.__state.ordersBox,
        __state: {
          ...this.__state.ordersBox.__state,
          values: [...this.__state.ordersBox.__state.values, ...orderTerm],
        },
      },
    },
  };
}

export function withoutOrderForState<T extends IOrderState>(this: T): T {
  return {
    ...this,
    __state: {
      ...this.__state,
      ordersBox: {
        ...this.__state.ordersBox,
        __state: {
          ...this.__state.ordersBox.__state,
          values: [],
        },
      },
    },
  };
}
