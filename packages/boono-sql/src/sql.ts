import {
  IContainsTable,
  isTable,
  ITableDef,
  table,
  tableSymbol,
} from "./table";

// Code is taken and adopted from https://github.com/blakeembrey/sql-template-tag

export type IPrimitiveValue = string | number | null | Uint8Array;
export const isPrimitiveValue = (t: unknown): t is IPrimitiveValue => {
  return (
    t === null ||
    typeof t === "string" ||
    typeof t === "number" ||
    t instanceof Uint8Array
  );
};

export type IRawValue = IPrimitiveValue | ISql | IContainsTable | ISqlAdapter;

const insertRegex = /insert\s+(or\s+\w+\s+)?into\s+/gim;
const deleteRegex = /delete\s+from\s+/gim;
const updateRegex = /update\s+(or\s+\w+\s+)?/gim;

const strip = (str: string) => {
  return (
    str
      // eslint-disable-next-line no-control-regex
      .replace(/[^\u0001-\u007f]"/g, "")
      .split(".")
      .map((v) => '"' + v + '"')
      .join(".")
  );
};

export interface ISqlAdapter {
  toSql(): ISql;
}

function isSql(x: unknown): x is ISqlAdapter {
  if (x === null) return false;
  if (typeof x !== "object") return false;

  return "toSql" in x;
}

export interface ISql extends ISqlAdapter {
  readonly _values: IPrimitiveValue[];
  readonly _strings: string[];
  readonly tables: ITableDef[];

  _cachedText?: string;
  _hash?: string;

  get isModifyQuery(): boolean;
  get isReadQuery(): boolean;
  get isEmpty(): boolean;
  get raw(): string;

  get hash(): string;

  get preparedQuery(): {
    values: IPrimitiveValue[];
    text: string;
  };

  inspect(): {
    preparedQuery: ISql["preparedQuery"];
    tables: ISql["tables"];
  };

  toString(): string;
}

function internalSql(
  _rawStrings: ReadonlyArray<string>,
  _rawValues: IRawValue[]
): ISql {
  if (_rawStrings.length - 1 !== _rawValues.length) {
    if (_rawStrings.length === 0) {
      throw new TypeError("Expected at least 1 string");
    }

    throw new TypeError(
      `Expected ${_rawStrings.length} strings to have ${
        _rawStrings.length - 1
      } values`
    );
  }

  const valuesLength = _rawValues.reduce<number>(
    (len, value) =>
      len +
      (isSql(value) ? value.toSql()._values.length : isTable(value) ? 0 : 1),
    0
  );
  const tablesLength = _rawValues.reduce<number>(
    (len, value) =>
      len +
      (isSql(value)
        ? value.toSql().tables.length
        : isTable(value)
        ? 1 + value[tableSymbol].allDependingTables.length
        : 0),
    0
  );

  const values: IPrimitiveValue[] = new Array(valuesLength);
  const strings: string[] = new Array(valuesLength + 1);
  const tables: ITableDef[] = new Array(tablesLength);

  strings[0] = _rawStrings[0];

  // Iterate over rw values, strings, and children. The value is always
  // positioned between two strings, e.g. `index + 1`.
  let pos = 0,
    tableI = 0;

  _rawValues.forEach((val, i) => {
    const child = _rawValues[i];
    const rawString = _rawStrings[i + 1];

    // Check for nested `sql` queries.
    if (isSql(child)) {
      const sql = child.toSql();
      // Append child prefix text to current string.
      strings[pos] += sql._strings[0];

      sql._values.forEach((childVal, childI) => {
        values[pos++] = sql._values[childI];
        strings[pos] = sql._strings[childI + 1];
      });

      sql.tables.forEach((t, childTableI) => {
        tables[tableI++] = sql.tables[childTableI++];
      });

      // Append raw string to current string.
      strings[pos] += rawString;
    } else if (isTable(child)) {
      strings[pos] += strip(child[tableSymbol].name) + rawString;

      tables[tableI++] = child[tableSymbol];

      const dependsOnTables = child[tableSymbol].dependsOnTables;
      for (let i = 0; i < dependsOnTables.length; i++) {
        tables[tableI++] = dependsOnTables[i];
      }
    } else {
      values[pos++] = child;
      strings[pos] = rawString;
    }
  });

  return {
    _values: values,
    _strings: strings,
    tables: tables,

    get isModifyQuery() {
      const query = this.preparedQuery.text;

      // There some edge cases could happen here, so better regex could be introduced
      // I don't want put AST parser to frontend lib
      return (
        query.match(insertRegex) !== null ||
        query.match(deleteRegex) !== null ||
        query.match(updateRegex) !== null
      );
    },
    get isReadQuery() {
      return !this.isModifyQuery;
    },
    get isEmpty() {
      return this.preparedQuery.text.trim().length === 0;
    },

    get hash() {
      if (!this._hash) {
        this._hash = this._strings.join() + this._values.join();
      }

      return this._hash;
    },

    get raw() {
      return (
        this._strings[0] +
        this._strings
          .slice(1)
          .map(
            (val, i) =>
              (typeof this._values[i] === "string"
                ? "'" + this._values[i] + "'"
                : this._values[i]) + val
          )
          .join("")
      );
    },

    get preparedQuery() {
      if (!this._cachedText) {
        this._cachedText = (
          this._strings[0] +
          this._strings
            .slice(1)
            .map((val, i) => `?${val}`)
            .join("")
        ).trim();
      }

      return {
        values: this._values,
        text: this._cachedText,
      };
    },

    inspect() {
      return {
        preparedQuery: this.preparedQuery,
        tables: this.tables,
      };
    },

    toSql() {
      return this;
    },

    toString() {
      const { values, text } = this.preparedQuery;

      return `${text} - [${values.join(", ")}]`;
    },
  };
}

export function sql(
  rawStrings: ReadonlyArray<string>,
  ...rawValues: IRawValue[]
): ISql {
  return internalSql(rawStrings, rawValues);
}

sql.raw = (
  ...args:
    | [str: string]
    | [rawStrings: ReadonlyArray<string>, ...rawValues: unknown[]]
) => {
  const str = (() => {
    if (typeof args[0] === "string") {
      return args[0];
    } else {
      let templateArgs = args as [
        rawStrings: ReadonlyArray<string>,
        ...rawValues: unknown[]
      ];

      let result = templateArgs[0][0];

      for (let i = 1; i < templateArgs[0].length; i++) {
        result = result.concat(templateArgs[i] as string);
      }

      return result;
    }
  })();

  return sql([str]);
};
sql.strip = (
  ...args:
    | [str: string]
    | [rawStrings: ReadonlyArray<string>, ...rawValues: unknown[]]
) => {
  const str = (() => {
    if (typeof args[0] === "string") {
      return args[0];
    } else {
      let templateArgs = args as [
        rawStrings: ReadonlyArray<string>,
        ...rawValues: unknown[]
      ];

      let result = templateArgs[0][0];

      for (let i = 1; i < templateArgs[0].length; i++) {
        result = result.concat(templateArgs[i] as string);
      }

      return result;
    }
  })();

  return sql.raw(str.replace(/[^a-zA-Z0-9]+/g, ""));
};
sql.liter = (
  ...args:
    | [str: string]
    | [rawStrings: ReadonlyArray<string>, ...rawValues: unknown[]]
) => {
  const str = (() => {
    if (typeof args[0] === "string") {
      return args[0];
    } else {
      let templateArgs = args as [
        rawStrings: ReadonlyArray<string>,
        ...rawValues: unknown[]
      ];

      let result = templateArgs[0][0];

      for (let i = 1; i < templateArgs[0].length; i++) {
        result = result.concat(templateArgs[i] as string);
      }

      return result;
    }
  })();

  return sql.raw(strip(str));
};
sql.table = table;
sql.isTable = isTable;
sql.isSql = isSql;
sql.empty = sql.raw("");
sql.join = (
  values: IRawValue[],
  separator = ", ",
  prefix = "",
  suffix = ""
) => {
  values = values.filter((v) => (isSql(v) ? !v.toSql().isEmpty : true));

  if (values.length === 0) return sql.empty;

  return internalSql(
    [prefix, ...Array(values.length - 1).fill(separator), suffix],
    values
  );
};
