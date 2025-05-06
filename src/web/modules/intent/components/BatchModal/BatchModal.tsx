import React, { FC, useCallback } from 'react'

import BottomSheet from '@common/components/BottomSheet'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import BatchAdded from './BatchAdded'

type Props = {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
}

const BatchModal: FC<Props> = ({ sheetRef, closeBottomSheet }) => {
  const { navigate } = useNavigation()

  const onSecondaryButtonPress = useCallback(() => {
    closeBottomSheet()
  }, [closeBottomSheet])
  const onPrimaryButtonPress = useCallback(() => {
    navigate(WEB_ROUTES.dashboard)
  }, [navigate])

  return (
    <BottomSheet
      backgroundColor="primaryBackground"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      id="batch-modal"
    >
      <BatchAdded
        onPrimaryButtonPress={onPrimaryButtonPress}
        onSecondaryButtonPress={onSecondaryButtonPress}
      />
    </BottomSheet>
  )
}

export default BatchModal
