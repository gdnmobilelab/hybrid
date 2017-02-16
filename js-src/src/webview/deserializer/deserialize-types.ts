

export interface Serialized {
    type: "value" | "connected-item";
} 

export interface SerializedValue extends Serialized {
    value: any;
}

export interface SerializedConnectedItem extends Serialized {
    jsClassName: string;
    index: number;
    existing: boolean;
    initialData: any;
}