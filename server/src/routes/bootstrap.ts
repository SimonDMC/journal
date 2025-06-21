export const bootstrapHandle = async (): Promise<Response> => {
    // remove if necessary
    return new Response("OK");

    /* const entries = data.results;

	await Promise.all(
		entries.map(async (entry: any) => {
			env.DB.prepare(
				'INSERT INTO entries (date, content, last_modified, word_count, mood, location, user_id) VALUES (?, ?, ?, ?, ?, ?, ?);'
			)
				.bind(entry.date, entry.content, entry.last_modified, entry.word_count, entry.mood, entry.location, 1)
				.all();
		})
	); */

    return new Response("OK");
};
