import { IPrimitiveValue, ISqlAdapter } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";

export interface ICollateOperator extends IBaseToken<TokenType.Collate> {
  __state: {
    left: IBaseToken | ISqlAdapter | IPrimitiveValue;
    collationName: string;
  };
}
