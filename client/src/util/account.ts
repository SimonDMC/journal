/**
 * Get whether a user is logged in or not
 */
export function isLoggedIn(): boolean {
    return localStorage.getItem("journal-username") != undefined;
}

/**
 * Get the logged in user's username
 */
export function getUserName() {
    return localStorage.getItem("journal-username") ?? "User";
}
