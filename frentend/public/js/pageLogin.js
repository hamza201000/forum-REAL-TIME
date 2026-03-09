import { checkUser } from "./validation.js"
import { sendData } from "./api.js"
import { navigateTo } from "./router.js"

export function createLogin() {
    const app = document.getElementById("app")

    app.innerHTML = `<form id='userForm' class='card'>

<div class='field'>

<div class='field user'>
    
    <label>Email or username</label>
    <input id='Email' type='text' name ='user'>
</div>


<div class='field password'>
    <label>Password</label>
    <input id='Password' type='password' name ='password'>
</div>

</div>
<br>
<button class='btn' type='submit'>Sign in</button>
<br>
<p class='login-link'>Don't have an account?
    <a href="" id='register-link'>Sign up</a>
</p>

</form>
`


    const form = document.getElementById("userForm")
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault()
            const formData = new FormData(form)
            const data = (Object.fromEntries(formData.entries()))
            if (!checkUser("login", data)) {
                return
            }
            sendData(data, "/api/login")
        })
    }

    const registerlink = document.getElementById("register-link")
    if (registerlink) {
        registerlink.addEventListener("click", function (e) {
            e.preventDefault();
            navigateTo('/register');
            
        });
    }

}


