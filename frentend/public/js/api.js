
import { navigateTo } from "./router.js";
import {  showError } from "./validation.js"


export async function sendData(data, route, method = "POST") {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (method !== "GET") {
        options.body = JSON.stringify(data);
    }
try{
    const res = await fetch(route, options);
        const result = await res.json();
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
        if (method==="GET"){
            console.log(result);
            
            return result
        }
        
        if (route === "/api/register") {
            console.log('user created successfully');
            navigateTo("/login");
        }else if (route === "/api/login") {
            console.log('user logged in successfully');
            navigateTo("/");
            console.log(result);
        }else if (route === "/api/logout") {
            console.log('user logged out successfully');
            navigateTo("/login");
        }else if (route="/api/post"){
            navigateTo("/")
        }
    } catch (error) {
        console.log('error in sending data to backend');
        console.error(error)
    }
}
