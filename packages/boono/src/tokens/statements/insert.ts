import {
  IContainsTable,
  IPrimitiveValue,
  ISqlAdapter,
  sql,
} from "@kikko-land/sql";

import { IBaseToken, isToken, TokenType } from "../../types";
import { ICTEState, ICTETerm, With, withoutWith, withRecursive } from "../cte";
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
import { ISelectStatement, isSelect } from "./select";
import { isValues, IValuesStatement } from "./values";

// TODO: on conflict support
export interface IInsertStatement
  extends IBaseToken<TokenType.Insert>,
    ICTEState,
    IReturningState,
    IOrReplaceState {
  __state: {
    intoTable?: string | IContainsTable;
    columnNames: string[];

    toInsertValue?:
      | IValuesStatement
      | ISelectStatement
      | { columnName: string; value: IPrimitiveValue | IBaseToken }[][];
  } & ICTEState["__state"] &
    IReturningState["__state"] &
    IOrReplaceState["__state"];

  setColumnNames(columnNames: string[]): IInsertStatement;
  withoutColumnNames(): IInsertStatement;

  insert(arg: IInsertArg): IInsertStatement;
  withoutInsert(): IInsertStatement;

  withoutInto(): IInsertStatement;
  into(val: string | IContainsTable): IInsertStatement;
}

type IRecArg =
  | Record<string, IPrimitiveValue | IBaseToken | ISqlAdapter>
  | Record<string, IPrimitiveValue | IBaseToken | ISqlAdapter>[];
type IInsertArg = IValuesStatement | ISelectStatement | IRecArg;

const mapRecordArg = (arg: IRecArg) => {
  return (Array.isArray(arg) ? arg : [arg]).map((it) =>
    Object.entries(it).map(([columnName, value]) => {
      return {
        columnName,
        value: sql.isSql(value) && !isToken(value) ? buildRawSql(value) : value,
      };
    })
  );
};

const applyInsertArg = (
  state: IInsertStatement,
  arg: IInsertArg
): IInsertStatement => {
  if (
    state.__state.toInsertValue &&
    (isSelect(state.__state.toInsertValue) ||
      isValues(state.__state.toInsertValue))
  ) {
    throw new Error(
      "Insert value is already set. If you want to change insert values user resetInsert() before."
    );
  }

  if (isSelect(arg) || isValues(arg)) {
    return { ...state, __state: { ...state.__state, toInsertValue: arg } };
  }

  return {
    ...state,
    __state: {
      ...state.__state,
      toInsertValue: Array.isArray(state.__state.toInsertValue)
        ? [...state.__state.toInsertValue, ...mapRecordArg(arg)]
        : mapRecordArg(arg),
    },
  };
};

export const insert = (insertArg: IInsertArg): IInsertStatement => {
  return {
    type: TokenType.Insert,
    __state: {
      returningValue: returning(),
      columnNames: [],
      toInsertValue:
        isSelect(insertArg) || isValues(insertArg)
          ? insertArg
          : mapRecordArg(insertArg),
    },

    with: With,
    withRecursive,
    withoutWith,

    orAbort,
    orFail,
    orIgnore,
    orReplace,
    orRollback,

    returning: returningForState,
    withoutReturning: withoutReturningForState,

    setColumnNames(names: string[]): IInsertStatement {
      return { ...this, __state: { ...this.__state, columnNames: names } };
    },
    withoutColumnNames(): IInsertStatement {
      return { ...this, __state: { ...this.__state, columnNames: [] } };
    },

    insert(arg: IInsertArg): IInsertStatement {
      return applyInsertArg(this, arg);
    },
    withoutInsert(): IInsertStatement {
      return {
        ...this,
        __state: { ...this.__state, toInsertValue: undefined },
      };
    },

    into(val: string | IContainsTable): IInsertStatement {
      return {
        ...this,
        __state: {
          ...this.__state,
          intoTable: typeof val === "string" ? sql.table(val) : val,
        },
      };
    },
    withoutInto(): IInsertStatement {
      return { ...this, __state: { ...this.__state, intoTable: undefined } };
    },

    toSql() {
      if (!this.__state.toInsertValue) {
        throw new Error("Insert values are not set");
      }

      if (!this.__state.intoTable) {
        throw new Error("Into table is not set");
      }

      const columns =
        this.__state.columnNames.length > 0
          ? this.__state.columnNames
          : Array.isArray(this.__state.toInsertValue)
          ? this.__state.toInsertValue[0].map(({ columnName }) => columnName)
          : [];

      return sql.join(
        [
          this.__state.cteValue ? this.__state.cteValue : null,
          sql`INSERT`,
          this.__state.orReplaceValue
            ? sql`OR ${sql.raw(this.__state.orReplaceValue)}`
            : null,
          sql`INTO`,
          typeof this.__state.intoTable === "string"
            ? sql.table(this.__state.intoTable)
            : this.__state.intoTable,
          columns.length > 0
            ? sql`(${sql.join(columns.map((c) => sql.liter(c)))})`
            : null,
          isValues(this.__state.toInsertValue) ||
          isSelect(this.__state.toInsertValue)
            ? this.__state.toInsertValue
            : sql`VALUES ${sql.join(
                this.__state.toInsertValue.map((toInsertColumns) => {
                  const toInsert: (IPrimitiveValue | IBaseToken)[] = Array(
                    toInsertColumns.length
                  );

                  for (const { columnName, value } of toInsertColumns) {
                    const index = columns.indexOf(columnName);

                    if (index === -1) {
                      throw new Error(
                        `Column ${columnName} is not present at columns set: ${columns}. Make sure that you set all columns with setColumnNames() or each insert objects have the same keys present. Tried to insert: ${JSON.stringify(
                          toInsertColumns
                        )}`
                      );
                    }

                    toInsert[index] = value;
                  }

                  return sql`(${sql.join(toInsert)})`;
                })
              )}`,
          this.__state.returningValue,
        ].filter((v) => v),
        " "
      );
    },
  };
};
