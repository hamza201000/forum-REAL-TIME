
import { router } from "./router.js";


export function renderErrorPage(err, statusCode) {
    const app = document.getElementById("app");

    const message = err?.message || "An unexpected error occurred.";
    const code = statusCode || err?.status || err?.statusCode || null;

    app.innerHTML = `
        <nav class="navbar">
            <span class="navbar-brand" id="nav-home">Forum</span>
        </nav>

        <div class="error-page">
            <div class="error-card">

                <div class="error-icon">⚠️</div>

                ${code ? `<div class="error-status">${code}</div>` : ""}

                <div class="error-body">
                    <h1 class="error-title">Something went wrong</h1>
                    <p class="error-message">${message}</p>
                </div>

                <button class="btn error-btn" onclick="location.reload()">
                    Try again
                </button>

                <div class="error-home-link">
                    <a href="/">Go back home</a>
                </div>

            </div>
        </div>
    `;
}


function cor() {
window.history.replaceState({}, '', "/")
router()
}

export function rrenderErrorPage(err, statusCode) {
    const app = document.getElementById("app");

    const message = err?.message || "An unexpected error occurred.";
    const code = statusCode || err?.status || err?.statusCode || null;

    app.innerHTML = `
        <nav class="navbar">
            <span class="navbar-brand" id="nav-home">Forum</span>
        </nav>

        <div class="error-page">
            <div class="error-card">

                <div class="error-icon">⚠️</div>

                ${code ? `<div class="error-status">${code}</div>` : ""}

                <div class="error-body">
                    <h1 class="error-title">Something went wrong</h1>
                    <p class="error-message">${message}</p>
                </div>

                <button class="btn error-btn" >
                    Try again
                </button>

                <div class="error-home-link">
                    <a href="/">Go back home</a>
                </div>

            </div>
        </div>
    `;

   const f = document.querySelector(".btn.error-btn")
f.addEventListener('click', cor)

}

