"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceDocuments = exports.Resource = exports.ResourceList = exports.CreateWorkspaceState = exports.workspaceGmlFiles = exports.yypFolderPath = exports.yypLocation = exports.State = void 0;
/* eslint-disable */
const vscode = require("vscode");
const vscode_1 = require("vscode");
const textDocument_1 = require("./common/textDocument");
const yyAsset_1 = require("./common/yyAsset");
exports.State = null;
exports.yypLocation = null;
exports.yypFolderPath = null;
exports.workspaceGmlFiles = [];
async function CreateWorkspaceState(state) {
    state.update("yypResources", {});
    const yypPaths = await vscode_1.workspace.findFiles("**/*.yyp", "**/datafiles/**", 1);
    if (yypPaths && yypPaths.length > 0) {
        exports.yypLocation = vscode.Uri.file(yypPaths[0].path);
        exports.yypFolderPath = exports.yypLocation.path.replace(/\w+\.yyp$/, "");
        const yypData = await vscode_1.workspace.fs.readFile(yypPaths[0]);
        const yyp = JSON.parse(new TextDecoder().decode(yypData)
            .replaceAll(/,(?=\s*(\}|\]))/g, "")
        // .replaceAll(/(?<=")%(?=\w)/g, "")
        );
        const yypResources = ResourceList.from(yyp.resources);
        state.update("yyp", yyp);
        // load all yy files
        const yyPaths = await vscode_1.workspace.findFiles("**/*.yy", "**/datafiles/**");
        if (yyPaths && yyPaths.length > 0) {
            const yys = {};
            const decoder = new TextDecoder();
            for (const resource in yypResources) {
                const uri = yypResources.get(resource).yyUri;
                const yy = JSON.parse(decoder.decode(await vscode.workspace.fs.readFile(uri))
                    .replaceAll(/,(?=\s*(\}|\]))/g, ""));
                yys[yy.name] = yy;
            }
            for (const i in yys) {
                const yy = yys[i];
                if (!yypResources.has(yy.name))
                    continue;
                const asset = yyAsset_1.yyAsset.from(yy);
                let combinedProperties = {};
                let currentYY = yy;
                while (currentYY !== null) {
                    const obj = (0, yyAsset_1.yyPropertyListFromArray)(currentYY.properties);
                    combinedProperties = Object.assign(obj, combinedProperties);
                    if (currentYY.parentObjectId !== null)
                        currentYY = yys[currentYY.parentObjectId.name];
                    else
                        currentYY = null;
                }
                asset.properties = combinedProperties;
                const resource = yypResources.get(yy.name);
                resource.yyData = asset;
            }
        }
        state.update("yypResources", yypResources);
    }
    // load all gml files
    exports.workspaceGmlFiles = await getWorkspaceDocuments(await vscode_1.workspace.findFiles("**/*.gml", "**/datafiles/**"));
    exports.State = state;
    return state;
}
exports.CreateWorkspaceState = CreateWorkspaceState;
class ResourceList extends Map {
    static from(value) {
        const arr = Array.from(value);
        const list = new ResourceList();
        arr.forEach((value, i) => {
            list.set(value.id.name, new Resource(value.id.name, value.id.path));
        });
        return list;
    }
}
exports.ResourceList = ResourceList;
class Resource {
    constructor(id, yyPath) {
        this.yyData = null;
        this.id = id;
        this.yyPath = yyPath;
        this.yyUri = vscode.Uri.file(exports.yypFolderPath + yyPath);
    }
    toFunctionEntry() {
        return {
            detail: "(resource) " + this.id + (this.yyData !== null ? ": " + this.yyData.type : "")
        };
    }
}
exports.Resource = Resource;
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
async function getWorkspaceDocuments(yypPaths) {
    const documents = [];
    const decoder = new TextDecoder();
    for (var i = 0; i < yypPaths.length; i++) {
        const uri = yypPaths[i];
        const uint8arr = await vscode.workspace.fs.readFile(uri);
        const obj = new textDocument_1.VirtualTextDocument(uri, "gml", decoder.decode(uint8arr));
        documents.push(obj);
    }
    return documents;
}
exports.getWorkspaceDocuments = getWorkspaceDocuments;
//# sourceMappingURL=lib.js.map