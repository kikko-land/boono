import { IContainsTable, ISqlAdapter, sql } from "@kikko-land/sql";
import { isTable } from "@kikko-land/sql";

import { IBaseToken, isToken, TokenType } from "../types";
import { alias } from "./alias";
import { conditionValuesToToken, IConditionValue } from "./exprs/binary";
import { toToken } from "./rawSql";
import { ISelectStatement } from "./statements/select";
import { wrapParentheses } from "./utils";

type IJoinOperator =
  | Readonly<{
      joinType: "CROSS";
    }>
  | (Readonly<{
      isNatural: boolean;
    }> &
      (
        | Readonly<{
            joinType: "LEFT" | "RIGHT" | "FULL";
            isOuter: boolean;
          }>
        | Readonly<{
            joinType: "INNER";
          }>
        // eslint-disable-next-line @typescript-eslint/ban-types
        | Readonly<{}>
      ));

export interface IJoinExpr extends IBaseToken<TokenType.Join> {
  readonly __state: Readonly<{
    operator?: IJoinOperator;
    toJoin:
      | IContainsTable
      | IBaseToken
      | Readonly<{ toSelect: IBaseToken; alias: string }>;
    on?: IConditionValue;
  }>;
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

export interface IJoinToTrait {
  readonly __state: Readonly<{
    joinValues: IJoinExpr[];
  }>;

  readonly join: typeof join;

  readonly withoutJoin: typeof withoutJoin;

  readonly joinCross: typeof joinCross;

  readonly joinNatural: typeof joinNatural;

  readonly joinLeft: typeof joinLeft;
  readonly joinLeftOuter: typeof joinLeftOuter;
  readonly joinLeftNatural: typeof joinLeftNatural;
  readonly joinLeftNaturalOuter: typeof joinLeftNaturalOuter;

  readonly joinRight: typeof joinRight;
  readonly joinRightOuter: typeof joinRightOuter;
  readonly joinRightNatural: typeof joinRightNatural;
  readonly joinRightNaturalOuter: typeof joinRightNaturalOuter;

  readonly joinFull: typeof joinFull;
  readonly joinFullOuter: typeof joinFullOuter;
  readonly joinFullNatural: typeof joinFullNatural;
  readonly joinFullNaturalOuter: typeof joinFullNaturalOuter;

  readonly joinInner: typeof joinInner;
  readonly joinInnerNatural: typeof joinInnerNatural;
}

export function join<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
    ...this.__state,
    joinValues: [...this.__state.joinValues, baseJoin(undefined, toJoin, on)],
  };

  return { ...this, __state: state };
}

export function joinCross<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
) {
  const state: IJoinToTrait["__state"] = {
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
  this: IJoinToTrait,
  toJoin: IToJoinArg,
  on?: IConditionValue
): IJoinToTrait {
  const state: IJoinToTrait["__state"] = {
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

export function joinLeftNatural<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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

export function joinRightNatural<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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

export function joinFullNatural<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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

export function joinLeftNaturalOuter<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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
export function joinRightNaturalOuter<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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
export function joinFullNaturalOuter<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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

export function joinInnerNatural<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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

export function joinLeft<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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
export function joinRight<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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
export function joinFull<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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

export function joinLeftOuter<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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
export function joinRightOuter<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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
export function joinFullOuter<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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

export function joinInner<T extends IJoinToTrait>(
  this: T,
  toJoin: IToJoinArg,
  on?: IConditionValue
): T {
  const state: IJoinToTrait["__state"] = {
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

export function withoutJoin<T extends IJoinToTrait>(this: T): T {
  const state: IJoinToTrait["__state"] = {
    ...this.__state,
    joinValues: [],
  };

  return {
    ...this,
    __state: state,
  };
}
