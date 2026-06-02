import React from 'react'

function Card({ className, ...props }) {
    return (
        <div
            data-slot="card"
            className={[
                'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
                className,
            ].filter(Boolean).join(' ')}
            {...props}
        />
    )
}

function CardContent({ className, ...props }) {
    return (
        <div
            data-slot="card-content"
            className={['px-6', className].filter(Boolean).join(' ')}
            {...props}
        />
    )
}
export { CardContent, Card }