import { createRegister } from "./pageRegister.js";
import { createLogin } from "./pageLogin.js";
import { createFeedPage } from "./pagePost.js";
import { rrenderErrorPage } from "./errorPage.js";
const publicPages = ['/login', '/register']



// const routes {
//     "/": createFeedPage
// }
const authChannel = new BroadcastChannel('auth_sync');

authChannel.onmessage = (event) => {
    if (event.data.type === 'LOGOUT') {
        navigateTo('/login')
    }
    if (event.data.type === 'LOGIN') {
        navigateTo('/')
    }
}

export async function broadcastLogout() {
    authChannel.postMessage({ type: 'LOGOUT' })
    navigateTo('/login')
}

export function broadcastLogin() {
    authChannel.postMessage({ type: 'LOGIN' })
    navigateTo('/')
}


export async function router() {
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
    }else{
        rrenderErrorPage({message:"Page not found"},404)
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
