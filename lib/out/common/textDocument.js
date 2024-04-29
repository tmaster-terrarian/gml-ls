"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualTextDocument = void 0;
const vscode_1 = require("vscode");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
class VirtualTextDocument {
    get lineCount() {
        return this._doc.lineCount;
    }
    constructor(uri, languageId, content, version = 0) {
        this.uri = uri;
        this.languageId = languageId;
        this.version = version;
        this._doc = vscode_languageserver_textdocument_1.TextDocument.create(uri.toString(), languageId, 0, content);
        this._content = content;
    }
    /**
     * the range will be adjusted
     */
    getText(range) {
        return this._doc.getText(range);
    }
    /**
     * the position will be adjusted
     */
    offsetAt(position) {
        return this._doc.offsetAt(position);
    }
    positionAt(offset) {
        const pos = this._doc.positionAt(offset);
        return new vscode_1.Position(pos.line, pos.character);
    }
    lineAt(line) {
        if (line instanceof vscode_1.Position) {
            return this.lineAt(this.validatePosition(line).line);
        }
        else {
            const text = this._doc.getText().split(/(?<=\n)/)[line];
            const textWithoutEOL = this._doc.getText().split(/(\n|\r\n)/)[line];
            const firstNonWhitespaceCharacterIndex = /^\s*(?:\b|$)/.exec(textWithoutEOL)[0].length;
            return {
                lineNumber: line,
                text: textWithoutEOL,
                range: new vscode_1.Range(new vscode_1.Position(line, 0), new vscode_1.Position(textWithoutEOL.length, text.length)),
                rangeIncludingLineBreak: new vscode_1.Range(new vscode_1.Position(line, 0), new vscode_1.Position(line, text.length)),
                firstNonWhitespaceCharacterIndex,
                isEmptyOrWhitespace: firstNonWhitespaceCharacterIndex == textWithoutEOL.length
            };
        }
    }
    getWordRangeAtPosition(position, regex) {
        const text = this._doc.getText();
        const pos = this.validatePosition(position);
        const prefix = text.slice(0, this._doc.offsetAt(pos));
        const suffix = text.slice(this._doc.offsetAt(pos));
        const matchPre = /\w+$/.exec(prefix);
        const matchSuf = /^\w+/.exec(suffix);
        if (matchPre || matchSuf) {
            let len = 0;
            let str = "";
            let idx = 0;
            if (matchPre)
                idx = matchPre.index;
            else
                idx = matchSuf.index;
            if (matchPre) {
                str += matchPre[0];
                len += matchPre[0].length;
            }
            if (matchSuf) {
                str += matchSuf[0];
                len += matchSuf[0].length;
            }
            if (!!regex && regex.test(str))
                return undefined;
            const start = this._doc.positionAt(idx);
            const end = this._doc.positionAt(idx + len);
            return new vscode_1.Range(new vscode_1.Position(start.line, start.character), new vscode_1.Position(end.line, end.character));
        }
        return undefined;
    }
    validateRange(range) {
        const start = this.validatePosition(range.start);
        const end = this.validatePosition(range.end);
        if (start.line > end.line || (start.line == end.line && start.character > end.character)) {
            return new vscode_1.Range(end, start);
        }
        else
            return new vscode_1.Range(start, end);
    }
    validatePosition(position) {
        let pos = position;
        if (pos.line < 0)
            pos = pos.with({ line: 0 });
        else if (pos.line > this.lineCount)
            pos = pos.with({ line: this.lineCount });
        const lineLength = this.getText().split(/(\n|\r\n)/)[position.line].length;
        if (pos.character < 0)
            pos = pos.with({ character: 0 });
        else if (pos.character > lineLength)
            pos = pos.with({ character: lineLength });
        return pos;
    }
}
exports.VirtualTextDocument = VirtualTextDocument;
//# sourceMappingURL=textDocument.js.map