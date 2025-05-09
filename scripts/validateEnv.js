const fs = require('fs')
const path = require('path')

// Read and parse .env-sample to get required variables
const getRequiredEnvVariables = () => {
  const envSamplePath = path.join(process.cwd(), '.env-sample')
  const envSampleContent = fs.readFileSync(envSamplePath, 'utf8')

  // Split by newlines and filter out empty lines
  const lines = envSampleContent.split('\n').filter((line) => line.trim())

  const requiredVars = []
  let isRequired = false

  lines.forEach((line) => {
    // Check if line is a comment
    if (line.trim().startsWith('#')) {
      // Check if this comment marks a variable as required
      if (line.includes('🟢 REQUIRED FOR PRODUCTION')) isRequired = true
      return
    }

    // Parse variable line
    const [key, value] = line.split('=')
    if (key && value) {
      const varName = key.trim()
      if (isRequired) requiredVars.push(varName)
      isRequired = false
    }
  })

  return requiredVars
}

const REQUIRED_ENV_VARIABLES = getRequiredEnvVariables()

const IMPORTANT_PRODUCTION_VARIABLES_TO_DOUBLE_CHECK = [
  { name: 'RELAYER_URL', value: 'https://relayer.ambire.com' },
  { name: 'VELCRO_URL', value: 'https://relayer.ambire.com/velcro-v3' }
]

const validateEnvVariables = (environment) => {
  // Read .env file
  const envPath = path.join(process.cwd(), '.env')
  let envContent = {}

  try {
    const envFileContent = fs.readFileSync(envPath, 'utf8')
    envContent = envFileContent
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .reduce((acc, line) => {
        // Use regex to properly handle quoted values
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()
          // Remove surrounding quotes if they exist
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1)
          }
          acc[key] = value
        }
        return acc
      }, {})
  } catch (error) {
    throw new Error('Could not read .env file. Make sure it exists and is properly formatted.')
  }

  // Validate required variables
  REQUIRED_ENV_VARIABLES.forEach((variable) => {
    if (!envContent[variable] || envContent[variable] === '""') {
      throw new Error(`Missing required environment variable in .env: ${variable}`)
    } else if (environment === 'production') {
      const value = envContent[variable]
      const productionVariable = IMPORTANT_PRODUCTION_VARIABLES_TO_DOUBLE_CHECK.find(
        (v) => v.name === variable
      )

      if (productionVariable && productionVariable.value !== value) {
        throw new Error(`Invalid production environment variable: ${variable} = ${value}`)
      }
    }
  })
}

module.exports = {
  validateEnvVariables
}
