import { ISql } from "@kikko-land/sql";

export enum TokenType {
  Raise = "Raise",
  Case = "Case",
  Exists = "Exists",
  Is = "Is",
  Collate = "Collate",
  Cast = "Cast",
  Binary = "Binary",
  Between = "Between",
  Unary = "Unary",
  Alias = "Alias",
  Compound = "Compound",
  Select = "Select",
  Update = "Update",
  Delete = "Delete",
  Insert = "Insert",
  Values = "Values",
  OrderTerm = "OrderTerm",
  OrdersBoxTerm = "OrdersBoxTerm",
  LimitOffsetTerm = "LimitOffsetTerm",
  RawSql = "RawSql",
  CompoundOperator = "CompoundOperator",
  CTE = "CTE",
  Join = "Join",
  Returning = "Returning",
  WindowFn = "WindowFn",
  WindowBody = "WindowBody",
  ConflictedColumns = "ConflictedColumns",
  Do = "DO",
}

export interface IBaseToken<T extends TokenType = TokenType> {
  readonly type: T;
  toSql(): ISql;
}

export const isToken = (t: unknown): t is IBaseToken => {
  return (
    t !== null &&
    typeof t === "object" &&
    "type" in t &&
    "toSql" in t &&
    Object.values(TokenType).includes((t as IBaseToken).type)
  );
};

export function assertUnreachable(x: never): never {
  throw new Error(`Didn't expect to get here: ${JSON.stringify(x)}`);
}
