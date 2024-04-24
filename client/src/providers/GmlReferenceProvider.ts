/* eslint-disable */
import * as vscode from "vscode"
import * as gmlGlobals from "./gmlGlobals"
import * as lib from "../../../lib/out/lib";

interface Test
{
    test(prefix: any, suffix: any): boolean
}

const xor = (bool1: any, bool2: any) => {
    let b1 = !!bool1 ? 1 : 0
    let b2 = !!bool2 ? 1 : 0
    return (Math.abs(b1 - b2) == 1)
}

interface PlainDocument
{
    getText(): string,
    uri: vscode.Uri,
    positionAt?(offset: number): vscode.Position
}

const decode = async (uris: vscode.Uri[]) => {
    const documents: PlainDocument[] = []
    const decoder = new TextDecoder()
    for(var i = 0; i < uris.length; i++)
    {
        const uri = uris[i]
        const uint8arr = await vscode.workspace.fs.readFile(uri)
        const obj: PlainDocument = {
            getText() {
                return decoder.decode(uint8arr)
            },
            uri: uri,
            positionAt(offset): vscode.Position {
                return crawl_string(obj.getText(), offset)
            }
        }
        documents.push(obj)
    }
    return documents
}

export class GmlReferenceProvider implements vscode.ReferenceProvider
{
    async provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): Promise<vscode.Location[]>
    {
        if(vscode.workspace.getConfiguration('gml-ls').get('simpleMode', false)) return
        if(!vscode.workspace.getConfiguration('gml-ls').get('enableReferences', true)) return

        const includeWorkspaceReferences = vscode.workspace.getConfiguration('gml-ls').get('workspaceReferences', true)
        const includeResourceReferences = vscode.workspace.getConfiguration('gml-ls').get('resourceReferences', true)

        const results = []

        const wordRange = document.getWordRangeAtPosition(position)
        if(!wordRange) return null

        const word = document.getText(wordRange)
        const text = document.getText()

        const prefix = document.getText(new vscode.Range(document.positionAt(0), wordRange.start));
        const suffix = document.getText().slice(document.offsetAt(wordRange.start));

        const whitespaceTests: Test[] = [
            {
                // comments
                test: (prefix, suffix) => /\/\/[^\n]*$/.test(prefix) || /\/\*(?:.(?!\*\/))*$/s.test(prefix),
            },
            {
                // strings
                test: (prefix, suffix) => {
                    if(/\$".*(\{?.*?\}([^\{"]|\\")*)+$/.test(prefix)) // template string - preserves first level of template symbols
                        return true
                    else
                    {
                        if(/\$"(\\"|[^"])*$/.test(prefix)) // template string with no templates present
                            return true
                        else
                        {
                            const reg = /^|[^\\$]"/g
                            let regTest: RegExpExecArray = null, total = 0
                            while(regTest = reg.exec(prefix))
                                total++ // number of " before symbol

                            return /@'(.(?!'))*$/.test(prefix) || (total % 2 == 1) // multiline string, double quote string
                        }
                    }
                }
            }
        ];

        /** @todo make this not ignore code inside of template strings */

        const tests: Test[] = [
            {
                test: (prefix, suffix) => /#macro $/.test(prefix),
            },
            {
                test: (prefix, suffix) => /\benum\s+$/.test(prefix),
            },
            {
                test: (prefix, suffix) => /\bfunction\s+$/.test(prefix),
            },
        ];

        const resources = lib.State.get<lib.ResourceList>("yypResources")

        for(var i = 0; i < tests.length; i++)
        {
            if(tests[i].test(prefix, suffix) || gmlGlobals.globalFunctions.hasOwnProperty(word) || gmlGlobals.globalVariables.hasOwnProperty(word) || gmlGlobals.constants.hasOwnProperty(word) || (includeResourceReferences && resources.has(word)))
            {
                if(context.includeDeclaration)
                {
                    if(!gmlGlobals.globalVariables.hasOwnProperty(word))
                        results.push(new vscode.Location(document.uri, wordRange))
                }

                if(gmlGlobals.globalVariables.hasOwnProperty(word)) // local variables shouldn't be checked in the workspace, so we return early here
                {
                    const text = document.getText()
                    let matcher = new RegExp("\\b(" + word + ")\\b", "g")
                    let match: RegExpExecArray = null
                    while(match = matcher.exec(text))
                    {
                        const wordRange = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length))

                        // let cont = false
                        // for(var i = 0; i < whitespaceTests.length; i++)
                        // {
                        //     if(whitespaceTests[i].test(text.slice(0, match.index), text.slice(match.index + match[0].length)))
                        //     {
                        //         cont = true
                        //         break
                        //     }
                        // }
                        // if(cont) continue

                        let inWhitespacePattern = new RegExp("(\\/\\/.*" + word + ".*|\\/\\*.*" + word + ".*\\*\\/|\".*" + word + ".*[^\\\\]\"|'.*" + word + ".*[^\\\\]')", "g")
                        let inWhitespace: RegExpExecArray = null
                        let cont = false
                        while(inWhitespace = inWhitespacePattern.exec(document.getText()))
                        {
                            if((inWhitespace.index <= match.index) && ((inWhitespace.index + inWhitespace[0].length) >= (match.index + word.length - 1)))
                            {
                                cont = true
                                break
                            }
                            /** @todo make this not ignore code inside of template strings */
                        }
                        if(cont) continue

                        results.push(new vscode.Location(document.uri, wordRange))
                    }
                    return results
                }

                if(!(includeWorkspaceReferences || (includeResourceReferences && resources.has(word)))) return null

                const documents = await lib.getWorkspaceDocuments(await vscode.workspace.findFiles("**/*.gml"))

                for(const document of documents)
                {
                    if(!document.uri.path.endsWith(".gml")) continue

                    const text = document.getText()

                    let matcher = new RegExp("\\b(" + word + ")\\b", "g")
                    let match: RegExpExecArray = null
                    while(match = matcher.exec(text))
                    {
                        const wordRange = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + word.length))

                        let inWhitespacePattern = new RegExp("(\\/\\/.*" + word + ".*|\\/\\*.*" + word + ".*\\*\\/|\".*" + word + ".*[^\\\\]\"|'.*" + word + ".*[^\\\\]')", "g")
                        let inWhitespace: RegExpExecArray = null
                        let cont = false
                        while(inWhitespace = inWhitespacePattern.exec(document.getText()))
                        {
                            if((inWhitespace.index <= match.index) && ((inWhitespace.index + inWhitespace[0].length) >= (match.index + word.length - 1)))
                            {
                                cont = true
                                break
                            }
                            /** @todo make this not ignore code inside of template strings */
                        }
                        if(cont) continue

                        results.push(new vscode.Location(document.uri, wordRange))
                    }
                }

                return results
            }
        }

        return null
    }
}

