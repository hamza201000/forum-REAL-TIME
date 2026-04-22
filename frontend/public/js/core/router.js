import { createRegister } from "../pages/pageRegister.js";
import { createLogin } from "../pages/pageLogin.js";
import { createFeedPage } from "../pages/pagePost.js";
import { renderErrorPage, showToast,cor } from "../pages/errorPage.js";
const publicPages = ['/login', '/register']
let i=0

const authChannel = new BroadcastChannel('auth_sync');

authChannel.onmessage = (event) => {
    if (event.data.type === 'LOGOUT') {
        cor("/login")
    }
    if (event.data.type === 'LOGIN') {
        cor("/")
    }
}

export async function broadcastLogout() {
    authChannel.postMessage({ type: 'LOGOUT' })
    cor("/login")
    
}

export function broadcastLogin() {
    authChannel.postMessage({ type: 'LOGIN' })
    cor("/")
    // navigateTo('/')
}


export async function router() {
    i++
    console.log(i);
    
    let path = window.location.pathname
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
        createFeedPage(session.username);
    } else if (path == '/login') {
        createLogin()
    } else if (path == '/register') {
        createRegister()
    } else {
        renderErrorPage({ message: "Page not found" }, 404)
    }
}

async function checkSession() {
    try {
        let res = await fetch("/api/session")
        if (!res.ok) return null
        const data = await res.json()
        return data
    } catch (error) {
        return null
    }
}

export function navigateTo(path) {
    window.history.pushState({}, '', path);
    router()
}
