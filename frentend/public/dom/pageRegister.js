
import { createLogin } from "./pageLogin.js"
import { sendData } from "./api.js"
import { checkUser, toLowerObject } from "./validation.js"
export function createRegister() {
    const app = document.getElementById("app")
    app.innerHTML = `<form id="userForm" class="card">
    
    <div class="row">
        
        <div class="field FirstName">
            
            <label>First name</label>
            <input type="text"  name="firstname" >
        </div>
        <div class="field LastName">
            <label>Last name</label>
            <input type="text"  name="lastname" >
        </div>
        <div class="field Nickname">
            <label>Nickname</label>
            <input type="text" name="nickname" >
        </div>
        <div class="field Age">
            <label>Age</label>
            <input type="number"  name="age" >
        </div>
    </div>
    <div class="field Gender">
        <label>Select Gender:</label>
        <select class="slc" name="gender">
            <option value="" >Select Gender</option>
            <option value="Male" class="slc" name="gender">Male</option>
          
            <option value="Female" class="slc" name="gender">Female</option>
        </select>
    </div>
    <div class="field Email">
        <label>Email</label>
        <input id="Email" type="text"   name="email" >
    </div>
    <div class="field Password">
        <label>Password</label>
        <input id="Password" type="password" name="password" >
    </div>
   
    <button class="btn" type="submit">Create account</button>
    <p class="login-link">Already have an account?
    <a href="#" id="login-link">Sign in</a>
    </p>
</form>`

    const button = document.querySelector(".btn")
    button.addEventListener("click", function (e) {
        e.preventDefault()
        const form = document.getElementById("userForm")
        const formData = new FormData(form)
        const data = toLowerObject(Object.fromEntries(formData.entries()))
        if (!checkUser("register", data)) {
            return
        }
        sendData(data, "/register")
    })


    const loginLink = document.getElementById("login-link")
    loginLink.addEventListener("click", function (e) {
        e.preventDefault()
        createLogin()
    })
}






