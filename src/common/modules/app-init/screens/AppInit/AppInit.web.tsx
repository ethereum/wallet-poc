// @ts-nocheck TODO: fix provider types

import React from 'react'
import ErrorBoundary from 'react-native-error-boundary'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BrowserRouter, HashRouter } from 'react-router-dom'

import ErrorComponent from '@common/components/ErrorBoundary'
import { BiometricsProvider } from '@common/contexts/biometricsContext'
import { KeyboardProvider } from '@common/contexts/keyboardContext'
import { LoaderProvider } from '@common/contexts/loaderContext'
import { NetInfoProvider } from '@common/contexts/netInfoContext'
import { PrivateModeProvider } from '@common/contexts/privateModeContext'
import { StorageProvider } from '@common/contexts/storageContext'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import AppRouter from '@common/modules/app-init/components/AppRouter'
import { AuthProvider } from '@common/modules/auth/contexts/authContext'
import { OnboardingNavigationProvider } from '@common/modules/auth/contexts/onboardingNavigationContext'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { isExtension } from '@web/constants/browserapi'
import { AccountPickerControllerStateProvider } from '@web/contexts/accountPickerControllerStateContext'
import { AccountsControllerStateProvider } from '@web/contexts/accountsControllerStateContext'
import { ActionsControllerStateProvider } from '@web/contexts/actionsControllerStateContext'
import { ActivityControllerStateProvider } from '@web/contexts/activityControllerStateContext'
import { AddressBookControllerStateProvider } from '@web/contexts/addressBookControllerStateContext'
import { AutoLockControllerStateProvider } from '@web/contexts/autoLockControllerStateContext'
import { BackgroundServiceProvider } from '@web/contexts/backgroundServiceContext'
import { ControllersStateLoadedProvider } from '@web/contexts/controllersStateLoadedContext'
import { DappsControllerStateProvider } from '@web/contexts/dappsControllerStateContext'
import { DomainsControllerStateProvider } from '@web/contexts/domainsControllerStateContext'
import { EmailVaultControllerStateProvider } from '@web/contexts/emailVaultControllerStateContext'
import { ExtensionUpdateControllerStateProvider } from '@web/contexts/extensionUpdateControllerStateContext'
import { FeatureFlagsControllerStateProvider } from '@web/contexts/featureFlagsControllerStateContext'
import { InviteControllerStateProvider } from '@web/contexts/inviteControllerStateContext'
import { KeystoreControllerStateProvider } from '@web/contexts/keystoreControllerStateContext'
import { MainControllerStateProvider } from '@web/contexts/mainControllerStateContext'
import { NetworksControllerStateProvider } from '@web/contexts/networksControllerStateContext'
import { PhishingControllerStateProvider } from '@web/contexts/phishingControllerStateContext'
import { PortfolioControllerStateProvider } from '@web/contexts/portfolioControllerStateContext'
import { ProvidersControllerStateProvider } from '@web/contexts/providersControllerStateContext'
import { SelectedAccountControllerStateProvider } from '@web/contexts/selectedAccountControllerStateContext'
import { SignMessageControllerStateProvider } from '@web/contexts/signMessageControllerStateContext'
import { SwapAndBridgeControllerStateProvider } from '@web/contexts/swapAndBridgeControllerStateContext'
import { TransactionControllerStateProvider } from '@web/contexts/transactionControllerStateContext'
import { WalletStateControllerProvider } from '@web/contexts/walletStateControllerContext'

const Router = isExtension ? HashRouter : BrowserRouter

const AppInit = () => {
  const { fontsLoaded, robotoFontsLoaded } = useFonts()

  if (!fontsLoaded && !robotoFontsLoaded) return null

  return (
    <Router>
      <PortalProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <ToastProvider>
              <ErrorBoundary FallbackComponent={ErrorComponent}>
                <BackgroundServiceProvider>
                  <MainControllerStateProvider>
                    <NetworksControllerStateProvider>
                      <AccountsControllerStateProvider>
                        <SelectedAccountControllerStateProvider>
                          <ProvidersControllerStateProvider>
                            <AutoLockControllerStateProvider>
                              <ExtensionUpdateControllerStateProvider>
                                <FeatureFlagsControllerStateProvider>
                                  <InviteControllerStateProvider>
                                    <WalletStateControllerProvider>
                                      <AccountPickerControllerStateProvider>
                                        <KeystoreControllerStateProvider>
                                          <SignMessageControllerStateProvider>
                                            <ActivityControllerStateProvider>
                                              <ActionsControllerStateProvider>
                                                <PortfolioControllerStateProvider>
                                                  <EmailVaultControllerStateProvider>
                                                    <PhishingControllerStateProvider>
                                                      <DappsControllerStateProvider>
                                                        <DomainsControllerStateProvider>
                                                          <AddressBookControllerStateProvider>
                                                            <SwapAndBridgeControllerStateProvider>
                                                              <ControllersStateLoadedProvider>
                                                                <LoaderProvider>
                                                                  <TransactionControllerStateProvider>
                                                                    <StorageProvider>
                                                                      <KeyboardProvider>
                                                                        <NetInfoProvider>
                                                                          <AuthProvider>
                                                                            <OnboardingNavigationProvider>
                                                                              <BiometricsProvider>
                                                                                <PrivateModeProvider>
                                                                                  <AppRouter />
                                                                                </PrivateModeProvider>
                                                                                <PortalHost name="global" />
                                                                              </BiometricsProvider>
                                                                            </OnboardingNavigationProvider>
                                                                          </AuthProvider>
                                                                        </NetInfoProvider>
                                                                      </KeyboardProvider>
                                                                    </StorageProvider>
                                                                  </TransactionControllerStateProvider>
                                                                </LoaderProvider>
                                                              </ControllersStateLoadedProvider>
                                                            </SwapAndBridgeControllerStateProvider>
                                                          </AddressBookControllerStateProvider>
                                                        </DomainsControllerStateProvider>
                                                      </DappsControllerStateProvider>
                                                    </PhishingControllerStateProvider>
                                                  </EmailVaultControllerStateProvider>
                                                </PortfolioControllerStateProvider>
                                              </ActionsControllerStateProvider>
                                            </ActivityControllerStateProvider>
                                          </SignMessageControllerStateProvider>
                                        </KeystoreControllerStateProvider>
                                      </AccountPickerControllerStateProvider>
                                    </WalletStateControllerProvider>
                                  </InviteControllerStateProvider>
                                </FeatureFlagsControllerStateProvider>
                              </ExtensionUpdateControllerStateProvider>
                            </AutoLockControllerStateProvider>
                          </ProvidersControllerStateProvider>
                        </SelectedAccountControllerStateProvider>
                      </AccountsControllerStateProvider>
                    </NetworksControllerStateProvider>
                  </MainControllerStateProvider>
                </BackgroundServiceProvider>
              </ErrorBoundary>
            </ToastProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </PortalProvider>
    </Router>
  )
}

export default AppInit
