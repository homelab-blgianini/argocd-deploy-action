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

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    let response = await axios.request(reqOptions);
    return response.data.token
}

async function getAppByName(nome, token){
  let headersList = {
  "Accept": "*/*",
  "User-Agent": "Thunder Client (https://www.thunderclient.com)",
  "Authorization": "Bearer " + token
  }

  let reqOptions = {
    url: "https://humix.blgianini.com:30443/api/v1/applications/" + nome,
    method: "GET",
    headers: headersList,
  }

  let response = await axios.request(reqOptions);
  return response.data
}

try {
  const token = core.info(await getToken(core.getInput("token-argocd")))

  core.info(await getAppByName(core.getInput("nome-aplicacao", token)))

  // Get the current time and set it as an output variable
  const time = new Date().toTimeString();
  core.setOutput("time", time);

} catch (error) {
  core.setFailed(error.message);
}

