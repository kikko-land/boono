import { IContainsTable, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";
import { ICTETrait, With, withoutWith, withRecursive } from "../cte";
import {
  IReturningTrait,
  returning,
  returningTrait,
  withoutReturningTrait,
} from "../returning";
import { IWhereTrait, orWhere, where } from "../where";

export interface IDeleteStatement
  extends IBaseToken<TokenType.Delete>,
    ICTETrait,
    IWhereTrait,
    IReturningTrait {
  readonly __state: Readonly<
    {
      deleteTable: IContainsTable;
    } & IReturningTrait["__state"] &
      ICTETrait["__state"] &
      IWhereTrait["__state"]
  >;
}

export const deleteFrom = (tbl: string | IContainsTable): IDeleteStatement => {
  return {
    type: TokenType.Delete,
    __state: {
      deleteTable: typeof tbl === "string" ? sql.table(tbl) : tbl,
      returningValue: returning(),
    },

    with: With,
    withoutWith,
    withRecursive,

    where,
    orWhere,

    returning: returningTrait,
    withoutReturning: withoutReturningTrait,

    toSql() {
      return sql.join(
        [
          this.__state.cteValue ? this.__state.cteValue : null,
          sql`DELETE FROM ${this.__state.deleteTable}`,
          this.__state.whereValue
            ? sql`WHERE ${this.__state.whereValue}`
            : null,
          this.__state.returningValue,
        ].filter((v) => v),
        " "
      );
    },
  };
};
