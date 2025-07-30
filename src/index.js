import * as core from "@actions/core"
import * as github from "@actions/github"
import axios from "axios"
import https from "https"

// Configure axios to ignore SSL certificates (only for development)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const API_BASE_URL = "https://humix.blgianini.com:30443/api/v1"

// Create simpler axios instance
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  timeout: 60000
})

async function getToken() {
    try {
        core.info("Attempting to authenticate with ArgoCD...")
        
        // Try with basic fetch approach first
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
            agent: new https.Agent({
                rejectUnauthorized: false
            })
        })
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        core.info("Authentication successful")
        return data.token
        
    } catch (error) {
        core.error(`Fetch failed, trying axios: ${error.message}`)
        
        // Fallback to axios
        try {
            const response = await axiosInstance.post(`${API_BASE_URL}/session`, {
                username: "admin",
                password: "NC3m8MoIaZ7li8ln"
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "ArgoCD-GitHub-Action/1.0"
                }
            })
            
            core.info("Authentication successful with axios")
            return response.data.token
        } catch (axiosError) {
            core.error(`Authentication failed: ${axiosError.message}`)
            if (axiosError.code) {
                core.error(`Error code: ${axiosError.code}`)
            }
            throw new Error(`Failed to get token: ${axiosError.message}`)
        }
    }
}

async function getAppByName(appName, token) {
    try {
        const response = await axiosInstance.get(`${API_BASE_URL}/applications/${appName}`, {
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

