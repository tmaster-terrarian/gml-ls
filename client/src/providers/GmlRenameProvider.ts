/* eslint-disable */
import * as vscode from "vscode"
import * as gmlGlobals from "./gmlGlobals"

interface Check
{
    test(prefix: string, suffix: string): boolean
}

const xor = (bool1: boolean, bool2: boolean) => {
    let b1 = bool1 ? 1 : 0
    let b2 = bool2 ? 1 : 0
    return (Math.abs(b1 - b2) == 1)
}

export default class GmlRenameProvider implements vscode.RenameProvider
{
    provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string, token: vscode.CancellationToken): vscode.ProviderResult<vscode.WorkspaceEdit>
    {
        return Promise.reject("no")
    }
}
