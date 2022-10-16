export const tableSymbol: unique symbol = Symbol("table");

export interface ITableDef {
  name: string;
  dependsOnTables: ITableDef[];
  __discriminator: "ITableDef";
  allDependingTables: ITableDef[];
}

export interface IContainsTable {
  [tableSymbol]: ITableDef;
}

export const table = (
  ...args: [
    name: string,
    dependsOnTables?: ITableDef[]
  ] | [
    rawStrings: ReadonlyArray<string>,
    ...rawValues: unknown[]
  ]
): ITableDef & IContainsTable => {
  const str = (() => {
    if (typeof args[0] === 'string') {
      return args[0];
    } else {
      let templateArgs = args as [
        rawStrings: ReadonlyArray<string>,
        ...rawValues: unknown[]
      ];

      let result = templateArgs[0][0]

      for (let i = 1; i < templateArgs[0].length; i++) {
        result = result.concat(templateArgs[i] as string)
      }

      return result;
    }
  })();

  const dependsOnTables = typeof args[0] === 'string' ? (args[1] as ITableDef[] | undefined) || [] : [];

  return {
    name: str,
    dependsOnTables: dependsOnTables,
    get allDependingTables() {
      const tableDefs: ITableDef[] = [];

      this.dependsOnTables.forEach((def) => {
        tableDefs.push(...def.allDependingTables);
      });

      return tableDefs;
    },
    get [tableSymbol]() {
      return this;
    },
    __discriminator: "ITableDef",
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTable(x: any): x is IContainsTable {
  if (x === null) return false;
  if (typeof x !== "object") return false;

  return Boolean(x[tableSymbol]);
}