export class GmlRenameProvider implements vscode.RenameProvider
{
    async provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string, token: vscode.CancellationToken): Promise<vscode.WorkspaceEdit>
    {
        if(vscode.workspace.getConfiguration('gml-ls').get('simpleMode', false)) return
        if(!vscode.workspace.getConfiguration('gml-ls').get('renameSymbol', true)) return

        const edit = new vscode.WorkspaceEdit()

        const wordRange = document.getWordRangeAtPosition(position)
        if(!wordRange) return null

        const prefix = document.getText(new vscode.Range(document.positionAt(0), wordRange.start));
        const suffix = document.getText().slice(document.offsetAt(wordRange.start));

        const word = document.getText(wordRange)

        const tests: Test[] = [
            {
                test: (prefix, suffix) => /#macro $/.test(prefix),
            },
            {
                test: (prefix, suffix) => /\benum\s+$/.test(prefix),
            },
            {
                test: (prefix, suffix) => /\bfunction\s+$/.test(prefix),
            }
        ]

        for(var i = 0; i < tests.length; i++)
        {
            if(tests[i].test(prefix, suffix))
            {
                const documents = await lib.getWorkspaceDocuments(await vscode.workspace.findFiles("**/*.gml"))

                for(const document of documents)
                {
                    if(!document.uri.path.endsWith(".gml")) continue

                    const text = document.getText()

                    let matcher = new RegExp("\\b(" + word + ")\\b", "g")
                    let match: RegExpExecArray = null
                    while(match = matcher.exec(text))
                    {
                        const wordRange = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length))

                        let inWhitespacePattern = new RegExp("(\\/\\/.*" + word + ".*|\\/\\*.*" + word + ".*\\*\\/|\".*" + word + ".*[^\\\\]\"|'.*" + word + ".*[^\\\\]')", "g")
                        let inWhitespace: RegExpExecArray = null
                        let cont = false
                        while(inWhitespace = inWhitespacePattern.exec(document.getText()))
                        {
                            if((inWhitespace.index <= match.index) && ((inWhitespace.index + inWhitespace[0].length) >= (match.index + word.length - 1)))
                            {
                                cont = true
                                break
                            }
                            /** @todo make this not ignore code inside of template strings */
                        }
                        if(cont) continue

                        edit.replace(document.uri, wordRange, newName)
                    }
                }
                return edit
            }
        }

        return Promise.reject("Symbol cannot be renamed")
    }
}

function crawl_string(string: string, offset: number): vscode.Position
{
    let index = 0
    const split = string.split(/(?<=\n)/)

    for(var line = 0; line < split.length; line++)
    {
        for(var char = 0; char < split[line].length; char++)
        {
            if(offset == index)
            {
                return new vscode.Position(line, char)
            }

            index++
        }
    }
    return new vscode.Position(0, 0)
}
