import { IPrimitiveValue, ISqlAdapter, sql } from "@kikko-land/sql";

import { IBaseToken, isToken, TokenType } from "../../types";
import { toToken } from "../rawSql";
import { wrapParentheses } from "../utils";

// TODO: in null support
export interface IBinaryOperator extends IBaseToken<TokenType.Binary> {
  __state: {
    operator:
      | "<"
      | "<="
      | ">"
      | ">="
      | "="
      | "<>"
      | "AND"
      | "OR"
      | "IN"
      | "NOT IN"
      | "LIKE"
      | "NOT LIKE"
      | "GLOB"
      | "NOT GLOB"
      | "MATCH"
      | "NOT MATCH"
      | "REGEXP"
      | "NOT REGEXP";
    left: IBaseToken;
    right: IBaseToken | IBaseToken[];
    escape?: string | undefined;
  };
}

export const isBinaryOperator = (t: unknown): t is IBinaryOperator => {
  return (
    t !== null &&
    typeof t === "object" &&
    "type" in t &&
    (t as IBinaryOperator).type === TokenType.Binary
  );
};

const binaryOperator = (
  operator: IBinaryOperator["__state"]["operator"],
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right:
    | IBaseToken
    | ISqlAdapter
    | IPrimitiveValue
    | (IBaseToken | ISqlAdapter | IPrimitiveValue)[],
  escape?: string
  // append?: ISqlAdapter | IBaseToken | undefined
): IBinaryOperator => {
  return {
    type: TokenType.Binary,
    __state: {
      left: toToken(left),
      right: Array.isArray(right) ? right.map(toToken) : toToken(right),
      operator: operator,
      escape: escape,
    },
    toSql() {
      return sql.join(
        [
          wrapParentheses(this.__state.left),
          sql.raw(this.__state.operator),

          Array.isArray(this.__state.right)
            ? sql`(${sql.join(this.__state.right)})`
            : wrapParentheses(this.__state.right),

          this.__state.escape
            ? sql`ESCAPE ${sql.escapeString(this.__state.escape)}`
            : sql.empty,
        ],
        " "
      );
    },
  };
};

export const notEq$ = (right: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    notEq(left, right);
};
export const notEq = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator("<>", left, right);
};

export const eq$ = (right: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) => eq(left, right);
};
export const eq = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator("=", left, right);
};

export const gt$ = (right: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) => gt(left, right);
};
export const gt = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator(">", left, right);
};

export const gtEq$ = (right: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    gtEq(left, right);
};
export const gtEq = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator(">=", left, right);
};

export const lt$ = (right: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) => lt(left, right);
};
export const lt = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator("<", left, right);
};

export const ltEq$ = (right: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    ltEq(left, right);
};
export const ltEq = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator("<=", left, right);
};

export const glob = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator("GLOB", left, right);
};
export const glob$ = (right: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    glob(left, right);
};

export const notGlob = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator("NOT GLOB", left, right);
};
export const notGlob$ = (right: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    notGlob(left, right);
};

export const match = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator("MATCH", left, right);
};
export const match$ = (right: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    match(left, right);
};

export const notMatch = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator("NOT MATCH", left, right);
};
export const notMatch$ = (
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    notMatch(left, right);
};

export const regexp = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator("REGEXP", left, right);
};
export const regexp$ = (right: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    regexp(left, right);
};

export const notRegexp = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return binaryOperator("NOT REGEXP", left, right);
};
export const notRegexp$ = (
  right: IBaseToken | ISqlAdapter | IPrimitiveValue
) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    notRegexp(left, right);
};

const performLike = (
  not: boolean,
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue,
  escape?: string
) => {
  return binaryOperator(not ? "NOT LIKE" : "LIKE", left, right, escape);
};

export const like = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue,
  escape?: string
) => {
  return performLike(false, left, right, escape);
};
export const like$ = (
  right: IBaseToken | ISqlAdapter | IPrimitiveValue,
  escape?: string
) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    like(left, right, escape);
};

export const notLike = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  right: IBaseToken | ISqlAdapter | IPrimitiveValue,
  escape?: string
) => {
  return performLike(true, left, right, escape);
};
export const notLike$ = (
  right: IBaseToken | ISqlAdapter | IPrimitiveValue,
  escape?: string
) => {
  return (left: IBaseToken | ISqlAdapter | IPrimitiveValue) =>
    notLike(left, right, escape);
};

export const In = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  ...right: (IBaseToken | ISqlAdapter | IPrimitiveValue)[]
) => {
  return binaryOperator("IN", left, right);
};
export const notIn = (
  left: IBaseToken | ISqlAdapter | IPrimitiveValue,
  ...right: (IBaseToken | ISqlAdapter | IPrimitiveValue)[]
) => {
  return binaryOperator("NOT IN", left, right);
};

export const in$ = (
  ...values: (IBaseToken | ISqlAdapter | IPrimitiveValue)[]
) => (left: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return In(left, ...values);
};
export const notIn$ = (
  ...values: (IBaseToken | ISqlAdapter | IPrimitiveValue)[]
) => (left: IBaseToken | ISqlAdapter | IPrimitiveValue) => {
  return notIn(left, ...values);
};

export type IConditionValue =
  | IBaseToken
  | ISqlAdapter
  | Record<
      string,
      | ((left: IBaseToken | ISqlAdapter | IPrimitiveValue) => IBaseToken)
      | IBaseToken
      | ISqlAdapter
      | IPrimitiveValue
    >;

export const conditionValuesToToken = (values: IConditionValue[]) => {
  return values
    .flatMap((v) =>
      isToken(v) || sql.isSql(v)
        ? toToken(v)
        : Object.entries(v).map(([k, expr]) =>
            toToken(
              typeof expr === "function"
                ? expr(sql.ident(k))
                : eq(sql.ident(k), expr)
            )
          )
    )
    .filter((v) => !v.toSql().isEmpty);
};

const conditionOperator = (
  type: "AND" | "OR",
  ...values: IConditionValue[]
): IBinaryOperator => {
  const exprs = conditionValuesToToken(values);

  if (exprs.length <= 1) {
    throw new Error("Must at least two arguments present");
  }

  let current = binaryOperator(type, exprs[0], exprs[1]);

  for (const next of exprs.slice(2)) {
    current = binaryOperator(type, current, next);
  }

  return current;
};

export const and = (...values: IConditionValue[]): IBinaryOperator => {
  return conditionOperator("AND", ...values);
};

export const or = (...values: IConditionValue[]): IBinaryOperator => {
  return conditionOperator("OR", ...values);
};
