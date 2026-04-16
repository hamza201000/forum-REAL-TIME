import { navigateTo, broadcastLogin, broadcastLogout } from "./router.js";
import { checkError } from "./validation.js";
import { renderErrorPage } from "./errorPage.js";

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


        if (res.status >= 400 && res.status < 500) {
            checkError(result.error);
            return;
        }


        if (!res.ok) {
            renderErrorPage({ message: result.error },res.status);
            return;
        }


        if (method === "GET") {
            return result;
        }


        if (route === "/api/register") {
            navigateTo("/login");
        } else if (route === "/api/login") {
            broadcastLogin();
        } else if (route === "/api/logout") {
            broadcastLogout();
        } else if (route === "/api/post") {
            navigateTo("/");
        }

        return result;

    } catch (error) {

        console.error("Fetch error:", error);
        renderErrorPage({ message: "Network error. Check your connection and try again." },500);
    }
}

