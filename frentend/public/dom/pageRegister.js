
import { createLogin } from "./pageLogin.js"
export function createRegister() {
    const app = document.getElementById("app")
    app.innerHTML = `<form id="userForm" class="card">
    
    <div class="row">
        
        <div class="field">
            
            <label>First name</label>
            <input type="text" id="Firstname" name="Firstname" >
        </div>
        <div class="field">
            <label>Last name</label>
            <input type="text" id="Lastname" name="Lastname" >
        </div>
        <div class="field">
            <label>Nickname</label>
            <input type="text" id="Nickname" name="Nickname" >
        </div>
        <div class="field">
            <label>Age</label>
            <input type="number" id="Age" name="Age" >
        </div>
    </div>
    <div class="field Gender">
        <label>Select Gender:</label>
        <select class="slc">
            <option value="Male" class="slc">Male</option>
            <option value="Female" class="slc">Female</option>
        </select>
    </div>
    <div class="field Email">
        <label>Email</label>
        <input id="Email" type="text"   name="Email" >
    </div>
    <div class="field Password">
        <label>Password</label>
        <input id="Password" type="password" name="Password" >
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
    const data = Object.fromEntries(formData.entries())

    if (!checkUser("register", data.Firstname, data.Lastname, data.Age, data.Nickname, data.Email, data.Password)) {
        return
    }
    sendData(data)
})


const loginLink = document.getElementById("login-link")
        loginLink.addEventListener("click", function (e) {
            e.preventDefault()
            createLogin()
        })
}

function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

function checkUser(type, firstName, lastName, age, neckname, email, password) {

    if (type === "register") {
        const p = document.createElement("p")
        document.body.querySelectorAll(".invalid").forEach(element => element.remove());
        
        if (firstName.length < 3) {
            const fn = document.body.querySelector(".field:nth-child(1)")
            fn.querySelectorAll("p").forEach(element => element.remove());
            if (firstName.length === 0) {
                p.textContent = "first name is required"
                p.className="invalid"
                fn.append(p)
                return false
            }
            p.textContent = "first name must be at least 3 characters"
            p.className="invalid"
            fn.append(p)
            return false
        }
        if (lastName.length < 3) {
            const ln = document.body.querySelector(".field:nth-child(2)")
            ln.querySelectorAll("p").forEach(element => element.remove());
            if (lastName.length === 0) {
                p.textContent = "last name is required"
                p.className="invalid"
                ln.append(p)
                return false
            }
            p.textContent = "last name must be at least 3 characters"
            p.className="invalid"
            ln.append(p)
            return false
        }
        if (age < 18) {
            const ag = document.body.querySelector(".field:nth-child(4)")
            ag.querySelectorAll("p").forEach(element => element.remove());
            if (age.length === 0) {
                p.textContent = "age is required"
                p.className="invalid"
                ag.append(p)
                return false
            }
            p.textContent = "you must be at least 18 years old"
            p.className="invalid"
            ag.append(p)
            return false
        }
        if (neckname.length ===0) {
            const nn = document.body.querySelector(".field:nth-child(3)")
            nn.querySelectorAll("p").forEach(element => element.remove());
            if (neckname.length === 0) {
                p.textContent = "neckname is required"
                p.className="invalid"
                nn.append(p)
                return false
            }
            p.textContent = "neckname is required"
            p.className="invalid"
            nn.append(p)
            return false
        }

        if (email.length === 0) {
            const Eml = document.body.querySelector(".Email")
            Eml.querySelectorAll("p").forEach(element => element.remove());
            p.textContent = "email is required"
            p.className="invalid"
            Eml.append(p)
            return false
        }

        if (!validateEmail(email)) {
            const Eml = document.body.querySelector(".Email")
            Eml.querySelectorAll("p").forEach(element => element.remove());
            p.textContent = "email is not valid"
            p.className="invalid"
            Eml.append(p)
            return false
        }
        if (password.length < 8) {
            const psw = document.body.querySelector(".Password")
            psw.querySelectorAll("p").forEach(element => element.remove());
            if (password.length === 0) {
                p.textContent = "password is required"
                p.className="invalid"
                psw.append(p)
                return false
            }
            p.textContent = "password must be at least 8 characters"
            p.className="invalid"
            psw.append(p)
            return false
        }
    }else if (type === "login") {
        if (email.length === 0) {
            const Eml = document.body.querySelector(".Email")
            Eml.querySelectorAll("p").forEach(element => element.remove());
            p.textContent = "email is required"
            p.className="invalid"
            Eml.append(p)
            return false
        }

        if (!validateEmail(email)) {
            const Eml = document.body.querySelector(".Email")
            Eml.querySelectorAll("p").forEach(element => element.remove());
            p.textContent = "email is not valid"
            p.className="invalid"
            Eml.append(p)
            return false
        }
        if (password.length === 0) {
            const psw = document.body.querySelector(".Password")
            psw.querySelectorAll("p").forEach(element => element.remove());
            p.textContent = "password is required"
            p.className="invalid"
            psw.append(p)
            return false
        }
    }
    return true
}

async function sendData(data) {
    try {
        console.log(data);

        const res = await fetch("/register", {
            method: "post",
            headers: {
                "content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        if (res.ok) {
            console.log('daz ok');

        } else {
            console.log('kayn mockil f back');
            throw new Error()
        }
        //const result = await res.json()
        // console.log(result)
    } catch (error) {
        console.log('error in sending data to backend');
        console.error(error)
    }
    
}
