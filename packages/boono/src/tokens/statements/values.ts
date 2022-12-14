import { IPrimitiveValue, ISqlAdapter, sql } from "@kikko-land/boono-sql";

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
  IOrdersBoxTerm,
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
    ordersBox: IOrdersBoxTerm;
    values: (IBaseToken | ISqlAdapter | IPrimitiveValue)[][];
  };
}

export const values = (
  ...vals: (IBaseToken | ISqlAdapter | IPrimitiveValue)[][]
): IValuesStatement => {
  return {
    type: TokenType.Values,
    __state: {
      ordersBox: orderBy(),
      values: vals,
    },
    _compoundValues: [],
    _limitOffsetValue: buildInitialLimitOffsetState(),

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
          this._cteValue ? this._cteValue : null,
          sql`VALUES ${sql.join(
            this.__state.values.map((val) => sql`(${sql.join(val)})`)
          )}`,
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

export const isValues = (val: unknown): val is IValuesStatement => {
  return (
    val !== null &&
    typeof val === "object" &&
    (val as IValuesStatement).type === TokenType.Values
  );
};
