import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import BatchIcon from '@common/assets/svg/BatchIcon'
import Button from '@common/components/Button'
import Tooltip from '@common/components/Tooltip'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import { getUiType } from '@web/utils/uiType'

type Props = {
  isNotReadyToProceed: boolean
  isBridge: boolean
  handleSubmitForm: (isOneClickMode: boolean) => void
}

const { isActionWindow } = getUiType()

const Buttons: FC<Props> = ({ isNotReadyToProceed, handleSubmitForm, isBridge }) => {
  const { t } = useTranslation()
  const { fromSelectedToken, swapSignErrors } = useSwapAndBridgeControllerState()
  const { userRequests } = useMainControllerState()
  const { account } = useSelectedAccountControllerState()
  const fromChainId = fromSelectedToken?.chainId

  const networkUserRequests = fromChainId
    ? userRequests?.filter(
        (r) =>
          r.action.kind === 'calls' &&
          r.meta.accountAddr === account?.addr &&
          r.meta.chainId === fromChainId
      )
    : []

  const oneClickDisabledReason = useMemo(() => {
    if (!isBridge && networkUserRequests.length > 0) {
      return t(
        'You have pending transactions on this network. Please add this transaction to the batch.'
      )
    }

    if (swapSignErrors.length > 0) {
      return swapSignErrors[0].title
    }

    return ''
  }, [isBridge, networkUserRequests.length, t, swapSignErrors])

  const batchDisabledReason = useMemo(() => {
    if (isBridge) return t('Batching is not available for bridges.')

    return ''
  }, [isBridge, t])

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd]}>
      {!isActionWindow && (
        // @ts-ignore
        <View dataSet={{ tooltipId: 'batch-btn-tooltip' }}>
          <Button
            hasBottomSpacing={false}
            text={
              networkUserRequests.length > 0 && !batchDisabledReason
                ? t('Add to batch ({{count}})', {
                    count: networkUserRequests.length
                  })
                : t('Start a batch')
            }
            disabled={isNotReadyToProceed || !!batchDisabledReason}
            type="secondary"
            style={{ minWidth: 160, ...spacings.phMd }}
            onPress={() => handleSubmitForm(false)}
          >
            <BatchIcon style={spacings.mlTy} />
          </Button>
        </View>
      )}
      {/* @ts-ignore */}
      <View dataSet={{ tooltipId: 'proceed-btn-tooltip' }}>
        <Button
          text={t('Proceed')}
          // TODO: remove the disabled once the intent is implemented
          // disabled={isNotReadyToProceed || !!oneClickDisabledReason}
          style={{ minWidth: 160, ...spacings.mlLg }}
          hasBottomSpacing={false}
          onPress={() => handleSubmitForm(true)}
          testID="proceed-btn"
        />
      </View>
      <Tooltip content={oneClickDisabledReason} id="proceed-btn-tooltip" />
      <Tooltip content={batchDisabledReason} id="batch-btn-tooltip" />
    </View>
  )
}

export default Buttons
