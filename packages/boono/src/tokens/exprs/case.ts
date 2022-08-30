import { IPrimitiveValue, ISqlAdapter } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../../types";

export interface ICaseOperator extends IBaseToken<TokenType.Case> {
  readonly __state: Readonly<{
    caseValue: IBaseToken | ISqlAdapter | IPrimitiveValue;
    cases: Readonly<{
      when: IBaseToken | ISqlAdapter | IPrimitiveValue;
      then: IBaseToken | ISqlAdapter | IPrimitiveValue;
    }>[];
    else: IBaseToken | ISqlAdapter | IPrimitiveValue;
  }>;
}
