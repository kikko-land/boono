import { IPrimitiveValue, ISqlAdapter } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";

export interface ICastOperator extends IBaseToken<TokenType.Cast> {
  __state: {
    left: IBaseToken | ISqlAdapter | IPrimitiveValue;
    typeName: "NONE" | "TEXT" | "REAL" | "INTEGER" | "NUMERIC";
  };
}
