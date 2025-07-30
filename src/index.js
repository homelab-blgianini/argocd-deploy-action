import * as core from "@actions/core"
import * as github from "@actions/github"
import https from "https"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Configure to ignore SSL certificates (only for development)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const API_BASE_URL = "https://humix.blgianini.com:30443/api/v1"

// Create HTTPS agent for fetch requests
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
})

async function getToken() {
    try {
        core.info("Attempting to authenticate with ArgoCD using curl...")
        
        const curlCommand = `curl -k -s -H "Content-Type: application/json" -d '{"username":"admin","password":"NC3m8MoIaZ7li8ln"}' ${API_BASE_URL}/session`
        
        core.info(`Executing: ${curlCommand.replace('NC3m8MoIaZ7li8ln', '***')}`)
        
        const { stdout, stderr } = await execAsync(curlCommand)
        
        if (stderr) {
            core.error(`Curl stderr: ${stderr}`)
        }
        
        if (!stdout) {
            throw new Error("No response from curl command")
        }
        
        core.info(`Curl response: ${stdout}`)
        
        const data = JSON.parse(stdout)
        
        if (!data.token) {
            throw new Error("No token in response")
        }
        
        core.info("Authentication successful with curl")
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

