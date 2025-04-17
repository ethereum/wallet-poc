const path = require('path')
const baseConfig = require('./src/ambire-common/jest.config.js')

module.exports = {
  ...baseConfig,
  displayName: 'Ambire Extension Unit Tests',
  moduleNameMapper: {
    // Add fallbacks for all missing viem test action files
    // '^.+.js$': 'babel-jest', // Ensure JS files are transformed if needed elsewhere
    '../../actions/test/dumpState.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/dropTransaction.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/getAutomine.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/getTxpoolContent.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/getTxpoolStatus.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/impersonateAccount.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/increaseTime.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/inspectTxpool.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/loadState.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/mine.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/removeBlockTimestampInterval.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/reset.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/revert.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/sendUnsignedTransaction.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setAutomine.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setBalance.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setBlockGasLimit.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setBlockTimestampInterval.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setCode.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setCoinbase.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setIntervalMining.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setLoggingEnabled.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setMinGasPrice.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setNextBlockBaseFeePerGas.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setNextBlockTimestamp.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setNonce.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setRpcUrl.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/setStorageAt.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/snapshot.js': '<rootDir>/__mocks__/emptyModule.js',
    '../../actions/test/stopImpersonatingAccount.js': '<rootDir>/__mocks__/emptyModule.js'
  },
  testPathIgnorePatterns: [
    path.join('<rootDir>', 'tests/'), // E2E tests, handled by another configuration
    path.join('<rootDir>', 'src/ambire-common/'), // Tests for the ambire-common library, handled by another configuration
    path.join('<rootDir>', 'node_modules/'),
    // Mobile builds
    path.join('<rootDir>', 'android/'),
    path.join('<rootDir>', 'ios/'),
    // Extension, benzin and legends builds
    path.join('<rootDir>', 'build/'),
    // Safari extension xcode project
    path.join('<rootDir>', 'safari-extension/'),
    // Misc
    path.join('<rootDir>', '\\.[^/]+'), // Matches any directory starting with a dot
    path.join('<rootDir>', 'recorder/'), // E2E tests video recorder files
    path.join('<rootDir>', 'vendor/') // Ruby
  ],
  setupFiles: []
}
