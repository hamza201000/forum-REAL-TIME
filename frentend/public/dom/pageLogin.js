import { createRegister } from "./pageRegister.js"


export function createLogin() {
    const app = document.getElementById("app")
    
    app.innerHTML = `<form id='userForm' class='card'>

<div class='field'>

<div class='field Email'>
    
    <label>Email or username</label>
    <input id='Email' type='text'>
</div>


<div class='field Password'>
    <label>Password</label>
    <input id='Password' type='password'>
</div>

</div>
<br>
<button class='btn' type='submit'>Sign in</button>
<br>
<p class='login-link'>Don't have an account?
    <a href='#' id='register-link'>Sign up</a>
</p>

</form>
`
    const registerLink = document.getElementById("register-link")
    registerLink.addEventListener("click", function (e) {
        e.preventDefault()
        createRegister()
    })
}