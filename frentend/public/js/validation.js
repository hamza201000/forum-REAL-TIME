


export function showError(message, element) {
    const Field = document.querySelector(element);
    const p = document.createElement("p");
    p.className = "invalid";
    p.textContent = message;
    Field.appendChild(p);
}

export function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}



export function checkUser(type, user) {
    document.querySelectorAll(".invalid").forEach(el => el.remove());
    if (type === "register") {
        if (!user.firstname || user.firstname.length < 3) {
            showError(
                user.firstname ? "First name must be at least 3 characters" : "First name is required",
                ".FirstName"
            );
            return false;
        }

        if (!user.lastname || user.lastname.length < 3) {
            showError(
                user.lastname ? "Last name must be at least 3 characters" : "Last name is required",
                ".LastName"
            );
            return false;
        }

        if (!user.age) {
            showError("Age is required", ".Age");
            return false;
        }

        if (Number(user.age) < 18) {
            showError("You must be at least 18 years old", ".Age");
            return false;
        }
        if (!user.nickname) {
            showError("Nickname is required", ".Nickname");
            return false;
        }
        if (!user.email) {
            showError("Email is required", ".Email");
            return false;
        }
        if (!validateEmail(user.email)) {
            showError("Email is not valid", ".Email");
            return false;
        }
        if (!user.password) {
            showError("Password is required", ".Password");
            return false;
        }

        if (user.password.length < 8) {
            showError("Password must be at least 8 characters", ".Password");
            return false;
        }

    } else if (type === "login") {
        if (!user.user) {
            showError("Email or username is required", ".user");
            return false;
        }
        if (!user.password) {
            showError("Password is required", ".password");
            return false;
        }
    }
    return true;
}

