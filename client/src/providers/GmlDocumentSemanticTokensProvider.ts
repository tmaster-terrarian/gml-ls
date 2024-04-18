/* eslint-disable */
import * as vscode from "vscode";
import * as gmlGlobals from "../gmlGlobals"

export default class GmlDocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    legend: vscode.SemanticTokensLegend

    constructor(legend: vscode.SemanticTokensLegend)
    {
        this.legend = legend;
    }

    provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SemanticTokens>
    {
        // analyze the document and return semantic tokens

        const text = document.getText()

        const tokensBuilder = new vscode.SemanticTokensBuilder(this.legend);

        const wordPattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g
        let wordMatch: RegExpExecArray = null
        let tokens = 0, maxTokens = 10000
        while((wordMatch = wordPattern.exec(text)) && tokens < maxTokens)
        {
            const position = document.positionAt(wordMatch.index)
            const wordRange = new vscode.Range(position, document.positionAt(wordMatch.index + wordMatch[0].length))
            const word = wordMatch[0]

            let inWhitespacePattern = new RegExp("(\\/\\/.*" + word + ".*|\\/\\*.*" + word + ".*\\*\\/|\".*" + word + ".*[^\\\\]\"|'.*" + word + ".*[^\\\\]')", "g")
            let inWhitespace: RegExpExecArray = null
            let cont = false
            while(inWhitespace = inWhitespacePattern.exec(text))
            {
                if((inWhitespace.index <= wordMatch.index) && ((inWhitespace.index + inWhitespace[0].length - 1) >= (wordMatch.index + wordMatch[0].length - 1)))
                {
                    cont = true
                    break
                }
                /** @todo make this not ignore code inside of template strings */
            }
            if(cont) continue

            tokens++

            let entry = gmlGlobals.globalFunctions.hasOwnProperty(word) ? gmlGlobals.globalFunctions[word] : null, type = "function"
            if(!entry) {entry = gmlGlobals.globalVariables.hasOwnProperty(word) ? gmlGlobals.globalVariables[word] : null; type = "variable"}
            if(!entry) {entry = gmlGlobals.constants.hasOwnProperty(word) ? gmlGlobals.constants[word] : null; type = "constant"}

            if(entry)
            {
                const modifiers = ['defaultLibrary']

                if(entry.deprecated)
                    modifiers.push('deprecated')

                let _type = "variable"
                if(type == "function")
                    _type = "function"
                if(type == "constant")
                    modifiers.push('readonly')

                tokensBuilder.push(
                    wordRange,
                    _type,
                    modifiers
                )
                continue
            }

            let vardef = new RegExp("\\bvar\\s+" + word + "\\b").exec(text)
            if(vardef)
            {
                tokensBuilder.push(
                    wordRange,
                    'variable',
                    ['local']
                )
                continue
            }

            for(const document of vscode.workspace.textDocuments)
            {
                const text = document.getText()

                let macrodef = new RegExp("#macro\\s" + word + "\\b").exec(text)
                if(macrodef)
                {
                    tokensBuilder.push(
                        wordRange,
                        'variable',
                        ['readonly']
                    )
                    break
                }

                let functiondef = new RegExp("\\bfunction\\s+" + word + "\\s*\\(.*\\)\\s*(constructor)?").exec(text)
                if(functiondef)
                {
                    if(functiondef[1] === "constructor")
                    {
                        tokensBuilder.push(
                            wordRange,
                            'class',
                            ['constructor']
                        )
                    }
                    else
                    {
                        tokensBuilder.push(
                            wordRange,
                            'function'
                        )
                    }
                    break
                }
            }
        }

        return tokensBuilder.build();
    }
}
