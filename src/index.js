import * as core from "@actions/core"
import * as github from "@actions/github"
import axios from "axios"

// Configure axios to ignore SSL certificates (only for development)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const API_BASE_URL = "https://humix.blgianini.com:30443/api/v1"

async function getToken() {
    try {
        const response = await axios.post(`${API_BASE_URL}/session`, {
            username: "admin",
            password: "NC3m8MoIaZ7li8ln" // TODO: Move to environment variable
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        })
        
        return response.data.token
    } catch (error) {
        throw new Error(`Failed to get token: ${error.message}`)
    }
}

async function getAppByName(appName, token) {
    try {
        const response = await axios.get(`${API_BASE_URL}/applications/${appName}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        
        return response.data
    } catch (error) {
        throw new Error(`Failed to get application ${appName}: ${error.message}`)
    }
}

async function main() {
    try {
        const appName = core.getInput("nome-aplicacao")
        const token = core.getInput("ARGOCD_TOKEN")
        
        if (!appName) {
            throw new Error("Application name is required")
        }
        
        if (!token) {
            throw new Error("ARGOCD_TOKEN secret is required")
        }
        
        core.info(`Getting information for application: ${appName}`)
        
        const appInfo = await getAppByName(appName, token)
        
        core.info(`Application info: ${JSON.stringify(appInfo, null, 2)}`)
        
        // Set the current time as an output variable
        const time = new Date().toTimeString()
        core.setOutput("time", time)
        
        core.info("Action completed successfully")
        
    } catch (error) {
        core.setFailed(error.message)
    }
}

main()

