// maximum encrypted entry size in bytes; from my brief testing 1k words ~ 7500 chars, so capping an
// entry at 75kB corresponds to 10k words which i really doubt anyone will legitimately cross. in
// the rare case that this is you have a use-case for larger entries and happen to be reading this,
// reach out!
export const MAX_ENTRY_SIZE = 75_000;

// limit the entry count to 5k for now, that corresponds to 13 years of daily entries
export const MAX_ENTRY_COUNT = 5_000;
