import { IBaseToken, TokenType } from "../../types";

export interface IRaiseOperator extends IBaseToken<TokenType.Raise> {
  __state:
    | {
        type: "IGNORE";
      }
    | {
        type: "ROLLBACK" | "ABORT" | "FAIL";
        errorMessage: string;
      };
}
