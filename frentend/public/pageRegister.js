
const card = document.createElement("form")
card.id = "userForm"
card.className = "card"
const list = ["First name", "Last name", "Nickname", "Age", "Gender", "Email", "Password", "Confirm password"]
const listId = ["First-name", "Last-name", "Nickname", "Age", "Gender", "Email", "Password", "Confirm-password"]

const Fullname = document.createElement('div')
Fullname.className = "row"
let i = 0
while (i < 4) {
    const name = document.createElement("div")
    name.className = "field"
    const label1 = document.createElement("label")
    label1.textContent = list[i]
    const inp = document.createElement("input")
    inp.type = "text"
    inp.id = listId[i]
    name.append(label1, inp)
    Fullname.appendChild(name)
    card.appendChild(Fullname)
    i++
}
while (i < list.length) {
    const name = document.createElement("div")

    name.classList.add("field", listId[i])
    const label1 = document.createElement("label")
    label1.textContent = list[i]
    if (list[i] == "Gender") {
        label1.textContent = "Select Gender:"
        const selct = document.createElement("select")
        const opt1 = document.createElement("option")
        const opt2 = document.createElement("option")
        opt1.value = "Male"
        opt1.textContent = "Male"
        opt2.value = "Female"
        opt2.textContent = "Female"
        opt1.className = "slc"
        opt2.className = "slc"
        selct.className = "slc"
        selct.append(opt1, opt2)
        name.append(label1)
        name.append(selct)
        card.appendChild(name)
        i++
        continue
    }
    const inp = document.createElement("input")
    inp.id = listId[i]
    inp.type = "text"
    name.append(label1, inp)

    card.appendChild(name)
    i++
}

const button = document.createElement("button")

button.className = "btn"
button.type = "submit"
button.textContent = "Create account"
card.appendChild(button)

const p = document.createElement("p")
p.className = "login-link"
p.textContent = "Already have an account?"
const a = document.createElement("a")
a.textContent = "Sign in"
a.href = "#"
p.appendChild(a)
card.appendChild(p)
document.body.appendChild(card)

function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}




function checkUser(type,neckname, email, password, confPassword) {

    if (type === "register") {
        const p = document.createElement("p")

        if (password !== confPassword) {
            const psw = card.querySelector(".Password")
            // console.log(Eml.p);
            psw.querySelectorAll("p").forEach(element => element.remove());
            p.textContent = "retry password"

            psw.append(p)
        } else if (!validateEmail(email.value)) {
            const Eml = card.querySelector(".Email")
            // console.log(Eml.p);
            Eml.querySelectorAll("p").forEach(element => element.remove());
            p.textContent = "Email Invalid"
            Eml.append(p)
        }
    }
}



button.addEventListener("click", function (e) {
    const neckname = document.getElementById("Nickname").value
    const email = document.getElementById("Email")
    const password = document.getElementById("Password").value
    const confPassword = document.getElementById("Confirm-password").value
    const data = {
        neckname: neckname,
        email: email.value,
        password: password,
        confPassword: confPassword,
    }
    e.preventDefault()
    checkUser("register", neckname, email, password, confPassword)
    sendData(data)
})




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