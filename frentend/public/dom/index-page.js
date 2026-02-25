import { createRegister } from "./pageRegister.js";
import { createLogin } from "./pageLogin.js";

createRegister()


const registerLink = document.getElementById("register-link")


const loginLink = document.getElementById("login-link")
if (registerLink) {
    registerLink.addEventListener("click", function (e) {
        e.preventDefault()
        createRegister()
    })
}

if (loginLink) {
    loginLink.addEventListener("click", function (e) {
        e.preventDefault()
        createLogin()
    })
}