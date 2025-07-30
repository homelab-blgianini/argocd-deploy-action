import * as core from "@actions/core"
import * as github from "@actions/github"
import https from "https"

// Configure to ignore SSL certificates (only for development)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const API_BASE_URL = "https://humix.blgianini.com:30443/api/v1"

// Create HTTPS agent for fetch requests
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
})

async function getToken() {
    try {
        core.info("Attempting to authenticate with ArgoCD...")
        
        const response = await fetch(`${API_BASE_URL}/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ArgoCD-GitHub-Action/1.0'
            },
            body: JSON.stringify({
                username: "admin",
                password: "NC3m8MoIaZ7li8ln"
            }),
            agent: httpsAgent
        })
        
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
        }
        
        const data = await response.json()
        core.info("Authentication successful")
        return data.token
        
    } catch (error) {
        core.error(`Authentication failed: ${error.message}`)
        throw new Error(`Failed to get token: ${error.message}`)
    }
}

async function getAppByName(appName, token) {
    try {
        core.info(`Fetching application: ${appName}`)
        
        const response = await fetch(`${API_BASE_URL}/applications/${appName}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'ArgoCD-GitHub-Action/1.0'
            },
            agent: httpsAgent
        })
        
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
        }
        
        const data = await response.json()
        core.info("Application data retrieved successfully")
        return data
        
    } catch (error) {
        core.error(`Failed to get application: ${error.message}`)
        throw new Error(`Failed to get application ${appName}: ${error.message}`)
    }
}

async function main() {
    try {
        const appName = core.getInput("nome-aplicacao")
        const token = await getToken()
        
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

