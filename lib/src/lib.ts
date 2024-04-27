/* eslint-disable */
import * as vscode from 'vscode';
import { workspace } from 'vscode';

import { VirtualTextDocument } from './common/textDocument';
import { yyAsset, builtinAsset, yyPropertyList, yyPropertyListFromArray } from './common/yyAsset';

interface _ {}

export interface FunctionEntry extends _ {
    description?: string,
    documentationLink?: string,
    signature?: string
    parameters?: {
        label: string,
        type?: string,
        documentation?: string
    }[]
    returns?: string,
    detail?: string,
    deprecated?: boolean,
    color?: {red: number, green: number, blue: number, alpha: number},
}

export let State: vscode.Memento = null

export let yypLocation: vscode.Uri = null
export let yypFolderPath: string = null
export let workspaceGmlFiles: VirtualTextDocument[] = []

export async function CreateWorkspaceState(state: vscode.Memento): Promise<vscode.Memento>
{
    state.update("yypResources", {})

    const yypPaths = await workspace.findFiles("**/*.yyp", "**/datafiles/**", 1)
    if(yypPaths && yypPaths.length > 0)
    {
        yypLocation = vscode.Uri.file(yypPaths[0].path)
        yypFolderPath = yypLocation.path.replace(/\w+\.yyp$/, "")

        const yypData = await workspace.fs.readFile(yypPaths[0])
        const yyp = <YYProject>JSON.parse(
            new TextDecoder().decode(yypData)
            .replaceAll(/,(?=\s*(\}|\]))/g, "")
            // .replaceAll(/(?<=")%(?=\w)/g, "")
        )

        const yypResources = ResourceList.from(yyp.resources)

        state.update("yyp", yyp)

        // load all yy files
        const yyPaths = await workspace.findFiles("**/*.yy", "**/datafiles/**")
        if(yyPaths && yyPaths.length > 0)
        {
            const yys: {[x: string]: builtinAsset} = {}

            const decoder = new TextDecoder()
            for(const resource in yypResources)
            {
                const uri = yypResources.get(resource).yyUri
                const yy = <builtinAsset>JSON.parse(
                    decoder.decode(await vscode.workspace.fs.readFile(uri))
                    .replaceAll(/,(?=\s*(\}|\]))/g, "")
                )
                yys[yy.name] = yy
            }

            for(const i in yys)
            {
                const yy = yys[i]
                if(!yypResources.has(yy.name)) continue

                const asset = yyAsset.from(yy)

                let combinedProperties: yyPropertyList = {}
                let currentYY = yy
                while(currentYY !== null)
                {
                    const obj = yyPropertyListFromArray(currentYY.properties)
                    combinedProperties = Object.assign(obj, combinedProperties)

                    if(currentYY.parentObjectId !== null)
                        currentYY = yys[currentYY.parentObjectId.name]
                    else
                        currentYY = null
                }
                asset.properties = combinedProperties

                const resource = yypResources.get(yy.name)
                resource.yyData = asset
            }
        }

        state.update("yypResources", yypResources)
    }

    // load all gml files
    workspaceGmlFiles = await getWorkspaceDocuments(await workspace.findFiles("**/*.gml", "**/datafiles/**"))

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
    readonly id: string
    readonly yyPath: string
    readonly yyUri: vscode.Uri

    yyData: yyAsset = null

    constructor(id: string, yyPath: string)
    {
        this.id = id
        this.yyPath = yyPath
        this.yyUri = vscode.Uri.file(yypFolderPath + yyPath)
    }

    toFunctionEntry(): FunctionEntry
    {
        return {
            detail: "(resource) " + this.id + (this.yyData !== null ? ": " + this.yyData.type : "")
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

export async function getWorkspaceDocuments(yypPaths: vscode.Uri[])
{
    const documents: VirtualTextDocument[] = []
    const decoder = new TextDecoder()
    for(var i = 0; i < yypPaths.length; i++)
    {
        const uri = yypPaths[i]
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
