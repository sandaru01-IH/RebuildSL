export interface FormErrors {
  [key: string]: string
}

export function validateDamageReport(data: {
  property_type: string
  property_condition: string
  damage_level: number
  estimated_damage_lkr: number
  affected_residents: number
  description: string
  location?: { lat: number; lng: number }
  gnd_code?: string
  gnd_name?: string
}): FormErrors {
  const errors: FormErrors = {}

  if (!data.property_type || data.property_type.trim() === '') {
    errors.property_type = 'Property type is required'
  }

  if (!data.property_condition || data.property_condition.trim() === '') {
    errors.property_condition = 'Property condition is required'
  }

  if (!data.damage_level || data.damage_level < 1 || data.damage_level > 10) {
    errors.damage_level = 'Damage level must be between 1 and 10'
  }

  if (!data.estimated_damage_lkr || data.estimated_damage_lkr < 0) {
    errors.estimated_damage_lkr = 'Estimated damage must be a positive number'
  }

  if (data.affected_residents < 0 || !Number.isInteger(data.affected_residents)) {
    errors.affected_residents = 'Number of affected residents must be a non-negative integer'
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters'
  }

  if (!data.gnd_code || !data.gnd_name) {
    errors.gnd = 'GND selection is required'
  }

  // Location is optional but recommended for post-processing
  // if (!data.location || !data.location.lat || !data.location.lng) {
  //   errors.location = 'Location is recommended'
  // }

  return errors
}

export function validateSupportPost(data: {
  organization_name: string
  contact_name: string
  contact_phone: string
  support_type: string
  description: string
}): FormErrors {
  const errors: FormErrors = {}

  if (!data.organization_name || data.organization_name.trim() === '') {
    errors.organization_name = 'Organization name is required'
  }

  if (!data.contact_name || data.contact_name.trim() === '') {
    errors.contact_name = 'Contact name is required'
  }

  if (!data.contact_phone || data.contact_phone.trim() === '') {
    errors.contact_phone = 'Contact phone is required'
  } else if (!/^[0-9+\-\s()]+$/.test(data.contact_phone)) {
    errors.contact_phone = 'Please enter a valid phone number'
  }

  if (!data.support_type || data.support_type.trim() === '') {
    errors.support_type = 'Support type is required'
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters'
  }

  return errors
}

