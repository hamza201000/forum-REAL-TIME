import { createRegister } from "./pageRegister.js";
import { createLogin } from "./pageLogin.js";
import { createFeedPage } from "./pagePost.js";
const publicPages = ['/login', '/register']

export async function router() {
    let path = window.location.pathname
    console.log(path);
    const session = await checkSession()

    if (!session && !publicPages.includes(path)) {
        navigateTo('/login')
        return
    }
    if (session && publicPages.includes(path)) {
        navigateTo('/')
        return
    }
    if (path == '/') {
        createFeedPage(session.username)
    } else if (path == '/login') {
        createLogin()
    } else if (path == '/register') {
        createRegister()
    }
}

async function checkSession() {
    try {
        let res = await fetch("/api/session")
        if (!res.ok) return null
        const data = await res.json()
        return data
    } catch (error) {
        console.log("session check failed:", error);
        return null
    }
}

export function navigateTo(path) {
    window.history.pushState({}, '', path);
    router()
}
