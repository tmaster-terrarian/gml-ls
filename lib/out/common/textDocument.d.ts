import * as vscode from 'vscode';
import { Position, Range, TextLine } from 'vscode';
export interface ITextDocument {
    readonly uri: vscode.Uri;
    readonly version: number;
    getText(range?: vscode.Range): string;
    positionAt(offset: number): vscode.Position;
}
export declare class VirtualTextDocument implements ITextDocument {
    readonly uri: vscode.Uri;
    readonly languageId: string;
    readonly version: number;
    private readonly _doc;
    private readonly _content;
    get lineCount(): number;
    constructor(uri: vscode.Uri, languageId: string, content: string, version?: number);
    /**
     * the range will be adjusted
     */
    getText(range?: Range): string;
    /**
     * the position will be adjusted
     */
    offsetAt(position: Position): number;
    positionAt(offset: number): Position;
    lineAt(line: number | Position): TextLine;
    getWordRangeAtPosition(position: Position, regex?: RegExp): Range | undefined;
    validateRange(range: Range): Range;
    validatePosition(position: Position): Position;
}
