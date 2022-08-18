import { ISql, sql } from "@kikko-land/sql";

import { IBaseToken, TokenType } from "../types";
import { toToken } from "./rawSql";
import { ISelectStatement, isSelect } from "./statements/select";
import { isValues, IValuesStatement } from "./statements/values";

type IUnionArg = ISelectStatement | IValuesStatement | ISql;

export interface ICompoundOperator extends IBaseToken<TokenType.OrderTerm> {
  compoundType: "UNION" | "UNION ALL" | "INTERSECT" | "EXCEPT";
  value: ISelectStatement | IValuesStatement | IBaseToken<TokenType.RawSql>;
}

export interface ICompoundTrait {
  __state: {
    compoundValues: ICompoundOperator[];
  };

  union: typeof union;
  unionAll: typeof unionAll;
  intersect: typeof intersect;
  except: typeof except;
  withoutCompound: typeof withoutCompound;
}

const makeCompounds = <T extends ICompoundTrait>(
  term: T,
  type: "UNION" | "UNION ALL" | "INTERSECT" | "EXCEPT",
  values: IUnionArg[]
): T => {
  const state: ICompoundTrait["__state"] = {
    ...term.__state,
    compoundValues: [
      ...term.__state.compoundValues,
      ...values.map(
        (val): ICompoundOperator => {
          const token = toToken(val);

          return {
            type: TokenType.OrderTerm,
            compoundType: type,
            value: isSelect(token)
              ? token
                  .withoutWith()
                  .withoutLimit()
                  .withoutOrder()
                  .withoutOffset()
              : isValues(token)
              ? token
                  .withoutWith()
                  .withoutLimit()
                  .withoutOrder()
                  .withoutOffset()
              : (token as IValuesStatement | IBaseToken<TokenType.RawSql>),
            toSql() {
              return sql`${sql.raw(this.compoundType)} ${this.value}`;
            },
          };
        }
      ),
    ],
  };

  return {
    ...term,
    __state: state,
  };
};

export function union<T extends ICompoundTrait>(
  this: T,
  ...values: IUnionArg[]
) {
  return makeCompounds(this, "UNION", values);
}
export function unionAll<T extends ICompoundTrait>(
  this: T,
  ...values: IUnionArg[]
) {
  return makeCompounds(this, "UNION ALL", values);
}
export function intersect<T extends ICompoundTrait>(
  this: T,
  ...values: IUnionArg[]
) {
  return makeCompounds(this, "INTERSECT", values);
}
export function except<T extends ICompoundTrait>(
  this: T,
  ...values: IUnionArg[]
) {
  return makeCompounds(this, "EXCEPT", values);
}

export function withoutCompound<T extends ICompoundTrait>(this: T) {
  const state: ICompoundTrait["__state"] = {
    ...this.__state,
    compoundValues: [],
  };

  return { ...this, __state: state };
}
