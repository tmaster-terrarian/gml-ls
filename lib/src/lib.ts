/* eslint-disable */
import * as vscode from 'vscode';
import { workspace } from 'vscode';

export let State: vscode.Memento = null

export async function CreateWorkspaceState(newState: vscode.Memento): Promise<vscode.Memento>
{
    State = newState

	await State.update("yyp", JSON.parse(new TextDecoder().decode(await workspace.fs.readFile(await workspace.findFiles("**/*.yyp")[0])).replaceAll(/,(?=\s*(\}|\]))/g, "")))

    State.update("yypResources", State.get("yyp", null) !== null ? ResourceList.from((<YYProject>State.get("yyp")).resources) : "");

    return State
}

export class ResourceList extends Map<string, Resource>
{
    static from(value: Iterable<{id: {name: string, path: string}}> | ArrayLike<{id: {name: string, path: string}}> | {id: {name: string, path: string}}[]): ResourceList
    {
        const arr = Array.from(value)
        const list = new ResourceList()
        arr.forEach((value, i) => {
            list.set(value.id.name, {
                id: value.id.name,
                yyPath: value.id.path,
            })
        })
        return list
    }
}

export interface Resource
{
    id: string,
    yyPath: string
}

/* FINISH: add a way to universally get workspace symbols from a cache that gets updated dynamically

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
