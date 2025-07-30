import * as core from "@actions/core"
import * as github from "@actions/github"
import axios from "axios"
import https from "https"

// Configure axios to ignore SSL certificates (only for development)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const API_BASE_URL = "https://humix.blgianini.com:30443/api/v1"

// Create axios instance with custom HTTPS agent
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: false,
    maxSockets: 1,
    secureProtocol: 'TLSv1_2_method',
    ciphers: 'ALL'
  }),
  timeout: 30000,
  maxRedirects: 5
})

async function getToken() {
    try {
        core.info("Attempting to authenticate with ArgoCD...")
        
        const response = await axiosInstance.post(`${API_BASE_URL}/session`, {
            username: "admin",
            password: "NC3m8MoIaZ7li8ln"
        }, {
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "ArgoCD-GitHub-Action/1.0"
            }
        })
        
        core.info("Authentication successful")
        return response.data.token
    } catch (error) {
        core.error(`Authentication failed: ${error.message}`)
        if (error.code) {
            core.error(`Error code: ${error.code}`)
        }
        throw new Error(`Failed to get token: ${error.message}`)
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

