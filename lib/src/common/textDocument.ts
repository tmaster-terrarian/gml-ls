/* eslint-disable */
import * as vscode from 'vscode';
import { EndOfLine, Position, Range, TextLine } from 'vscode';
import { TextDocument } from 'vscode-languageserver-textdocument';

export interface ITextDocument {
	readonly uri: vscode.Uri;
	readonly version: number;

	getText(range?: vscode.Range): string;

	positionAt(offset: number): vscode.Position;
}

export class VirtualTextDocument implements ITextDocument
{
    readonly uri: vscode.Uri
    readonly languageId: string
    readonly version: number

    private readonly _doc: TextDocument
    private readonly _content: string

    get lineCount() {
        return this._doc.lineCount
    }

    constructor(uri: vscode.Uri, languageId: string, content: string, version: number = 0)
    {
        this.uri = uri
        this.languageId = languageId
        this.version = version
        this._doc = TextDocument.create(uri.toString(), languageId, 0, content)
        this._content = content
    }

    /**
     * the range will be adjusted
     */
    getText(range?: Range): string {
        return this._doc.getText(range)
    }

    /**
     * the position will be adjusted
     */
    offsetAt(position: Position): number {
        return this._doc.offsetAt(position)
    }

    positionAt(offset: number): Position {
        const pos = this._doc.positionAt(offset);
		return new Position(pos.line, pos.character);
    }

    lineAt(line: number | Position): TextLine {
        if(line instanceof Position)
        {
            return this.lineAt(this.validatePosition(line).line)
        }
        else
        {
            const text = this._doc.getText().split(/(?<=\n)/)[line]
            const textWithoutEOL = this._doc.getText().split(/(\n|\r\n)/)[line]
            const firstNonWhitespaceCharacterIndex = /^\s*(?:\b|$)/.exec(textWithoutEOL)[0].length
            return {
                lineNumber: line,
                text: textWithoutEOL,
                range: new Range(new Position(line, 0), new Position(textWithoutEOL.length, text.length)),
                rangeIncludingLineBreak: new Range(new Position(line, 0), new Position(line, text.length)),
                firstNonWhitespaceCharacterIndex,
                isEmptyOrWhitespace: firstNonWhitespaceCharacterIndex == textWithoutEOL.length
            }
        }
    }

    getWordRangeAtPosition(position: Position, regex?: RegExp): Range | undefined {
        const text = this._doc.getText()
        const pos = this.validatePosition(position)
        const prefix = text.slice(0, this._doc.offsetAt(pos))
        const suffix = text.slice(this._doc.offsetAt(pos))
        const matchPre = /\w+$/.exec(prefix)
        const matchSuf = /^\w+/.exec(suffix)

        if(matchPre || matchSuf)
        {
            let len = 0
            let str = ""
            let idx = 0
            if(matchPre)
                idx = matchPre.index
            else
                idx = matchSuf.index

            if(matchPre) {
                str += matchPre[0]
                len += matchPre[0].length
            }
            if(matchSuf) {
                str += matchSuf[0]
                len += matchSuf[0].length
            }

            if(!!regex && regex.test(str))
                return undefined

            const start = this._doc.positionAt(idx)
            const end = this._doc.positionAt(idx + len)

            return new Range(new Position(start.line, start.character), new Position(end.line, end.character))
        }
        return undefined
    }

    validateRange(range: Range): Range {
        const start = this.validatePosition(range.start)
        const end = this.validatePosition(range.end)
        if (start.line > end.line || (start.line == end.line && start.character > end.character)) {
            return new Range(end, start)
        }
        else return new Range(start, end)
    }

    validatePosition(position: Position): Position {
        let pos = position

        if(pos.line < 0)
            pos = pos.with({ line: 0 })
        else if(pos.line > this.lineCount)
            pos = pos.with({ line: this.lineCount })

        const lineLength = this.getText().split(/(\n|\r\n)/)[position.line].length
        if(pos.character < 0)
            pos = pos.with({ character: 0 })
        else if(pos.character > lineLength)
            pos = pos.with({ character: lineLength })

        return pos
    }
}
