import { db } from "../database/db";
import { successToast } from "./toast";

export async function wipeLocalDatabase() {
    await db.entries.clear();
    successToast("Database wiped successfully.");
}
