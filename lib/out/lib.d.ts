import * as vscode from 'vscode';
import { VirtualTextDocument } from './common/textDocument';
import { yyAsset } from './common/yyAsset';
interface _ {
}
export interface FunctionEntry extends _ {
    description?: string;
    documentationLink?: string;
    signature?: string;
    parameters?: {
        label: string;
        type?: string;
        documentation?: string;
    }[];
    returns?: string;
    detail?: string;
    deprecated?: boolean;
    color?: {
        red: number;
        green: number;
        blue: number;
        alpha: number;
    };
}
export declare let State: vscode.Memento;
export declare let yypLocation: vscode.Uri;
export declare let yypFolderPath: string;
export declare let workspaceGmlFiles: VirtualTextDocument[];
export declare function CreateWorkspaceState(state: vscode.Memento): Promise<vscode.Memento>;
export declare class ResourceList extends Map<string, Resource> {
    static from(value: Iterable<{
        id: {
            name: string;
            path: string;
        };
    }> | ArrayLike<{
        id: {
            name: string;
            path: string;
        };
    }> | {
        id: {
            name: string;
            path: string;
        };
    }[]): ResourceList;
}
export declare class Resource {
    readonly id: string;
    readonly yyPath: string;
    readonly yyUri: vscode.Uri;
    yyData: yyAsset;
    constructor(id: string, yyPath: string);
    toFunctionEntry(): FunctionEntry;
}
export declare function getWorkspaceDocuments(yypPaths: vscode.Uri[]): Promise<VirtualTextDocument[]>;
export {};
