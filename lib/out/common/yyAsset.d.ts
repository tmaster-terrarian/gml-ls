interface _ {
}
export interface builtinAsset {
    name: string;
    resourceType: string;
    overriddenProperties: {
        value: any;
        objectId: {
            name: string;
            path: string;
        };
        propertyId: {
            name: string;
            path: string;
        };
    }[];
    properties: {
        varType: number;
        name: string;
        value: any;
        filters?: [];
        listItems?: [];
        multiselect?: boolean;
        rangeEnabled?: boolean;
        rangeMax?: number;
        rangeMin?: number;
    }[];
    parentObjectId?: {
        name: string;
        path: string;
    };
}
export declare class yyAsset {
    name: string;
    type: string;
    properties?: yyPropertyList;
    parent?: string;
    static from(yy: builtinAsset): yyAsset;
}
export interface yyPropertyList extends _, Record<string, yyProperty> {
}
export declare function yyPropertyListFromArray(arr: {
    varType: number;
    name: string;
    value: any;
}[]): yyPropertyList;
export interface yyProperty {
    name: string;
    value: any;
    type: string;
}
export {};
