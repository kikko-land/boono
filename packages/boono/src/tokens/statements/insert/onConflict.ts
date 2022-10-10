import { IBaseToken, TokenType } from "../../../types";
import { IWhereTrait } from "../../where";
import { ISetArgType, ISetValue } from "../update";

export interface IOnConflictTrait {
  readonly __state: Readonly<{
    conflictedColumns?: IConflictedColumnsTerm;
    do?: IDoTerm;
  }>;

  readonly onConflict: typeof onConflict;
}

export function onConflict<T extends IOnConflictTrait>(
  this: T,
  conflictedColumns?: IConflictedColumnsTerm
): T & { readonly do: typeof doFunc } {
  const state: IOnConflictTrait["__state"] = {
    ...this["__state"],
    conflictedColumns,
  };

  return {
    ...this,
    __state: state,
    do: doFunc,
  };
}

function doFunc<T extends IOnConflictTrait>(this: T, toDo: IDoTerm): T {
  const state: IOnConflictTrait["__state"] = {
    ...this["__state"],
    do: toDo,
  };

  return {
    ...this,
    __state: state,
  };
}

export interface IConflictedColumnsTerm
  extends IBaseToken<TokenType.ConflictedColumns>,
    IWhereTrait {
  readonly __state: Readonly<
    {
      columns?: (string | IBaseToken)[];
    } & IWhereTrait["__state"]
  >;
}

export interface IDoTerm extends IBaseToken<TokenType.Do>, IWhereTrait {
  readonly __state: Readonly<
    {
      do:
        | "nothing"
        | {
            setValues: ISetValue[];
          };
    } & IWhereTrait["__state"]
  >;

  set(...args: ISetArgType[]): IDoTerm;
}
