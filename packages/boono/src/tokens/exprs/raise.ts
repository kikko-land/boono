import { IBaseToken, TokenType } from "../../types";

export interface IRaiseOperator extends IBaseToken<TokenType.Raise> {
  readonly __state:
    | Readonly<{
        type: "IGNORE";
      }>
    | Readonly<{
        type: "ROLLBACK" | "ABORT" | "FAIL";
        errorMessage: string;
      }>;
}
