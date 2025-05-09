import logger from 'loglevel'

import {
  BROWSER_EXTENSION_DEFAULT_LOG_LEVEL_DEV,
  BROWSER_EXTENSION_DEFAULT_LOG_LEVEL_PROD
} from '@env'

logger.setDefaultLevel(
  process.env.APP_ENV === 'production'
    ? BROWSER_EXTENSION_DEFAULT_LOG_LEVEL_PROD || 'warn'
    : BROWSER_EXTENSION_DEFAULT_LOG_LEVEL_DEV || 'trace'
)

export const logInfoWithPrefix = (event: any, ...args: any) => {
  logger.info(
    `%c [Ambire] (${new Date().toLocaleTimeString()}) ${event}`,
    `font-weight: bold; background-color: ${'#A36AF8'}; color: white;`,
    ...args
  )
}

export const logWarnWithPrefix = (event: any, ...args: any) => {
  logger.warn(
    `%c [Ambire] (${new Date().toLocaleTimeString()}) ${event}`,
    `font-weight: bold; background-color: ${'#A36AF8'}; color: white;`,
    ...args
  )
}

export default logger
