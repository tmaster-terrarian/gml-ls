type globalFunctionsList = { [name: string]: {
    description?: string,
    parameters?: {
        label: string,
        type?: string,
        documentation?: string
    }[],
    returns?: string,
    signature?: string
}}
type globalVariablesList = { [name: string]: {
    description?: string
}}

export const globalFunctions: globalFunctionsList = {
    abs:
    {
        description:
        `Returns the absolute value of \`val\`.

        [Go to Documentation](https://manual.gamemaker.io/monthly/en/GameMaker_Language/GML_Reference/Maths_And_Numbers/Number_Functions/abs.htm)`,

        parameters: [
            { label: 'val', type: "number", documentation: "number" }
        ],
        returns: "number",
        signature: '(val)'
    },
    draw_sprite: {
        description:
        `Draws the given sprite and sub-image at a position within the game room.

        [Go to Documentation](https://manual.gamemaker.io/monthly/en/GameMaker_Language/GML_Reference/Drawing/Sprites_And_Tiles/draw_sprite.htm)`,

        parameters: [
            { label: 'sprite', type: "SpriteAsset", documentation: "" },
            { label: 'subimg', type: "number", documentation: "" },
            { label: 'x', type: "number", documentation: "" },
            { label: 'y', type: "number", documentation: "" }
        ],
        signature: "(sprite, subimg, x, y)"
    }
},
globalVariables: globalVariablesList = {
    argument: {description: ""},
    argument_count: {description: ""},
    self: {description: ""},
    other: {description: ""},
},
constants = {
    _GMLINE_: {},
    _GMFILE_: {},
    _GMFUNCTION_: {},
    debug_mode: {},
},
keywords = {
    try: {},
    catch: {},
    finally: {},
    delete: {},
    and: {},
    break: {},
    case: {},
    continue: {},
    default: {},
    do: {},
    else: {},
    exit: {},
    for: {},
    if: {},
    not: {},
    or: {},
    repeat: {},
    return: {},
    switch: {},
    until: {},
    var: {},
    while: {},
    with: {},
    xor: {},
};
