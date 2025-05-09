// The 'react-native-dotenv' package doesn't work in the NodeJS context (and
// with commonjs imports), so alternatively, use 'dotend' package to load the
// environment variables from the .env file.
require('dotenv').config()

const createExpoWebpackConfigAsync = require('@expo/webpack-config')
const webpack = require('webpack')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const WebExtensionPlugin = require('webpack-target-webextension')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const expoEnv = require('@expo/webpack-config/env')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { validateEnvVariables } = require('./scripts/validateEnv')
const appJSON = require('./app.json')
const AssetReplacePlugin = require('./plugins/AssetReplacePlugin')

const isWebkit = process.env.WEB_ENGINE?.startsWith('webkit')
const isGecko = process.env.WEB_ENGINE === 'gecko'
const isSafari = process.env.WEB_ENGINE === 'webkit-safari'
const outputPath = process.env.WEBPACK_BUILD_OUTPUT_PATH
const isExtension =
  outputPath.includes('webkit') || outputPath.includes('gecko') || outputPath.includes('safari')
const isBenzin = outputPath.includes('benzin')
const isLegends = outputPath.includes('legends')

// style.css output file for WEB_ENGINE: GECKO
function processStyleGecko(content) {
  const style = content.toString()
  // Firefox extensions max window height is 600px
  // so IF min-height is changed above 600, this needs to be put back
  // style = style.replace('min-height: 730px;', 'min-height: 600px;')

  return style
}

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv)

  function processManifest(content) {
    const manifest = JSON.parse(content.toString())
    if (config.mode === 'development') {
      manifest.name = `${manifest.name} (DEV build)`
      const devBuildIcons = {}
      Object.keys(manifest.icons).forEach((size) => {
        const iconPath = manifest.icons[size]
        const dotIndex = iconPath.lastIndexOf('.')
        const prefix = iconPath.slice(0, dotIndex)
        const extension = iconPath.slice(dotIndex)
        devBuildIcons[size] = `${prefix}-dev-build-ONLY${extension}`
      })
      manifest.icons = devBuildIcons
    }
    // Note: Safari allows up to 100 characters, all others allow up to 132 characters
    manifest.description =
      'Fast & secure Web3 wallet to supercharge your account on Ethereum and EVM networks.'

    // Maintain the same versioning between the web extension and the mobile app
    manifest.version = appJSON.expo.version

    // Directives to disallow a set of script-related privileges for a
    // specific page. They prevent the browser extension being embedded or
    // loaded as an <iframe /> in a potentially malicious website(s).
    //   1. The "script-src" directive specifies valid sources for JavaScript.
    //   This includes not only URLs loaded directly into <script> elements,
    //   but also things like inline script event handlers (onclick) and XSLT
    //   stylesheets which can trigger script execution. Must include at least
    //   the 'self' keyword and may only contain secure sources.
    //   'wasm-eval' needed, otherwise the GridPlus SDK fires errors
    //   (GridPlus needs to allow inline Web Assembly (wasm))
    //   2. The "object-src" directive may be required in some browsers that
    //   support obsolete plugins and should be set to a secure source such as
    //   'none' when needed. This may be necessary for browsers up until 2022.
    //   3. The "frame-ancestors" directive specifies valid parents that may
    //   embed a page using <frame>, <iframe>, <object>, <embed>, or <applet>.
    // {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/Sources}
    // {@link https://web.dev/csp/}

    const csp = "frame-ancestors 'none'; script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"

    if (isGecko) {
      manifest.background = { page: 'background.html' }
      manifest.host_permissions = [...manifest.host_permissions, '<all_urls>']
      manifest.browser_specific_settings = {
        gecko: {
          id: 'wallet@ambire.com',
          strict_min_version: '115.0'
        }
      }
    }

    if (isGecko || isSafari) {
      manifest.externally_connectable = undefined
    }

    const permissions = [...manifest.permissions, 'scripting', 'alarms']
    if (isWebkit && !isSafari) permissions.push('system.display')
    manifest.permissions = permissions

    if (isSafari) {
      manifest.permissions = manifest.permissions.filter((p) => p !== 'notifications')
    }

    manifest.content_security_policy = { extension_pages: csp }

    // This value can be used to control the unique ID of an extension,
    // when it is loaded during development. In prod, the ID is generated
    // in Chrome Web Store and can't be changed.
    // {@link https://developer.chrome.com/extensions/manifest/key}
    // TODO: key not supported in gecko browsers
    if (isWebkit) {
      manifest.key = process.env.BROWSER_EXTENSION_PUBLIC_KEY
    }

    const manifestJSON = JSON.stringify(manifest, null, 2)
    return manifestJSON
  }

  // Global configuration
  config.resolve.alias['@ledgerhq/devices/hid-framing'] = '@ledgerhq/devices/lib/hid-framing'
  config.resolve.alias.dns = 'dns-js'

  // The files in the /web directory should be transpiled not just copied
  const excludeCopyPlugin = config.plugins.findIndex(
    (plugin) => plugin.constructor.name === 'CopyPlugin'
  )
  if (excludeCopyPlugin !== -1) {
    config.plugins.splice(excludeCopyPlugin, 1)
  }
  // Not needed because output directory cleanup is handled in the run script
  const excludeCleanWebpackPlugin = config.plugins.findIndex(
    (plugin) => plugin.constructor.name === 'CleanWebpackPlugin'
  )
  if (excludeCleanWebpackPlugin !== -1) {
    config.plugins.splice(excludeCleanWebpackPlugin, 1)
  }

  // Exclude the predefined HtmlWebpackPlugin by @expo/webpack-config, and configure it manually,
  // because it is throwing a build error: "CommandError: Conflict: Multiple
  // assets emit different content to the same filename index.html"
  const excludeHtmlWebpackPlugin = config.plugins.findIndex(
    (plugin) => plugin.constructor.name === 'HtmlWebpackPlugin'
  )
  if (excludeHtmlWebpackPlugin !== -1) {
    config.plugins.splice(excludeHtmlWebpackPlugin, 1)
  }
  // Not needed because a custom manifest.json transpilation is implemented below
  const excludeExpoPwaManifestWebpackPlugin = config.plugins.findIndex(
    (plugin) => plugin.constructor.name === 'ExpoPwaManifestWebpackPlugin'
  )
  if (excludeExpoPwaManifestWebpackPlugin !== -1) {
    config.plugins.splice(excludeExpoPwaManifestWebpackPlugin, 1)
  }

  const defaultExpoConfigPlugins = [...config.plugins]

  // override MiniCssExtractPlugin only for prod to serve the css files in the main build directory
  if (config.mode === 'production') {
    const excludeMiniCssExtractPluginPlugin = config.plugins.findIndex(
      (plugin) => plugin.constructor.name === 'MiniCssExtractPlugin'
    )
    if (excludeMiniCssExtractPluginPlugin !== -1) {
      config.plugins.splice(excludeMiniCssExtractPluginPlugin, 1)
    }
    defaultExpoConfigPlugins.push(new MiniCssExtractPlugin()) // default filename: [name].css

    // @TODO: The extension doesn't work with splitChunks out of the box, so disable it for now
    config.optimization.minimize = true // optimize bundle by minifying
  } else if (config.mode === 'development') {
    // writeToDisk: output dev bundled files (in /webkit-dev or /gecko-dev) to import them as unpacked extension in the browser
    config.devServer.devMiddleware.writeToDisk = true
  }

  config.ignoreWarnings = [
    {
      // Ignore any warnings that include the text 'Failed to parse source map'.
      // As far as we could debug, these are not critical and lib specific.
      // Webpack can't find source maps for specific packages, which is fine.
      message: /Failed to parse source map/
    }
  ]

  config.resolve.extensions = [...(config.resolve.extensions || []), '.scss']

  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    '@ambire-common': path.resolve(__dirname, 'src/ambire-common/src'),
    '@contracts': path.resolve(__dirname, 'src/ambire-common/contracts'),
    '@ambire-common-v1': path.resolve(__dirname, 'src/ambire-common/v1'),
    '@common': path.resolve(__dirname, 'src/common'),
    '@mobile': path.resolve(__dirname, 'src/mobile'),
    '@web': path.resolve(__dirname, 'src/web'),
    '@benzin': path.resolve(__dirname, 'src/benzin'),
    '@legends': path.resolve(__dirname, 'src/legends'),
    react: path.resolve(__dirname, 'node_modules/react')
  }

  config.resolve.fallback = {
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify')
  }

  // There will be 2 instances of React if node_modules are installed in src/ambire-common.
  // That's why we need to alias the React package to the one in the root node_modules.

  config.output = {
    // possible output paths: /webkit-dev, /gecko-dev, /webkit-prod, gecko-prod, /benzin-dev, /benzin-prod, /legends-dev, /legends-prod
    path: path.resolve(__dirname, `build/${process.env.WEBPACK_BUILD_OUTPUT_PATH}`),
    // Defaults to using 'auto', but this is causing problems in some environments
    // like in certain browsers, when building (and running) in extension context.
    publicPath: '',
    environment: { dynamicImport: true }
  }

  if (isGecko) {
    // By default, Webpack uses importScripts for loading chunks, which works only in web workers.
    // However, Gecko-based browsers (like Firefox) still rely on background scripts instead of workers.
    // To ensure compatibility, we switch to using JSONP for chunk loading and 'array-push' for chunk format.
    config.output.chunkLoading = 'jsonp'
    config.output.chunkFormat = 'array-push'
  }

  if (config.mode === 'production') {
    config.output.assetModuleFilename = '[name].[ext]'
    config.output.filename = '[name].js'
    config.output.chunkFilename = '[id].js'
  }

  // Environment specific configurations
  if (isExtension) {
    console.log('Building extension with relayer:', process.env.RELAYER_URL)
    if (process.env.IS_TESTING !== 'true') {
      validateEnvVariables({ ...process.env }, process.env.APP_ENV)
    }
    const locations = env.locations || (await (0, expoEnv.getPathsAsync)(env.projectRoot))
    const templatePath = (fileName = '') => path.join(__dirname, './src/web', fileName)
    const templatePaths = {
      get: templatePath,
      folder: templatePath(),
      indexHtml: templatePath('index.html'),
      manifest: templatePath('manifest.json'),
      serveJson: templatePath('serve.json'),
      favicon: templatePath('favicon.ico')
    }
    locations.template = templatePaths

    config.entry = {
      main: config.entry[0], // the app entry
      // extension services
      background: './src/web/extension-services/background/background.ts',
      'content-script':
        './src/web/extension-services/content-script/content-script-messenger-bridge.ts',
      'ambire-inpage': './src/web/extension-services/inpage/ambire-inpage.ts',
      'ethereum-inpage': './src/web/extension-services/inpage/ethereum-inpage.ts'
    }

    if (isGecko) {
      config.entry['content-script-ambire-injection'] =
        './src/web/extension-services/content-script/content-script-ambire-injection.ts'
      config.entry['content-script-ethereum-injection'] =
        './src/web/extension-services/content-script/content-script-ethereum-injection.ts'
    }

    const extensionCopyPatterns = [
      {
        from: './src/web/assets',
        to: 'assets'
      },
      {
        from: './src/web/public/style.css',
        to: 'style.css',
        transform(content) {
          if (isGecko) {
            return processStyleGecko(content)
          }

          return content
        }
      },
      {
        from: './src/web/public/manifest.json',
        to: 'manifest.json',
        transform: processManifest
      },
      {
        from: './node_modules/webextension-polyfill/dist/browser-polyfill.min.js',
        to: 'browser-polyfill.min.js'
      },
      {
        from: require.resolve('@trezor/connect-webextension/build/content-script.js'),
        to: 'vendor/trezor/trezor-content-script.js'
      },
      {
        from: require.resolve('@trezor/connect-webextension/build/trezor-connect-webextension.js'),
        to: 'vendor/trezor/trezor-connect-webextension.js'
      }
    ]

    config.plugins = [
      ...defaultExpoConfigPlugins,
      new NodePolyfillPlugin(),
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'], process: 'process' }),
      new HtmlWebpackPlugin({
        template: './src/web/public/index.html',
        filename: 'index.html',
        inject: 'body', // to auto inject the main.js bundle in the body
        chunks: ['main'] // include only chunks from the main entry
      }),
      new HtmlWebpackPlugin({
        template: './src/web/public/action-window.html',
        filename: 'action-window.html',
        inject: 'body', // to auto inject the main.js bundle in the body
        chunks: ['main'] // include only chunks from the main entry
      }),
      new HtmlWebpackPlugin({
        template: './src/web/public/tab.html',
        filename: 'tab.html',
        inject: 'body', // to auto inject the main.js bundle in the body
        chunks: ['main'] // include only chunks from the main entry
      }),
      new CopyPlugin({ patterns: extensionCopyPatterns })
    ]

    if (isWebkit) {
      // This plugin enables code-splitting support for the service worker, allowing it to import chunks dynamically.
      config.plugins.push(
        new WebExtensionPlugin({
          background: { serviceWorkerEntry: 'background' }
        })
      )
    }

    if (isGecko) {
      // Makes the code-splitting possible for the background entry
      // Ensures that only chunks related to the background entry are included in the background HTML file, preventing unnecessary chunk imports
      config.plugins.push(
        new HtmlWebpackPlugin({
          template: './src/web/public/background.html',
          filename: 'background.html',
          inject: 'body', // to auto inject the background.js bundle in the body
          chunks: ['background'] // include only chunks from the background entry
        })
      )
      config.plugins.push(
        new AssetReplacePlugin({
          '#AMBIREINPAGE#': 'ambire-inpage',
          '#ETHEREUMINPAGE#': 'ethereum-inpage'
        })
      )
    }

    if (config.mode === 'production') {
      config.optimization.chunkIds = 'named' // Ensures same id for chunks across builds
      config.optimization.moduleIds = 'named' // Ensures same id for modules across builds
      config.optimization.splitChunks.maxSize = 4 * 1024 * 1024 // ensures max file size of 4MB
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks(chunk) {
          // do not split into chunks the files that should be injected
          return (
            chunk.name !== 'ambire-inpage' &&
            chunk.name !== 'ethereum-inpage' &&
            chunk.name !== 'content-script'
          )
        }
      }
    }

    config.experiments = {
      asyncWebAssembly: true,
      topLevelAwait: true
    }

    return config
  }
  if (isBenzin) {
    if (process.env.APP_ENV === 'development') {
      config.optimization = { minimize: false }
    } else {
      delete config.optimization.splitChunks
    }

    config.entry = './src/benzin/index.js'

    config.plugins = [
      ...defaultExpoConfigPlugins,
      new NodePolyfillPlugin(),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process'
      }),
      new CopyPlugin({
        patterns: [
          {
            from: './src/web/assets',
            to: 'assets'
          },
          {
            from: './src/benzin/public/style.css',
            to: 'style.css'
          },
          {
            from: './src/benzin/public/index.html',
            to: 'index.html'
          },
          {
            from: './src/benzin/public/favicon.ico',
            to: 'favicon.ico'
          }
        ]
      })
    ]

    return config
  }
  if (isLegends) {
    config.output.clean = true
    config.entry = './src/legends/index.js'

    if (process.env.APP_ENV === 'development') {
      config.optimization = { minimize: false }
    }

    // Add scss support
    config.module.rules[1].oneOf = config.module.rules[1].oneOf.map((rule) => {
      if (rule.exclude && rule.type === 'asset/resource') {
        rule.exclude.push(/\.scss$/)
      }

      return rule
    })

    config.module.rules = [
      ...config.module.rules,
      {
        test: /\.module\.scss$/, // SCSS module rule
        use: [
          'style-loader', // Injects styles into the DOM
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName:
                  process.env.APP_ENV === 'development'
                    ? '[name]__[local]--[hash:base64:5]' // Development: readable names
                    : '[hash:base64]' // Production: hashed names for optimization
              },
              sourceMap: process.env.APP_ENV === 'development',
              esModule: false // DON'T DELETE: This is needed for the styles to work
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [path.resolve(__dirname, './src/legends')]
              }
            }
          }
        ]
      },
      {
        test: /\.scss$/, // Regular SCSS rule (for global styles)
        exclude: /\.module\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      }
    ]

    config.plugins = [
      ...defaultExpoConfigPlugins,
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process'
      }),
      new HtmlWebpackPlugin({
        template: './src/legends/public/index.html',
        filename: 'index.html',
        inject: 'body',
        hash: true
      }),
      new CopyPlugin({
        patterns: [
          {
            from: 'src/legends/public', // Source directory
            to: path.resolve(__dirname, `build/${process.env.WEBPACK_BUILD_OUTPUT_PATH}`), // Destination directory
            globOptions: {
              ignore: ['**/*.html'] // Ignore HTML files as they are handled by HtmlWebpackPlugin
            }
          }
        ]
      })
    ]

    return config
  }
  // @TODO: Add mobile app build configuration here

  throw new Error('Invalid WEBPACK_BUILD_OUTPUT_PATH')
}
