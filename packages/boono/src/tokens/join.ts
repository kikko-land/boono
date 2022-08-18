import { IContainsTable, ISqlAdapter, sql } from "@kikko-land/sql";
import { isTable } from "@kikko-land/sql";

import { IBaseToken, isToken, TokenType } from "../types";
import { alias } from "./alias";
import { conditionValuesToToken, IConditionValue } from "./binary";
import { toToken } from "./rawSql";
import { ISelectStatement } from "./statements/select";
import { wrapParentheses } from "./utils";

type IJoinOperator =
  | {
      joinType: "CROSS";
    }
  | ({
      isNatural: boolean;
    } & (
      | {
          joinType: "LEFT" | "RIGHT" | "FULL";
          isOuter: boolean;
        }
      | {
          joinType: "INNER";
        }
      // eslint-disable-next-line @typescript-eslint/ban-types
      | {}
    ));

export interface IJoinExpr extends IBaseToken<TokenType.Join> {
  __state: {
    operator?: IJoinOperator;
    toJoin:
      | IContainsTable
      | IBaseToken
      | { toSelect: IBaseToken; alias: string };
    on?: IConditionValue;
  };
}

const baseJoin = (
  operator: IJoinOperator | undefined,
  toJoin: IToJoinArg,
  on?: IConditionValue
): IJoinExpr => {
  return {
    type: TokenType.Join,
    __state: {
      operator: operator,
      toJoin: (() => {
        if (typeof toJoin === "string") {
          return sql.table(toJoin);
        } else if (isTable(toJoin)) {
          return toJoin;
        } else if (isToken(toJoin) || sql.isSql(toJoin)) {
          return toToken(toJoin);
        } else {
          const entries = Object.entries(toJoin);
          if (entries.length === 0) {
            throw new Error("No alias select present for join");
          }
          if (entries.length > 1) {
            throw new Error("Only one select could be specified at join");
          }
          return { toSelect: toToken(entries[0][1]), alias: entries[0][0] };
        }
      })(),
      on: on,
    },

    toSql() {
      const operatorSql = (() => {
        if (!this.__state.operator) return [sql`JOIN`];

        if ("joinType" in this.__state.operator) {
          if (this.__state.operator.joinType === "CROSS") {
            return [sql`CROSS JOIN`] as const;
          } else {
            return [
              this.__state.operator.isNatural ? sql`NATURAL` : undefined,
              sql.raw(this.__state.operator.joinType),
              "isOuter" in this.__state.operator &&
              this.__state.operator.isOuter
                ? sql`OUTER`
                : undefined,
              sql`JOIN`,
            ] as const;
          }
        } else {
          return [
            this.__state.operator.isNatural ? sql`NATURAL` : undefined,
            sql`JOIN`,
          ] as const;
        }
      })().flatMap((v) => (v === undefined ? [] : v));

      return sql.join(
        [
          ...operatorSql,
          "toSelect" in this.__state.toJoin
            ? alias(this.__state.toJoin.toSelect, this.__state.toJoin.alias)
            : wrapParentheses(this.__state.toJoin),
          ...(this.__state.on
            ? [sql`ON`, ...conditionValuesToToken([this.__state.on])]
            : []),
        ],
        " "
      );
    },
  };
};

export type IToJoinArg =
  | IBaseToken
  | ISqlAdapter
  | IContainsTable
  | string
  | { [key: string]: ISqlAdapter | ISelectStatement | string };

export interface IJoinState {
  __state: {
    joinValues: IJoinExpr[];
  };

  join: typeof join;

  withoutJoin: typeof withoutJoin;

  joinCross: typeof joinCross;

  joinNatural: typeof joinNatural;

  joinLeft: typeof joinLeft;
  joinLeftOuter: typeof joinLeftOuter;
  joinLeftNatural: typeof joinLeftNatural;
  joinLeftNaturalOuter: typeof joinLeftNaturalOuter;

  joinRight: typeof joinRight;
  joinRightOuter: typeof joinRightOuter;
  joinRightNatural: typeof joinRightNatural;
  joinRightNaturalOuter: typeof joinRightNaturalOuter;

  joinFull: typeof joinFull;
  joinFullOuter: typeof joinFullOuter;
  joinFullNatural: typeof joinFullNatural;
  joinFullNaturalOuter: typeof joinFullNaturalOuter;

  joinInner: typeof joinInner;
  joinInnerNatural: typeof joinInnerNatural;
}

export function join<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [...this.__state.joinValues, baseJoin(undefined, toJoin, on)],
  };

  return { ...this, __state: state };
}

export function joinCross<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
) {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,
      baseJoin({ joinType: "CROSS" }, toJoin, on),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}

export function joinNatural(
  this: IJoinState,
  toJoin: IToJoinArg,
  on?: IConditionValue
): IJoinState {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,
      baseJoin({ isNatural: true }, toJoin, on),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}

export function joinLeftNatural<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,
      baseJoin(
        { isNatural: true, isOuter: false, joinType: "LEFT" as const },
        toJoin,
        on
      ),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}

export function joinRightNatural<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,
      baseJoin(
        { isNatural: true, isOuter: false, joinType: "RIGHT" as const },
        toJoin,
        on
      ),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}

export function joinFullNatural<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,
      baseJoin(
        { isNatural: true, isOuter: false, joinType: "FULL" as const },
        toJoin,
        on
      ),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}

export function joinLeftNaturalOuter<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,
      baseJoin(
        { isNatural: true, isOuter: true, joinType: "LEFT" as const },
        toJoin,
        on
      ),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}
export function joinRightNaturalOuter<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,
      baseJoin(
        { isNatural: true, isOuter: true, joinType: "RIGHT" as const },
        toJoin,
        on
      ),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}
export function joinFullNaturalOuter<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,
      baseJoin(
        { isNatural: true, isOuter: true, joinType: "FULL" as const },
        toJoin,
        on
      ),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}

export function joinInnerNatural<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,
      baseJoin({ isNatural: true, joinType: "INNER" as const }, toJoin, on),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}

export function joinLeft<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,

      baseJoin({ isNatural: false, joinType: "LEFT" as const }, toJoin, on),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}
export function joinRight<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,

      baseJoin({ isNatural: false, joinType: "RIGHT" as const }, toJoin, on),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}
export function joinFull<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,
      baseJoin({ isNatural: false, joinType: "FULL" as const }, toJoin, on),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}

export function joinLeftOuter<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,

      baseJoin(
        { isNatural: false, isOuter: true, joinType: "LEFT" as const },
        toJoin,
        on
      ),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}
export function joinRightOuter<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,

      baseJoin(
        { isNatural: false, isOuter: true, joinType: "RIGHT" as const },
        toJoin,
        on
      ),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}
export function joinFullOuter<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,

      baseJoin(
        { isNatural: false, isOuter: true, joinType: "FULL" as const },
        toJoin,
        on
      ),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}

export function joinInner<T extends IJoinState>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [
      ...this.__state.joinValues,
      baseJoin({ isNatural: false, joinType: "INNER" as const }, toJoin, on),
    ],
  };

  return {
    ...this,
    __state: state,
  };
}

export function withoutJoin<T extends IJoinState>(this: T): T {
  const state: IJoinState["__state"] = {
    ...this.__state,
    joinValues: [],
  };

  return {
    ...this,
    __state: state,
  };
}
