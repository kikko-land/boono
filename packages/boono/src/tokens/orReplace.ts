export interface IOrReplaceState {
  __state: {
    orReplaceValue?: "ABORT" | "FAIL" | "IGNORE" | "REPLACE" | "ROLLBACK";
  };

  orAbort: typeof orAbort;
  orFail: typeof orFail;
  orIgnore: typeof orIgnore;
  orReplace: typeof orReplace;
  orRollback: typeof orRollback;
}

export function orAbort<T extends IOrReplaceState>(this: T): T {
  const state: IOrReplaceState["__state"] = {
    orReplaceValue: "ABORT",
  };

  return { ...this, __state: state };
}

export function orFail<T extends IOrReplaceState>(this: T): T {
  const state: IOrReplaceState["__state"] = {
    orReplaceValue: "FAIL",
  };

  return { ...this, __state: state };
}

export function orIgnore<T extends IOrReplaceState>(this: T): T {
  const state: IOrReplaceState["__state"] = {
    orReplaceValue: "IGNORE",
  };

  return { ...this, __state: state };
}

export function orReplace<T extends IOrReplaceState>(this: T): T {
  const state: IOrReplaceState["__state"] = {
    orReplaceValue: "REPLACE",
  };

  return { ...this, __state: state };
}

export function orRollback<T extends IOrReplaceState>(this: T): T {
  const state: IOrReplaceState["__state"] = {
    orReplaceValue: "ROLLBACK",
  };

  return { ...this, __state: state };
}
