// Transforms an emoji file from discord's format to CKEditor format
// Also removes all emojis with a different skin tone because I find
// them somewhat unnecessary and removing them brings down the file
// size 255kB -> 108kB

// Usage:
// 1. Create file `public/emoji-in.json` with emoji in discord format
// 2. Run `bun src/scripts/createEmojiFile.ts`
// 3. Done. CKEditor emoji file generates into `public/emoji.json`

type EmojiIn = {
    names: string[];
    surrogates: string;
    unicodeVersion: string;
};

const file = Bun.file("public/emoji-in.json");
const emojisIn = await file.json();

const emojisOut = emojisIn.emojis
    .filter((emoji: EmojiIn) => !emoji.names[0].includes("tone"))
    .map((emoji: EmojiIn) => {
        return {
            emoji: emoji.surrogates,
            annotation: emoji.names[0],
            // shortcodes don't work for whatever reason. might as well not include them then!
            //shortcodes: emoji.names.slice(1),
            version: emoji.unicodeVersion,
        };
    });

Bun.write("public/emoji.json", JSON.stringify(emojisOut));
