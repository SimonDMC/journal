import { db } from "../database/db";
import { successToast } from "../util/toast";

export async function wipeLocalDatabase() {
    await db.entries.clear();
    successToast("Local database wiped successfully.");
}
