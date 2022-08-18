import { IBaseToken } from "../types";
import {
  and,
  conditionValuesToToken,
  IBinaryOperator,
  IConditionValue,
  or,
} from "./binary";
import { IUnaryOperator } from "./unary";

export interface IWhereTrait {
  __state: {
    whereValue?: IBaseToken | IBinaryOperator | IUnaryOperator;
  };

  where: typeof where;
  orWhere: typeof orWhere;
}

const constructWhere = function<T extends IWhereTrait>(
  current: T,
  andOrOr: "and" | "or",
  values: IConditionValue[]
): T {
  const finalValues = current.__state.whereValue
    ? [current.__state.whereValue, ...conditionValuesToToken(values)]
    : conditionValuesToToken(values);

  const state: IWhereTrait["__state"] = (() => {
    if (finalValues.length > 1) {
      return {
        ...current.__state,
        whereValue:
          andOrOr === "and" ? and(...finalValues) : or(...finalValues),
      };
    } else {
      return { ...current.__state, whereValue: finalValues[0] };
    }
  })();

  return { ...current, __state: state };
};

export function where<T extends IWhereTrait>(
  this: T,
  ...values: IConditionValue[]
): T {
  return constructWhere(this, "and", values);
}

export function orWhere<T extends IWhereTrait>(
  this: T,
  ...values: IConditionValue[]
): T {
  return constructWhere(this, "or", values);
}
