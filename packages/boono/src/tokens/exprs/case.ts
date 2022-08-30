import { IPrimitiveValue, ISqlAdapter } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";

export interface ICaseOperator extends IBaseToken<TokenType.Case> {
  __state: {
    caseValue: IBaseToken | ISqlAdapter | IPrimitiveValue;
    cases: {
      when: IBaseToken | ISqlAdapter | IPrimitiveValue;
      then: IBaseToken | ISqlAdapter | IPrimitiveValue;
    }[];
    else: IBaseToken | ISqlAdapter | IPrimitiveValue;
  };
}
