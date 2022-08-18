export interface IOrReplaceTokenTrait {
  __state: {
    orReplaceValue?: "ABORT" | "FAIL" | "IGNORE" | "REPLACE" | "ROLLBACK";
  };

  orAbort: typeof orAbort;
  orFail: typeof orFail;
  orIgnore: typeof orIgnore;
  orReplace: typeof orReplace;
  orRollback: typeof orRollback;
}

export function orAbort<T extends IOrReplaceTokenTrait>(this: T): T {
  const state: IOrReplaceTokenTrait["__state"] = {
    orReplaceValue: "ABORT",
  };

  return { ...this, __state: state };
}

export function orFail<T extends IOrReplaceTokenTrait>(this: T): T {
  const state: IOrReplaceTokenTrait["__state"] = {
    orReplaceValue: "FAIL",
  };

  return { ...this, __state: state };
}

export function orIgnore<T extends IOrReplaceTokenTrait>(this: T): T {
  const state: IOrReplaceTokenTrait["__state"] = {
    orReplaceValue: "IGNORE",
  };

  return { ...this, __state: state };
}

export function orReplace<T extends IOrReplaceTokenTrait>(this: T): T {
  const state: IOrReplaceTokenTrait["__state"] = {
    orReplaceValue: "REPLACE",
  };

  return { ...this, __state: state };
}

export function orRollback<T extends IOrReplaceTokenTrait>(this: T): T {
  const state: IOrReplaceTokenTrait["__state"] = {
    orReplaceValue: "ROLLBACK",
  };

  return { ...this, __state: state };
}
