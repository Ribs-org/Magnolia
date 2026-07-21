import { expect, test } from "vitest";
import { CENTER_TZ } from "@/lib/constants";
test("constants load", () => { expect(CENTER_TZ).toBe("America/Santiago"); });
