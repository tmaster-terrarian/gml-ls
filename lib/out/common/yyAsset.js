"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yyPropertyListFromArray = exports.yyAsset = void 0;
const resourceTypeMap = {
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
};
const valueTypeMap = {
    0: "number",
    1: "integer",
    2: "string",
    3: "boolean",
    4: "any",
    5: "Asset",
    6: "any",
    7: "Color"
};
class yyAsset {
    static from(yy) {
        const asset = new yyAsset();
        asset.name = yy.name;
        asset.type = resourceTypeMap[yy.resourceType];
        if (yy.parentObjectId)
            asset.parent = yy.parentObjectId.name;
        return asset;
    }
}
exports.yyAsset = yyAsset;
function yyPropertyListFromArray(arr) {
    const list = {};
    for (var i = 0; i < arr.length; i++) {
        const prop = arr[i];
        list[prop.name] = {
            name: prop.name,
            value: prop.value,
            type: valueTypeMap.hasOwnProperty(prop.varType) ? valueTypeMap[prop.varType] : "any"
        };
    }
    return list;
}
exports.yyPropertyListFromArray = yyPropertyListFromArray;
//# sourceMappingURL=yyAsset.js.map