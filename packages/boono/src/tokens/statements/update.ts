import {
  IContainsTable,
  IPrimitiveValue,
  ISqlAdapter,
  sql,
} from "@kikko-land/sql";

import { IBaseToken, isToken, TokenType } from "../../types";
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
  IOrReplaceState,
  orAbort,
  orFail,
  orIgnore,
  orReplace,
  orRollback,
} from "../orReplace";
import { buildRawSql } from "../rawSql";
import {
  IReturningState,
  returning,
  returningForState,
  withoutReturningForState,
} from "../returning";
import { wrapParentheses } from "../utils";
import { IWhereState, orWhere, where } from "../where";
import { ISelectStatement } from "./select";
import { IValuesStatement } from "./values";

type ISetValue =
  | {
      columnName: string;
      toSet:
        | IBaseToken<TokenType.RawSql>
        | IPrimitiveValue
        | ISelectStatement
        | IValuesStatement;
    }
  | IBaseToken<TokenType.RawSql>;

export interface IUpdateStatement
  extends IBaseToken<TokenType.Update>,
    ICTEState,
    IWhereState,
    IFromState,
    IReturningState,
    IOrReplaceState,
    IJoinState {
  __state: {
    updateTable: IContainsTable;
    setValues: ISetValue[];
  } & IFromState["__state"] &
    IOrReplaceState["__state"] &
    IJoinState["__state"] &
    IReturningState["__state"] &
    ICTEState["__state"] &
    IWhereState["__state"];

  set(...args: ISetArgType[]): IUpdateStatement;
}

type ISetArgType =
  | ISqlAdapter
  | {
      [key: string]:
        | ISqlAdapter
        | IBaseToken<TokenType.RawSql>
        | IPrimitiveValue
        | ISelectStatement
        | IValuesStatement;
    }
  | IBaseToken<TokenType.RawSql>;

export const update = (tbl: string | IContainsTable): IUpdateStatement => {
  return {
    type: TokenType.Update,
    __state: {
      updateTable: typeof tbl === "string" ? sql.table(tbl) : tbl,
      setValues: [],
      returningValue: returning(),
      joinValues: [],
      fromValues: [],
    },

    with: With,
    withoutWith,
    withRecursive,

    from,

    where,
    orWhere,

    returning: returningForState,
    withoutReturning: withoutReturningForState,

    orAbort,
    orFail,
    orIgnore,
    orReplace,
    orRollback,

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

    set(...args: ISetArgType[]): IUpdateStatement {
      const vals = args.flatMap((m): ISetValue | ISetValue[] => {
        if (isToken(m)) {
          return m;
        } else if (sql.isSql(m)) {
          return buildRawSql(m);
        } else {
          return Object.entries(m).map(([key, val]) => {
            return {
              columnName: key,
              toSet: !isToken(val) && sql.isSql(val) ? buildRawSql(val) : val,
            };
          });
        }
      });

      return {
        ...this,
        __state: {
          ...this.__state,
          setValues: [...this.__state.setValues, ...vals],
        },
      };
    },

    toSql() {
      return sql.join(
        [
          this.__state.cteValue ? this.__state.cteValue : null,
          sql`UPDATE`,
          this.__state.orReplaceValue
            ? sql`OR ${sql.raw(this.__state.orReplaceValue)}`
            : null,
          this.__state.updateTable,
          sql`SET`,
          sql.join(
            this.__state.setValues.map((val) =>
              isToken(val)
                ? val
                : sql`${sql.liter(val.columnName)} = ${wrapParentheses(
                    val.toSet
                  )}`
            )
          ),
          this.__state.fromValues.length > 0 ||
          this.__state.joinValues.length > 0
            ? sql`FROM`
            : null,
          fromToSql(this),
          this.__state.joinValues.length > 0
            ? sql.join(
                this.__state.joinValues.map((expr) => expr.toSql()),
                " "
              )
            : null,
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
