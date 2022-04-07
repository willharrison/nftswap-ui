import { extendTheme } from '@chakra-ui/react'

export const font = 'Ubuntu'
export const theme = extendTheme({
  fonts: {
    heading: font,
    body: font
  }
})

export const commonToast = {
  position: 'top',
  duration: 4000,
  isClosable: true
}

export const successToast = {
  status: 'success',
  ...commonToast
}

export const errorToast = {
  status: 'error',
  ...commonToast
}
