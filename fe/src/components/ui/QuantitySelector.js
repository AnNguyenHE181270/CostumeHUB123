import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import Button from "../Button";

export default function QuantitySelector({ quantity, onDecrease, onIncrease, label = "Số lượng:" }) {
    return (
        <div className="flex items-center gap-4">
            {label && <span className="text-sm font-medium text-foreground">{label}</span>}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onDecrease}
                >
                    <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium text-foreground">
                    {quantity}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onIncrease}
                >
                    <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}