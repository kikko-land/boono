import { IContainsTable, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";
import { ICTEState, With, withoutWith, withRecursive } from "../cte";
import {
  IReturningState,
  returning,
  returningForState,
  withoutReturningForState,
} from "../returning";
import { IWhereState, orWhere, where } from "../where";

export interface IDeleteStatement
  extends IBaseToken<TokenType.Delete>,
    ICTEState,
    IWhereState,
    IReturningState {
  __state: {
    deleteTable: IContainsTable;
  } & IReturningState["__state"] &
    ICTEState["__state"] &
    IWhereState["__state"];
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

    returning: returningForState,
    withoutReturning: withoutReturningForState,

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
