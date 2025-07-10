import {
  SignAccountOpController,
  SigningStatus
} from '@ambire-common/controllers/signAccountOp/signAccountOp'

const getIsSignLoading = (status?: SignAccountOpController['status']) =>
  status?.type === SigningStatus.InProgress ||
  status?.type === SigningStatus.UpdatesPaused ||
  status?.type === SigningStatus.WaitingForPaymaster ||
  status?.type === SigningStatus.Done

export { getIsSignLoading }
