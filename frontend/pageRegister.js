
const card = document.createElement("div")
card.className = "card"
const list = ["First name", "Last name", "Nickname", "Age", "Gender", "Email", "Password", "Confirm password"]
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
    name.append(label1, inp)
    Fullname.appendChild(name)
    card.appendChild(Fullname)
    i++
}
while (i < list.length) {
    const name = document.createElement("div")
    name.className = "field"
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
        opt1.className="slc"
        opt2.className="slc"
        selct.className="slc"
        selct.append(opt1, opt2)
        name.append(label1)
        name.append(selct)
        card.appendChild(name)
        i++
        continue
    }
    const inp = document.createElement("input")
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



