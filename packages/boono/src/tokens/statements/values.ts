import { IPrimitiveValue, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";
import {
  except,
  ICompoundTrait,
  intersect,
  union,
  unionAll,
  withoutCompound,
} from "../compounds";
import { ICTETrait, With, withoutWith, withRecursive } from "../cte";
import {
  buildInitialLimitOffset,
  ILimitOffsetTrait,
  limit,
  offset,
  withoutLimit,
  withoutOffset,
} from "../limitOffset";
import {
  IOrderTrait,
  orderBy,
  orderByTrait,
  withoutOrderTrait,
} from "../order";

export interface IValuesStatement
  extends IBaseToken<TokenType.Values>,
    IOrderTrait,
    ICompoundTrait,
    ILimitOffsetTrait,
    ICTETrait {
  __state: {
    values: (IBaseToken | ISqlAdapter | IPrimitiveValue)[][];
  } & IOrderTrait["__state"] &
    ICompoundTrait["__state"] &
    ILimitOffsetTrait["__state"] &
    ICTETrait["__state"];
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
      limitOffsetValue: buildInitialLimitOffset(),
    },

    orderBy: orderByTrait,
    withoutOrder: withoutOrderTrait,

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
