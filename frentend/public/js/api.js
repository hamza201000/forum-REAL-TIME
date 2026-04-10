
import { navigateTo,broadcastLogin,broadcastLogout } from "./router.js";
import { showError } from "./validation.js"


export async function sendData(data, route, method = "POST") {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };
    if (method !== "GET") {
        options.body = JSON.stringify(data);
    }
    try {

        const res = await fetch(route, options);
        const result = await res.json();
        if (res.status === 409) {

            (result.error);
            if (result.error.toLowerCase().includes("email")) {
                showError(result.error, ".Email");
                return;
            }
            if (result.error.toLowerCase().includes("username")) {
                showError(result.error, ".Nickname");
                return;
            }
        }
        (res.status);

        if (res.status === 401) {
            (result.error);
            showError(result.error, ".password");
            return;
        }
        if (res.status === 404) {
            (result.error);
            showError(result.error, ".user");
            return;
        }

        if (!res.ok) {
            ('internal server');
            return
        }
        if (method === "GET") {
            return result
        }
        if (route === "/api/register") {
            navigateTo("/login");
            return
        } else if (route === "/api/login") {
            broadcastLogin();
            return
        } else if (route === "/api/logout") {
            broadcastLogout();
            return
        } else if (route === "/api/post") {
            navigateTo("/")
            return
        }
        return result
    } catch (error) {
        console.error(error)
    }
}
