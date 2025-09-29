import { format, isValid, parseISO } from 'date-fns'

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = parseISO(dateString)
    if (isValid(date)) {
      return format(date, 'MMM dd, yyyy')
    }
    return 'Invalid Date'
  } catch (error) {
    return 'Invalid Date'
  }
}

export const formatDateTime = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = parseISO(dateString)
    if (isValid(date)) {
      return format(date, 'MMM dd, yyyy HH:mm')
    }
    return 'Invalid Date'
  } catch (error) {
    return 'Invalid Date'
  }
}

export const formatTime = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = parseISO(dateString)
    if (isValid(date)) {
      return format(date, 'HH:mm:ss')
    }
    return 'Invalid Date'
  } catch (error) {
    return 'Invalid Date'
  }
}
