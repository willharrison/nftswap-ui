import { toast } from '../app'
import { errorToast } from '../ui'

export function handleError (error) {
  if (error.data?.message && error.data.message.indexOf('with reason string') !== -1) {
    error.dataMessage = error.data.message.replace(/.*string '/, '').slice(0, -1)
  }

  toast({
    description: error.reason || error.dataMessage || error.message,
    ...errorToast
  })
}
