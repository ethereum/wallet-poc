import React from 'react'
import { useTranslation } from 'react-i18next'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'

import { getUiType } from '@web/utils/uiType'
import SignAccountOpScreen from './SignAccountOp/screens/SignAccountOpScreen'

type Props = {
  closeEstimationModal: () => void
  estimationModalRef: React.RefObject<any>
}

const { isTab } = getUiType()

const SwapAndBridgeEstimation = ({ closeEstimationModal, estimationModalRef }: Props) => {
  const { t } = useTranslation()

  return (
    <BottomSheet
      id="estimation-modal"
      sheetRef={estimationModalRef}
      type={isTab ? 'modal' : 'bottom-sheet'}
      backgroundColor="primaryBackground"
      // NOTE: This must be lower than SigningKeySelect's z-index
      customZIndex={5}
      autoOpen={false}
      shouldBeClosableOnDrag={false}
      // isScrollEnabled={false}
    >
      {/* TODO: remove this button */}
      <Button
        testID="swap-button-back"
        type="secondary"
        text={t('Back')}
        onPress={closeEstimationModal}
        hasBottomSpacing={false}
        style={{ width: 98 }}
      />
      <SignAccountOpScreen />
    </BottomSheet>
  )
}

export default SwapAndBridgeEstimation
