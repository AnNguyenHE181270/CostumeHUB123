import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";

export default function QuantitySelector({ quantity, onDecrease, onIncrease }) {
    return (
        <div className="flex items-center rounded-lg border border-border w-fit">
            <button
                type="button"
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                onClick={onDecrease}
            >
                <FontAwesomeIcon icon={faMinus} className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-sm font-medium text-foreground">
                {quantity}
            </span>
            <button
                type="button"
                className="flex h-8 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                onClick={onIncrease}
            >
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
            </button>
        </div>
    );
}