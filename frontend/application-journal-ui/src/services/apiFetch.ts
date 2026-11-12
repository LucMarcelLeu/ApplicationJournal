import keycloak from "../auth/keycloak";

export async function apiFetch(
    input: RequestInfo | URL,
    init: RequestInit = {},
): Promise<Response> {

    if (!keycloak.authenticated) {
        throw new Error("Benutzer ist nicht angemeldet.");
    }

    // Token erneuern, falls es innerhalb der nächsten 30 Sekunden abläuft.
    await keycloak.updateToken(30);

    const token = keycloak.token;

    if (!token) {
        throw new Error("Kein gültiges Access Token vorhanden.");
    }

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(input, {
        ...init,
        headers,
    });
}