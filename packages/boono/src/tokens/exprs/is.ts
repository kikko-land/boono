import { IPrimitiveValue, ISqlAdapter } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";

export interface IIsOperator extends IBaseToken<TokenType.Is> {
  __state: {
    not: boolean;
    right: IBaseToken | ISqlAdapter | IPrimitiveValue;
  };
}
