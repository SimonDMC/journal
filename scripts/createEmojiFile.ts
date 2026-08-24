// Transforms an emoji file from discord's format to CKEditor format
// Also removes all emojis with a different skin tone because I find
// them somewhat unnecessary and removing them brings down the file
// size 255kB -> 108kB

// Discord emoji extraction guide (Aug 2026):
// 1. Open chrome devtools network tab
// 2. Open discord.com/app
// 3. Search `emoji` in network tab
// 4. Click the JS file that pops up, /assets/vnd-emoji.*hash*.js
// 5. Scroll to the very bottom, to the line which has JSON.parse('{emojis:[...]}')
// 6. Copy the JSON, without the 's
// 7. Switch to console and run JSON.stringify(*clipboard*)
//    -> this step is necessary because the JSON string contains \x__ syntax which is valid in JS
//       but not in JSON
// 8. Copy the result and that's your emoji-in.json file

// Usage:
// 1. Create file `client/public/emoji-in.json` with emoji in discord format
// 2. Run `bun scripts/createEmojiFile.ts`
// 3. Done. CKEditor emoji file generates into `client/public/emoji.json`

type EmojiIn = {
    names: string[];
    surrogates: string;
    unicodeVersion: string;
};

const file = Bun.file("./client/public/emoji-in.json");
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

Bun.write("./client/public/emoji.json", JSON.stringify(emojisOut));
export {};
