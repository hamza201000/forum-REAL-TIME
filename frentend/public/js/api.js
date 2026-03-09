import { createLogin } from "./pageLogin.js"
import {  showError } from "./validation.js"


export async function sendData(data,route) {
    try {
        console.log(data);
        const res = await fetch(route, {
            method: "post",
            headers: {
                "content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        const result = await res.json()

        if (res.status === 409) {

            console.log(result.error);
            if (result.error.toLowerCase().includes("email")) {
                showError(result.error, ".Email");
                return;
            }
            if (result.error.toLowerCase().includes("username")) {
                showError(result.error, ".Nickname");
                return;
            }
        }
        console.log(res.status);
        
        if (res.status === 401) {
            console.log(result.error);
            showError(result.error, ".password");
            return;
        }
        if (res.status === 404) {   
            console.log(result.error);
            showError(result.error, ".user");
            return;
        }
        if (!res.ok) {
            console.log('internal server');
            return
        }
        if (route === "/api/register") {
            console.log('user created successfully');
            createLogin()
        }else if (route === "/api/login") {
            console.log('user logged in successfully');
            // youness here you can redirect the user to the home page or dashboard here
            // localStorage.setItem("token", result.token)
            
        }
    } catch (error) {
        console.log('error in sending data to backend');
        console.error(error)
    }
}