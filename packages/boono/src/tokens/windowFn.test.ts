import { sql } from "@kikko-land/sql";
import { describe, expect, it } from "vitest";

import { gtEq$, or } from "./exprs/binary";
import { desc } from "./order";
import { windowBody, windowFn } from "./windowFn";

describe("windowFn", () => {
  it("works without specifying over", () => {
    expect(
      windowFn(sql`group_concat(b, '.')`)
        .filter({ q: gtEq$(5) })
        .filter(or({ q: gtEq$(5), a: 5 }))
        .toSql().raw
    ).to.eq(
      `group_concat(b, '.') FILTER (WHERE "q" >= 5 AND ("q" >= 5 OR "a" = 5)) OVER ()`
    );
  });

  it("works with over", () => {
    expect(
      windowFn(sql`group_concat(b, '.')`)
        .over()
        .toSql().raw
    ).to.eq(`group_concat(b, '.') OVER ()`);
  });

  describe("over", () => {
    it("works with fromBase", () => {
      expect(
        windowFn(sql`group_concat(b, '.')`)
          .over(windowBody().fromBase("func"))
          .toSql().raw
      ).to.eq(`group_concat(b, '.') OVER (func)`);
    });

    it("works with order", () => {
      expect(
        windowFn(sql`group_concat(b, '.')`)
          .over(
            windowBody()
              .fromBase("func")
              .orderBy(desc("kek"))
          )
          .toSql().raw
      ).to.eq(`group_concat(b, '.') OVER (func ORDER BY "kek" DESC)`);
    });

    it("works with partition", () => {
      expect(
        windowFn(sql`group_concat(b, '.')`)
          .over(
            windowBody()
              .fromBase("func")
              .partitionBy("kek")
              .partitionBy("puk")
              .orderBy(desc("kek"))
          )
          .toSql().raw
      ).to.eq(
        `group_concat(b, '.') OVER (func PARTITION BY "kek", "puk" ORDER BY "kek" DESC)`
      );
    });

    it("works with frame", () => {
      expect(
        windowFn(sql`group_concat(b, '.')`)
          .over(
            windowBody()
              .fromBase("func")
              .partitionBy("kek")
              .partitionBy("puk")
              .withFrame(
                sql`RANGE BETWEEN UNBOUND PRECEDING AND UNBOUND FOLLOWING EXCLUDE GROUP`
              )
              .orderBy(desc("kek"))
          )
          .toSql().raw
      ).to.eq(
        `group_concat(b, '.') OVER (func PARTITION BY "kek", "puk" ORDER BY "kek" DESC RANGE BETWEEN UNBOUND PRECEDING AND UNBOUND FOLLOWING EXCLUDE GROUP)`
      );
    });
  });

  // it("works with select", () => {
  //   console.log(
  //     select().defineWindow(
  //       "name",
  //       windowBody()
  //         .fromBase("func")
  //         .partitionBy(sql``)
  //         .orderBy(desc("createdAt"))
  //         .withFrame(windowFrame("range"))
  //         .toSql()
  //     )
  //   );
  // });
});
