import { IPrimitiveValue, ISqlAdapter } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";

export interface IIsOperator extends IBaseToken<TokenType.Is> {
  readonly __state: Readonly<{
    not: boolean;
    right: IBaseToken | ISqlAdapter | IPrimitiveValue;
  }>;
}
