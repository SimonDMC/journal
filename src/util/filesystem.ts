import path from "path";
import { readdir, stat } from "fs/promises";

// https://stackoverflow.com/a/69418940/19271522
export async function dirSize(directory: string) {
    const files = await readdir(directory, { recursive: true });
    const stats = files.map((file) => stat(path.join(directory, file)));

    return (await Promise.all(stats)).reduce((accumulator, { size }) => accumulator + size, 0);
}
