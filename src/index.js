import * as core from "@actions/core"
import * as github from "@actions/github"
import axios from "axios"

async function getToken(senha){
    let headersList = {
    "Accept": "*/*",
    "User-Agent": "Thunder Client (https://www.thunderclient.com)",
    "Content-Type": "application/json" 
    }

    let bodyContent = JSON.stringify({"username":"admin","password":"NC3m8MoIaZ7li8ln"});

    let reqOptions = {
    url: "https://humix.blgianini.com:30443/api/v1/session",
    method: "POST",
    headers: headersList,
    data: bodyContent,
    }

    let response = await axios.request(reqOptions);
    return response.data
}

try {
  core.info(await getToken(core.getInput("token-argocd")))

  // Get the current time and set it as an output variable
  const time = new Date().toTimeString();
  core.setOutput("time", time);
  
} catch (error) {
  core.setFailed(error.message);
}