/* eslint-disable */
import * as vscode from 'vscode';
import { workspace } from 'vscode';

import { FunctionEntry } from "../../client/out/providers/gmlGlobals"
import { VirtualTextDocument } from './common/textDocument';

export let State: vscode.Memento = null

export let yypLocation: vscode.Uri = null

export function CreateWorkspaceState(state: vscode.Memento): vscode.Memento
{
    workspace.findFiles("**/*.yyp", "**/datafiles/**", 1).then(uris => {
        yypLocation = vscode.Uri.file(uris[0].path.replace(/\/\w+.yyp/, ""))
        workspace.fs.readFile(uris[0]).then(val => {
            const yyp = <YYProject>JSON.parse(new TextDecoder().decode(val).replaceAll(/,(?=\s*(\}|\]))/g, "").replaceAll(/(?<=")%(?=\w)/g, ""))
            state.update("yyp", yyp)

            state.update("yypResources", ResourceList.from(yyp.resources));
        })
    })

    workspace.findFiles("**/*.gml", "**/datafiles/**")

    State = state
    return state
}

export class ResourceList extends Map<string, Resource>
{
    static from(value: Iterable<{id: {name: string, path: string}}> | ArrayLike<{id: {name: string, path: string}}> | {id: {name: string, path: string}}[]): ResourceList
    {
        const arr = Array.from(value)
        const list = new ResourceList()
        arr.forEach((value, i) => {
            list.set(value.id.name, new Resource(
                value.id.name,
                value.id.path,
            ))
        })
        return list
    }
}

export class Resource
{
    id: string
    yyPath: string
    yyUri: vscode.Uri

    constructor(id: string, yyPath: string)
    {
        this.id = id
        this.yyPath = yyPath
        this.yyUri = (vscode.Uri.file(yypLocation.path + "/" + yyPath))
    }

    toFunctionEntry(): FunctionEntry
    {
        return {
            detail: "(resource) " + this.id
        }
    }
}

/*
FINISH: add a way to universally get workspace symbols from a cache that gets updated dynamically

const files: GmlFile[]

export interface GmlFile
{
    symbols: Symbol[]
    uri: vscode.Uri
}

export class Symbol
{
    range: vscode.Range
    identifier: string
    type: SymbolType
    scopeRange?: vscode.Range
}

export enum SymbolType
{
    LocalVariable = 0,
    ScriptFunction = 1,
    Macro = 2,
    Parameter = 3
}
*/

export async function getWorkspaceDocuments(uris: vscode.Uri[])
{
    const documents: VirtualTextDocument[] = []
    const decoder = new TextDecoder()
    for(var i = 0; i < uris.length; i++)
    {
        const uri = uris[i]
        const uint8arr = await vscode.workspace.fs.readFile(uri)
        const obj = new VirtualTextDocument(uri, "gml", decoder.decode(uint8arr))
        documents.push(obj)
    }
    return documents
}

interface YYProject
{
    $GMProject:        string;
    "%Name":           string;
    AudioGroups:       any[];
    configs:           any;
    defaultScriptType: number;
    Folders:           any[];
    IncludedFiles:     any[];
    isEcma:            boolean;
    LibraryEmitters:   any[];
    MetaData:          any;
    name:              string;
    resources:         {id: {name: string, path: string}}[];
    resourceType:      string;
    resourceVersion:   string;
    RoomOrderNodes:    any[];
    templateType:      null;
    TextureGroups:     any[];
}
