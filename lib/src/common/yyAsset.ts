/* eslint-disable */
import * as lib from "../lib"

interface _ {}
interface StringMap extends Record<string, string>, _ {}
interface NumberMap extends Record<number, string>, _ {}

const resourceTypeMap: StringMap = {
    GMAnimCurve: "AnimationCurve",
    GMExtension: "Extension",
    GMFont: "Font",
    GMNotes: "Note",
    GMObject: "Object",
    GMParticleSystem: "ParticleSystem",
    GMPath: "Path",
    GMRoom: "Room",
    GMScript: "Script",
    GMSequence: "Sequence",
    GMShader: "Shader",
    GMSound: "Audio",
    GMSprite: "Sprite",
    GMTileSet: "Tileset",
    GMTimeline: "Timeline",
}
const valueTypeMap: NumberMap = {
    0: "number",
    1: "integer",
    2: "string",
    3: "boolean",
    4: "any",
    5: "Asset",
    6: "any",
    7: "Color"
}

export interface builtinAsset
{
    name: string
    resourceType: string
    overriddenProperties: {
        value: any
        objectId: {
            name: string
            path: string
        }
        propertyId: {
            name: string
            path: string
        }
    }[]
    properties: {
        varType: number
        name: string
        value: any
        filters?: []
        listItems?: []
        multiselect?: boolean
        rangeEnabled?: boolean
        rangeMax?: number
        rangeMin?: number
    }[]
    parentObjectId?: {
        name: string
        path: string
    }
}

export class yyAsset
{
    name: string
    type: string
    properties?: yyPropertyList
    parent?: string

    static from(yy: builtinAsset)
    {
        const asset = new yyAsset()
        asset.name = yy.name
        asset.type = resourceTypeMap[yy.resourceType]
        if(yy.parentObjectId)
            asset.parent = yy.parentObjectId.name

        return asset
    }
}

export interface yyPropertyList extends _, Record<string, yyProperty> {}

export function yyPropertyListFromArray(arr: {
    varType: number
    name: string
    value: any
}[]): yyPropertyList
{
    const list: yyPropertyList = {}
    for(var i = 0; i < arr.length; i++)
    {
        const prop = arr[i]

        list[prop.name] = {
            name: prop.name,
            value: prop.value,
            type: valueTypeMap.hasOwnProperty(prop.varType) ? valueTypeMap[prop.varType] : "any"
        }
    }
    return list
}

export interface yyProperty
{
    name: string
    value: any
    type: string
}
