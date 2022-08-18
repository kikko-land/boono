import { IPrimitiveValue, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";
import {
  except,
  ICompoundState,
  intersect,
  union,
  unionAll,
  withoutCompound,
} from "../compounds";
import { ICTEState, With, withoutWith, withRecursive } from "../cte";
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

export interface IValuesStatement
  extends IBaseToken<TokenType.Values>,
    IOrderState,
    ICompoundState,
    ILimitOffsetState,
    ICTEState {
  __state: {
    values: (IBaseToken | ISqlAdapter | IPrimitiveValue)[][];
  } & IOrderState["__state"] &
    ICompoundState["__state"] &
    ILimitOffsetState["__state"] &
    ICTEState["__state"];
}

export const values = (
  ...vals: (IBaseToken | ISqlAdapter | IPrimitiveValue)[][]
): IValuesStatement => {
  return {
    type: TokenType.Values,
    __state: {
      compoundValues: [],
      ordersBox: orderBy(),
      values: vals,
      limitOffsetValue: buildInitialLimitOffsetState(),
    },

    orderBy: orderByForState,
    withoutOrder: withoutOrderForState,

    union,
    unionAll,
    intersect,
    except,
    withoutCompound,

    limit,
    withoutLimit,
    offset,
    withoutOffset,

    withoutWith,
    withRecursive,
    with: With,
    toSql() {
      return sql.join(
        [
          this.__state.cteValue ? this.__state.cteValue : null,
          sql`VALUES ${sql.join(
            this.__state.values.map((val) => sql`(${sql.join(val)})`)
          )}`,
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

export const isValues = (val: unknown): val is IValuesStatement => {
  return (
    val !== null &&
    typeof val === "object" &&
    (val as IValuesStatement).type === TokenType.Values
  );
};
