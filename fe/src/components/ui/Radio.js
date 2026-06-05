'use client'

import * as React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'

export default function Radio({ className, value, id, checked, onChange, name, disabled, ...props }) {
    return (
        <div className={['relative flex items-center justify-center', className].filter(Boolean).join(' ')}>
            <input
                id={id}
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="sr-only"
                {...props}
            />
            <span
                className={[
                    'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center',
                    checked ? 'bg-primary/10 border-primary' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                {checked && <FontAwesomeIcon icon={faCircle} className="fill-primary size-2" />}
            </span>
        </div>
    )
}
