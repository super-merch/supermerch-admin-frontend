import React, { useState } from 'react'
import EmailTemplatesManager from './EmailTemplatesManager'

export default function EmailTemplates() {
  return (
    <div>
        <EmailTemplatesManager
        isOpen={true}
      />
    </div>
  )
}
