import { navigateTo } from "./router.js";



export function createPostPage() {
    const app = document.getElementById("app")

    app.innerHTML = `<form id='userForm' class='card'>

<div class='field'>

<div class='field user'>
    
    <label>title</label>
    <input id='Email' type='text' name ='user'>
</div>


<div class='field password'>
    <label>post</label>
    <input id='Password'  name ='password'>
</div>

</div>
<br>
<button class='btn' type='submit'>post</button>
<br>
<p class='login-link'>Don't have an account?
    <a href='' id='register-link'>Sign up</a>
</p>
</form>
`
    const registerlink = document.getElementById("register-link")
    if (registerlink) {
        registerlink.addEventListener("click", function (e) {
            e.preventDefault();
            navigateTo('/register');
            
        });
    }
}