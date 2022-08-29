type IPrimitiveValue = string | number | null | Uint8Array;
type ITableColumnDef<
  Name extends string = string,
  ColType extends "string" | "number" | "null" | "blob" =
    | "string"
    | "number"
    | "null"
    | "blob"
> = {
  type: ColType;
  name: Name;
  optionalOnInsert?: boolean;
};

const defColumn = <
  Name extends string,
  ColType extends "string" | "number" | "null" | "blob"
>(
  name: Name,
  type: ColType
): ITableColumnDef<Name, ColType> => {
  return {
    name,
    type,
  };
};

type ITableDef<
  TableName extends string,
  ColumnDefs extends readonly ITableColumnDef[]
> = {
  name: TableName;
  columnDefs: ColumnDefs;
  col: (name: ColumnDefs[number]["name"]) => {};
};

const defineTable = <TableName extends string>(name: TableName) => <
  ColumnDefs extends readonly ITableColumnDef[]
>(
  defs: ColumnDefs
): ITableDef<TableName, ColumnDefs> => {
  return { name } as ITableDef<TableName, ColumnDefs>;
};

const notesTable = defineTable("notes")([
  defColumn("id", "number"),
  defColumn("content", "string"),
  defColumn("createdAt", "number"),
] as const);

export const select = <T extends Record<string, unknown>>() => {};
