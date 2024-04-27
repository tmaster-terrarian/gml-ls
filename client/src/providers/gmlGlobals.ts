import * as vscode from "vscode";
import { Color } from "vscode";
import * as lib from '../../../lib/out/lib';

/* eslint-disable */

export interface FunctionEntry extends lib.FunctionEntry {}

class EntryList {
    [x: string]: FunctionEntry;
}

export function recompile(includeUserDefinitions = true, fixMissingValues = true)
{
    compile(true)

    if(includeUserDefinitions)
    {
        const userFunctions = vscode.workspace.getConfiguration("gml-ls.userGlobals").get("functions", <EntryList>{})
        const userMacros = vscode.workspace.getConfiguration("gml-ls.userGlobals").get("macros", <EntryList>{})

        // base functions should take precedence over user-defined ones
        globalFunctions = Object.assign(userFunctions, _globalFunctions)

        // this is not the same for constants because those can be overriden for some reason
        constants = Object.assign(Object.assign({}, _constants), userMacros)
    }

    if(fixMissingValues) compile()
}

function compile(initialCompile = false)
{
    for(const e in globalFunctions)
    {
        const entry = globalFunctions[e]
        if(!entry.parameters)
            entry.parameters = []
        if(!entry.signature)
            entry.signature = "()"

        if(/color/.exec(e) && initialCompile) // add UK entries
            globalFunctions[e.replace("color", "colour")] = entry
    }
    for(const e in globalVariables)
    {
        const entry = globalVariables[e]
        
    }
    for(const e in constants)
    {
        const entry = constants[e]

        if(/gray$/.exec(e) && initialCompile) // add UK entries
            constants[e.replace("gray", "grey")] = entry
    }
}

export let globalFunctions: EntryList = {
    abs: {
        description: "Returns the absolute value of the input number",
        documentationLink: "Maths_And_Numbers/Number_Functions/abs",
        parameters: [
            { label: "val", type: "number", documentation: "number" }
        ],
        returns: "number",
    },
    color_get_blue: {
        description: "Returns the amount of blue used to make the given colour, from `0-255`",
        documentationLink: "Drawing/Colour_And_Alpha/colour_get_blue",
        parameters: [
            { label: "col", type: "Color", documentation: "The color to check" },
        ],
        returns: "number",
    },
    color_get_green: {
        description: "Returns the amount of green used to make the given colour, from `0-255`",
        documentationLink: "Drawing/Colour_And_Alpha/colour_get_green",
        parameters: [
            { label: "col", type: "Color", documentation: "The color to check" },
        ],
        returns: "number",
    },
    color_get_red: {
        description: "Returns the amount of red used to make the given colour, from `0-255`",
        documentationLink: "Drawing/Colour_And_Alpha/colour_get_red",
        parameters: [
            { label: "col", type: "Color", documentation: "The color to check" },
        ],
        returns: "number",
    },
    color_get_hue: {
        description: "Returns the \"pure\" hue of the given colour, from `0-255`",
        documentationLink: "Drawing/Colour_And_Alpha/colour_get_hue",
        parameters: [
            { label: "col", type: "Color", documentation: "The color to check" },
        ],
        returns: "number",
    },
    color_get_saturation: {
        description: "Returns the \"pure\" saturation of the given colour, from `0-255`",
        documentationLink: "Drawing/Colour_And_Alpha/colour_get_saturation",
        parameters: [
            { label: "col", type: "Color", documentation: "The color to check" },
        ],
        returns: "number",
    },
    color_get_value: {
        description: "Returns the \"pure\" value (luminosity) of the given colour, from `0-255`",
        documentationLink: "Drawing/Colour_And_Alpha/colour_get_value",
        parameters: [
            { label: "col", type: "Color", documentation: "The color to check" },
        ],
        returns: "number",
    },
    draw_arrow: {
        description: "Draw an arrow from point `(x1, y1)` to point `(x2, y2)`",
        documentationLink: "Drawing/Basic_Forms/draw_arrow",
        parameters: [
            { label: "x1", type: "number", documentation: "The x coordinate of the start of the line." },
            { label: "y1", type: "number", documentation: "The y coordinate of the start of the line." },
            { label: "y2", type: "number", documentation: "The x coordinate of the end of the line (where the arrowhead ends)." },
            { label: "x2", type: "number", documentation: "The y coordinate of the end of the line (where the arrowhead ends)." },
            { label: "size", type: "number", documentation: "The length of the arrow in pixels." },
        ]
    },
    draw_circle: {
        description: "Draw a circle at position `(x, y)` with radius `r`",
        documentationLink: "Drawing/Basic_Forms/draw_circle",
        parameters: [
            { label: "x", type: "number", documentation: "The x coordinate of the center of the circle." },
            { label: "y", type: "number", documentation: "The y coordinate of the center of the circle." },
            { label: "r", type: "number", documentation: "The circle's radius (length from its center to its edge)" },
            { label: "outline", type: "boolean", documentation: "Whether the circle is drawn filled (`false`) or as a one pixel wide outline (`true`)." },
        ]
    },
    draw_circle_color: {
        description: "Draw a colored circle at position `(x, y)` with radius `r`",
        documentationLink: "Drawing/Basic_Forms/draw_circle_colour",
        parameters: [
            { label: "x", type: "number", documentation: "The x coordinate of the center of the circle." },
            { label: "y", type: "number", documentation: "The y coordinate of the center of the circle." },
            { label: "r", type: "number", documentation: "The circle's radius (length from its center to its edge)" },
            { label: "col1", type: "Color", documentation: "The colour at the center of the circle." },
            { label: "col2", type: "Color", documentation: "The colour at the edge of the circle." },
            { label: "outline", type: "boolean", documentation: "Whether the circle is drawn filled (`false`) or as a one pixel wide outline (`true`)." },
        ]
    },
    draw_clear: {
        description: `Clears the entire screen and fills it with the color (fully opaque)
        <br>Only works within an instance draw event

        Use the <span style="color:#DCDCAA;">draw_clear_alpha</span> function to `,
        documentationLink: "Drawing/Colour_And_Alpha/draw_clear",
        parameters: [
            { label: "col", type: "Color", documentation: "The color to clear the screen with" },
        ],
    },
    draw_clear_alpha: {
        description: `Clears the entire screen to the given colour
        <br>Only works within an instance draw event`,
        documentationLink: "Drawing/Colour_And_Alpha/draw_clear",
        parameters: [
            { label: "col", type: "Color", documentation: "The color to clear the screen with" },
        ],
    },
    draw_ellipse: {},
    draw_ellipse_color: {},
    draw_enable_alphablend: {},
    draw_enable_drawevent: {},
    draw_enable_swf_aa: {},
    draw_flush: {},
    draw_getpixel: {
        description: `Gets the colour value of the pixel that is being drawn to the current render target at the input position
        <br>Use the function <span style="color:#DCDCAA;">draw_getpixel_ext</span> to get alpha values as well

        **\`IMPORTANT\`** This function will cause a huge performance hit and so should only be used when absolutely necessary!`,
        documentationLink: "Drawing/Colour_And_Alpha/draw_getpixel",
        parameters: [
            { label: "x", type: "number", documentation: "The x coordinate of the pixel to check" },
            { label: "y", type: "number", documentation: "The y coordinate of the pixel to check" }
        ],
        returns: "Color"
    },
    draw_getpixel_ext: {
        description: `Gets the full **32-bit AGBR** value of the pixel that is being drawn to the current render target at the input position

        **\`IMPORTANT\`** This function will cause a huge performance hit and so should only be used when absolutely necessary!`,
        documentationLink: "Drawing/Colour_And_Alpha/draw_getpixel",
        parameters: [
            { label: "x", type: "number", documentation: "The x coordinate of the pixel to check" },
            { label: "y", type: "number", documentation: "The y coordinate of the pixel to check" }
        ],
        returns: "number"
    },
    draw_get_alpha: {
        description: "Returns the current draw alpha, from `0.0-1.0`",
        documentationLink: "Drawing/Colour_And_Alpha/draw_get_alpha",
        parameters: [],
        returns: "number"
    },
    draw_get_alpha_test: {},
    draw_get_alpha_test_ref_value: {},
    draw_get_color: {
        description: "Returns the current draw color",
        documentationLink: "Drawing/Colour_And_Alpha/draw_get_colour",
        parameters: [],
        returns: "Color"
    },
    draw_get_swf_aa_level: {},
    draw_healthbar: {},
    draw_highscore: {},
    draw_line: {},
    draw_line_color: {},
    draw_line_width: {},
    draw_line_width_color: {},
    draw_path: {},
    draw_point: {},
    draw_point_color: {},
    draw_primitive_begin: {},
    draw_primitive_begin_texture: {},
    draw_primitive_end: {},
    draw_rectangle: {},
    draw_rectangle_color: {},
    draw_roundrect: {},
    draw_roundrect_color: {},
    draw_roundrect_color_ext: {},
    draw_roundrect_ext: {},
    draw_self: {},
    draw_set_alpha: {
        description: `Sets the global draw alpha to the input value, from \`0-1\``,
        documentationLink: "Drawing/Colour_And_Alpha/draw_set_alpha",
        parameters: [
            { label: "alpha", type: "number", documentation: "The alpha to set (between 0 and 1)" }
        ]
    },
    draw_set_alpha_test: {},
    draw_set_alpha_test_ref_value: {},
    draw_set_blend_mode: {},
    draw_set_blend_mode_ext: {},
    draw_set_circle_precision: {},
    draw_set_color: {
        description: `Sets the global draw color to the input value, from \`0-1\``,
        documentationLink: "Drawing/Colour_And_Alpha/draw_set_colour",
        parameters: [
            { label: "col", type: "Color", documentation: "The color to set" }
        ]
    },
    draw_set_color_write_enable: {},
    draw_set_font: {},
    draw_set_halign: {},
    draw_set_swf_aa_level: {},
    draw_set_valign: {},
    draw_skeleton: {},
    draw_skeleton_collision: {},
    draw_skeleton_instance: {},
    draw_skeleton_time: {},
    draw_sprite: {
        description: `Draws the given sprite and sub-image at a position within the game room.`,
        documentationLink: "Drawing/Sprites_And_Tiles/draw_sprite",
        parameters: [
            { label: 'sprite', type: "SpriteAsset", documentation: "" },
            { label: 'subimg', type: "number", documentation: "" },
            { label: 'x', type: "number", documentation: "" },
            { label: 'y', type: "number", documentation: "" }
        ],
    },
    draw_sprite_ext: {
        description: `Draws the given sprite and sub-image at a position within the game room, with transformations applied.`,
        documentationLink: "Drawing/Sprites_And_Tiles/draw_sprite_ext",
        parameters: [
            { label: 'sprite', type: "SpriteAsset" },
            { label: 'subimg', type: "number" },
            { label: 'x', type: "number" },
            { label: 'y', type: "number" },
            { label: 'xscale', type: "number" },
            { label: 'yscale', type: "number" },
            { label: 'rot', type: "number" },
            { label: 'color', type: "Color" },
            { label: 'alpha', type: "number" },
        ],
    },
    draw_sprite_general: {},
    draw_sprite_part: {},
    draw_sprite_part_ext: {},
    draw_sprite_pos: {},
    draw_sprite_stretched: {},
    draw_sprite_stretched_ext: {},
    draw_sprite_tiled: {},
    draw_sprite_tiled_ext: {},
    draw_surface: {},
    draw_surface_ext: {},
    draw_surface_general: {},
    draw_surface_part: {},
    draw_surface_part_ext: {},
    draw_surface_stretched: {},
    draw_surface_stretched_ext: {},
    draw_surface_tiled: {},
    draw_surface_tiled_ext: {},
    draw_text: {},
    draw_texture_flush: {},
    draw_text_color: {},
    draw_text_ext: {},
    draw_text_ext_color: {},
    draw_text_ext_transformed: {},
    draw_text_ext_transformed_color: {},
    draw_text_transformed: {},
    draw_text_transformed_color: {},
    draw_triangle: {},
    draw_triangle_color: {},
    draw_vertex: {},
    draw_vertex_color: {},
    draw_vertex_texture: {},
    draw_vertex_texture_color: {},
    make_color_hsv: {
        description: "Creates a color from hue, saturation, and value components",
        documentationLink: "Drawing/Colour_And_Alpha/make_colour_hsv",
        parameters: [
            { label: "hue", type: "number", documentation: "The hue of the color, from `0-255`" },
            { label: "sat", type: "number", documentation: "The saturation of the color, from `0-255`" },
            { label: "val", type: "number", documentation: "The value of the color, from `0-255`" },
        ],
        returns: "Color",
    },
    make_color_rgb: {
        description: "Creates a color from red, green, and blue components",
        documentationLink: "Drawing/Colour_And_Alpha/make_colour_rgb",
        parameters: [
            { label: "red", type: "number", documentation: "The amount of red, from `0-255`" },
            { label: "green", type: "number", documentation: "The amount of green, from `0-255`" },
            { label: "blue", type: "number", documentation: "The amount of blue, from `0-255`" },
        ],
        returns: "Color",
    },
    merge_color: {
        description: `Creates a color that is linearly interpolated (mixed) from two colors and a factor\n\n
        e.g. a factor of \`0\` returns \`col1\`; a factor of \`1\` returns \`col2\`; any values in between are mixed`,
        documentationLink: "Drawing/Colour_And_Alpha/merge_colour",
        parameters: [
            { label: "col1", type: "Color", documentation: "The base color" },
            { label: "col2", type: "Color", documentation: "The color to mix in" },
            { label: "factor", type: "number", documentation: "The factor deciding how much of ```col2``` gets mixed into ```col1```" },
        ],
        returns: "Color",
    },
    variable_instance_exists: {},
    variable_instance_get_names: {},
    variable_instance_names_count: {},
    variable_instance_get: {},
    variable_instance_set: {},
    variable_global_exists: {},
    variable_global_get: {},
    variable_global_set: {},
    nameof: {},
    typeof: {},
    method: {},
    method_get_self: {},
    method_get_index: {},
    method_call: {},
    struct_exists: {},
    struct_get: {},
    struct_set: {},
    struct_remove: {},
    struct_get_names: {},
    struct_names_count: {},
    is_instanceof: {},
    static_get: {},
    static_set: {},
    instanceof: {},
    struct_foreach: {},
    struct_get_from_hash: {},
    struct_set_from_hash: {},
    variable_get_hash: {},
    variable_clone: {},
}
export let globalVariables: EntryList = {
    async_load: {},
    browser_height: {},
    browser_width: {},
    caption_health: {},
    caption_lives: {},
    caption_score: {},
    current_day: {},
    current_hour: {},
    current_minute: {},
    current_month: {},
    current_second: {},
    current_time: {},
    current_weekday: {},
    current_year: {},
    cursor_sprite: {},
    debug_mode: {},
    delta_time: {},
    display_aa: {},
    error_last: {},
    error_occurred: {},
    event_action: {},
    event_number: {},
    event_object: {},
    event_type: {},
    fps: {},
    fps_real: {},
    game_id: {},
    health: {},
    instance_count: {},
    instance_id: {},
    keyboard_key: {},
    keyboard_lastchar: {},
    keyboard_lastkey: {},
    keyboard_string: {},
    lives: {},
    mouse_button: {},
    mouse_lastbutton: {},
    mouse_x: {},
    mouse_y: {},
    os_browser: {},
    os_device: {},
    os_type: {},
    os_version: {},
    program_directory: {},
    room: {},
    room_caption: {},
    room_first: {},
    room_height: {},
    room_last: {},
    room_persistent: {},
    room_speed: {},
    room_width: {},
    score: {},
    show_health: {},
    show_lives: {},
    show_score: {},
    temp_directory: {},
    transition_color: {},
    transition_kind: {},
    transition_steps: {},
    webgl_enabled: {},
    working_directory: {},
    alarm: {},
    bbox_bottom: {},
    bbox_left: {},
    bbox_right: {},
    bbox_top: {},
    depth: {},
    direction: {},
    friction: {},
    gravity: {},
    gravity_direction: {},
    hspeed: {},
    id: {},
    image_alpha: {},
    image_angle: {},
    image_blend: {},
    image_index: {},
    image_number: {},
    image_single: {},
    image_speed: {},
    image_xscale: {},
    image_yscale: {},
    mask_index: {},
    object_index: {},
    path_endaction: {},
    path_index: {},
    path_orientation: {},
    path_position: {},
    path_positionprevious: {},
    path_scale: {},
    path_speed: {},
    persistent: {},
    phy_active: {},
    phy_angular_damping: {},
    phy_angular_velocity: {},
    phy_bullet: {},
    phy_collision_points: {},
    phy_collision_x: {},
    phy_collision_y: {},
    phy_col_normal_x: {},
    phy_col_normal_y: {},
    phy_com_x: {},
    phy_com_y: {},
    phy_dynamic: {},
    phy_fixed_rotation: {},
    phy_inertia: {},
    phy_kinematic: {},
    phy_linear_damping: {},
    phy_linear_velocity_x: {},
    phy_linear_velocity_y: {},
    phy_mass: {},
    phy_position_x: {},
    phy_position_xprevious: {},
    phy_position_y: {},
    phy_position_yprevious: {},
    phy_rotation: {},
    phy_sleeping: {},
    phy_speed: {},
    phy_speed_x: {},
    phy_speed_y: {},
    solid: {},
    speed: {},
    sprite_height: {},
    sprite_index: {},
    sprite_width: {},
    sprite_xoffset: {},
    sprite_yoffset: {},
    timeline_index: {},
    timeline_loop: {},
    timeline_position: {},
    timeline_running: {},
    timeline_speed: {},
    visible: {},
    vspeed: {},
    x: {},
    xprevious: {},
    xstart: {},
    y: {},
    yprevious: {},
    ystart: {},
    view_enabled: {},
    view_current: {},
    background_color: {},
    background_showcolor: {},
    background_visible: {},
    background_foreground: {},
    background_index: {},
    background_x: {},
    background_y: {},
    background_width: {},
    background_height: {},
    background_htiled: {},
    background_vtiled: {},
    background_xscale: {},
    background_yscale: {},
    background_hspeed: {},
    background_vspeed: {},
    background_blend: {},
    background_alpha: {},
    layer: {},
    view_camera: {},
    event_data: {},

    //Obsolete variables
    view_angle: {deprecated: true},
    view_hborder: {deprecated: true},
    view_hport: {deprecated: true},
    view_hspeed: {deprecated: true},
    view_hview: {deprecated: true},
    view_object: {deprecated: true},
    view_vborder: {deprecated: true},
    view_visible: {deprecated: true},
    view_vspeed: {deprecated: true},
    view_wport: {deprecated: true},
    view_wview: {deprecated: true},
    view_xport: {deprecated: true},
    view_xview: {deprecated: true},
    view_yport: {deprecated: true},
    view_yview: {deprecated: true},
}
export let constants: EntryList = {
    _GMLINE_: {},
    _GMFILE_: {},
    _GMFUNCTION_: {},
    debug_mode: {},
    achievement_achievement_info: {},
    achievement_challenge_completed: {},
    achievement_challenge_completed_by_remote: {},
    achievement_challenge_launched: {},
    achievement_challenge_list_received: {},
    achievement_challenge_received: {},
    achievement_filter_all_players: {},
    achievement_filter_friends_only: {},
    achievement_friends_info: {},
    achievement_leaderboard_info: {},
    achievement_our_info: {},
    achievement_pic_loaded: {},
    achievement_player_info: {},
    achievement_purchase_info: {},
    achievement_show_achievement: {},
    achievement_show_bank: {},
    achievement_show_friend_picker: {},
    achievement_show_leaderboard: {},
    achievement_show_profile: {},
    achievement_show_purchase_prompt: {},
    achievement_show_ui: {},
    achievement_type_achievement_challenge: {},
    achievement_type_score_challenge: {},
    ANSI_CHARSET: {},
    ARABIC_CHARSET: {},
    asset_background: {},
    asset_font: {},
    asset_object: {},
    asset_path: {},
    asset_room: {},
    asset_script: {},
    asset_sound: {},
    asset_sprite: {},
    asset_timeline: {},
    asset_unknown: {},
    audio_3D: {},
    audio_falloff_exponent_distance: {},
    audio_falloff_exponent_distance_clamped: {},
    audio_falloff_inverse_distance: {},
    audio_falloff_inverse_distance_clamped: {},
    audio_falloff_linear_distance: {},
    audio_falloff_linear_distance_clamped: {},
    audio_falloff_none: {},
    audio_mono: {},
    audio_new_system: {},
    audio_old_system: {},
    audio_stereo: {},
    BALTIC_CHARSET: {},
    bm_add: {},
    bm_dest_alpha: {},
    bm_dest_color: {},
    bm_inv_dest_alpha: {},
    bm_inv_dest_color: {},
    bm_inv_src_alpha: {},
    bm_inv_src_color: {},
    bm_max: {},
    bm_normal: {},
    bm_one: {},
    bm_src_alpha: {},
    bm_src_alpha_sat: {},
    bm_src_color: {},
    bm_subtract: {},
    bm_zero: {},
    browser_chrome: {},
    browser_firefox: {},
    browser_ie: {},
    browser_ie_mobile: {},
    browser_not_a_browser: {},
    browser_opera: {},
    browser_safari: {},
    browser_safari_mobile: {},
    browser_tizen: {},
    browser_unknown: {},
    browser_windows_store: {},
    buffer_bool: {},
    buffer_f16: {},
    buffer_f32: {},
    buffer_f64: {},
    buffer_fast: {},
    buffer_fixed: {},
    buffer_generalerror: {},
    buffer_grow: {},
    buffer_invalidtype: {},
    buffer_outofbounds: {},
    buffer_outofspace: {},
    buffer_s16: {},
    buffer_s32: {},
    buffer_s8: {},
    buffer_seek_end: {},
    buffer_seek_relative: {},
    buffer_seek_start: {},
    buffer_string: {},
    buffer_u16: {},
    buffer_u32: {},
    buffer_u8: {},
    buffer_vbuffer: {},
    buffer_wrap: {},
    CHINESEBIG5_CHARSET: {},
    cr_appstart: {},
    cr_arrow: {},
    cr_beam: {},
    cr_cross: {},
    cr_default: {},
    cr_drag: {},
    cr_handpoint: {},
    cr_help: {},
    cr_hourglass: {},
    cr_hsplit: {},
    cr_multidrag: {},
    cr_no: {},
    cr_nodrop: {},
    cr_none: {},
    cr_size_all: {},
    cr_size_nesw: {},
    cr_size_ns: {},
    cr_size_nwse: {},
    cr_size_we: {},
    cr_sqlwait: {},
    cr_uparrow: {},
    cr_vsplit: {},
    c_aqua: { color: new Color(0, 1, 1, 1) },
    c_black: { color: new Color(0, 0, 0, 1) },
    c_blue: { color: new Color(0, 0, 1, 1) },
    c_dkgray: { color: new Color(0.25, 0.25, 0.25, 1) },
    c_fuchsia: { color: new Color(1, 0, 1, 1) },
    c_gray: { color: new Color(0.5, 0.5, 0.5, 1) },
    c_green: { color: new Color(0, 0.5, 0, 1) },
    c_lime: { color: new Color(0, 1, 0, 1) },
    c_ltgray: { color: new Color(0.75, 0.75, 0.75, 1) },
    c_maroon: { color: new Color(0.5, 0, 0, 1) },
    c_navy: { color: new Color(0, 0, 0.5, 1) },
    c_olive: { color: new Color(0.5, 0.5, 0, 1) },
    c_orange: { color: new Color(1, 0.63, 0.25, 1) },
    c_purple: { color: new Color(0.5, 0, 0.5, 1) },
    c_red: { color: new Color(1, 0, 0, 1) },
    c_silver: { color: new Color(0.75, 0.75, 0.75, 1) },
    c_teal: { color: new Color(0, 0.75, 0.75, 1) },
    c_white: { color: new Color(1, 1, 1, 1) },
    c_yellow: { color: new Color(1, 1, 0, 1) },
    DEFAULT_CHARSET: {},
    device_emulator: {},
    device_ios_ipad: {},
    device_ios_ipad_retina: {},
    device_ios_iphone: {},
    device_ios_iphone5: {},
    device_ios_iphone6: {},
    device_ios_iphone6plus: {},
    device_ios_iphone_retina: {},
    device_ios_unknown: {},
    device_tablet: {},
    display_landscape: {},
    display_landscape_flipped: {},
    display_portrait: {},
    display_portrait_flipped: {},
    dll_cdel: {},
    dll_cdecl: {},
    dll_stdcall: {},
    ds_type_grid: {},
    ds_type_list: {},
    ds_type_map: {},
    ds_type_priority: {},
    ds_type_queue: {},
    ds_type_stack: {},
    EASTEUROPE_CHARSET: {},
    ef_cloud: {},
    ef_ellipse: {},
    ef_explosion: {},
    ef_firework: {},
    ef_flare: {},
    ef_rain: {},
    ef_ring: {},
    ef_smoke: {},
    ef_smokeup: {},
    ef_snow: {},
    ef_spark: {},
    ef_star: {},
    ev_alarm: {},
    ev_animation_end: {},
    ev_boundary: {},
    ev_close_button: {},
    ev_collision: {},
    ev_create: {},
    ev_destroy: {},
    ev_draw: {},
    ev_end_of_path: {},
    ev_game_end: {},
    ev_game_start: {},
    ev_global_left_button: {},
    ev_global_left_press: {},
    ev_global_left_release: {},
    ev_global_middle_button: {},
    ev_global_middle_press: {},
    ev_global_middle_release: {},
    ev_global_press: {},
    ev_global_release: {},
    ev_global_right_button: {},
    ev_global_right_press: {},
    ev_global_right_release: {},
    ev_gui: {},
    ev_gui_begin: {},
    ev_gui_end: {},
    ev_joystick1_button1: {},
    ev_joystick1_button2: {},
    ev_joystick1_button3: {},
    ev_joystick1_button4: {},
    ev_joystick1_button5: {},
    ev_joystick1_button6: {},
    ev_joystick1_button7: {},
    ev_joystick1_button8: {},
    ev_joystick1_down: {},
    ev_joystick1_left: {},
    ev_joystick1_right: {},
    ev_joystick1_up: {},
    ev_joystick2_button1: {},
    ev_joystick2_button2: {},
    ev_joystick2_button3: {},
    ev_joystick2_button4: {},
    ev_joystick2_button5: {},
    ev_joystick2_button6: {},
    ev_joystick2_button7: {},
    ev_joystick2_button8: {},
    ev_joystick2_down: {},
    ev_joystick2_left: {},
    ev_joystick2_right: {},
    ev_joystick2_up: {},
    ev_keyboard: {},
    ev_keypress: {},
    ev_keyrelease: {},
    ev_left_button: {},
    ev_left_press: {},
    ev_left_release: {},
    ev_middle_button: {},
    ev_middle_press: {},
    ev_middle_release: {},
    ev_mouse: {},
    ev_mouse_enter: {},
    ev_mouse_leave: {},
    ev_mouse_wheel_down: {},
    ev_mouse_wheel_up: {},
    ev_no_button: {},
    ev_no_more_health: {},
    ev_no_more_lives: {},
    ev_other: {},
    ev_outside: {},
    ev_right_button: {},
    ev_right_press: {},
    ev_right_release: {},
    ev_room_end: {},
    ev_room_start: {},
    ev_step: {},
    ev_step_begin: {},
    ev_step_end: {},
    ev_step_normal: {},
    ev_trigger: {},
    ev_user0: {},
    ev_user1: {},
    ev_user10: {},
    ev_user11: {},
    ev_user12: {},
    ev_user13: {},
    ev_user14: {},
    ev_user15: {},
    ev_user2: {},
    ev_user3: {},
    ev_user4: {},
    ev_user5: {},
    ev_user6: {},
    ev_user7: {},
    ev_user8: {},
    ev_user9: {},
    fa_archive: {},
    fa_bottom: {},
    fa_center: {},
    fa_directory: {},
    fa_hidden: {},
    fa_left: {},
    fa_middle: {},
    fa_readonly: {},
    fa_right: {},
    fa_sysfile: {},
    fa_top: {},
    fa_volumeid: {},
    GB2312_CHARSET: {},
    gp_axislh: {},
    gp_axislv: {},
    gp_axisrh: {},
    gp_axisrv: {},
    gp_face1: {},
    gp_face2: {},
    gp_face3: {},
    gp_face4: {},
    gp_padd: {},
    gp_padl: {},
    gp_padr: {},
    gp_padu: {},
    gp_select: {},
    gp_shoulderl: {},
    gp_shoulderlb: {},
    gp_shoulderr: {},
    gp_shoulderrb: {},
    gp_start: {},
    gp_stickl: {},
    gp_stickr: {},
    GREEK_CHARSET: {},
    HANGEUL_CHARSET: {},
    HEBREW_CHARSET: {},
    JOHAB_CHARSET: {},
    lb_disp_none: {},
    lb_disp_numeric: {},
    lb_disp_time_ms: {},
    lb_disp_time_sec: {},
    lb_sort_ascending: {},
    lb_sort_descending: {},
    lb_sort_none: {},
    leaderboard_type_number: {},
    leaderboard_type_time_mins_secs: {},
    MAC_CHARSET: {},
    matrix_projection: {},
    matrix_view: {},
    matrix_world: {},
    mb_any: {},
    mb_left: {},
    mb_middle: {},
    mb_none: {},
    mb_right: {},
    network_socket_bluetooth: {},
    network_socket_tcp: {},
    network_socket_udp: {},
    network_type_connect: {},
    network_type_data: {},
    network_type_disconnect: {},
    OEM_CHARSET: {},
    of_challenge_lose: {},
    of_challenge_tie: {},
    of_challenge_win: {},
    os_android: {},
    os_ios: {},
    os_linux: {},
    os_macosx: {},
    os_psp: {},
    os_symbian: {},
    os_tizen: {},
    os_unknown: {},
    os_win32: {},
    os_win8native: {},
    os_windows: {},
    os_winphone: {},
    ov_achievements: {},
    ov_community: {},
    ov_friends: {},
    ov_gamegroup: {},
    ov_players: {},
    ov_settings: {},
    phy_debug_render_aabb: {},
    phy_debug_render_collision_pairs: {},
    phy_debug_render_coms: {},
    phy_debug_render_core_shapes: {},
    phy_debug_render_joints: {},
    phy_debug_render_obb: {},
    phy_debug_render_shapes: {},
    phy_joint_anchor_1_x: {},
    phy_joint_anchor_1_y: {},
    phy_joint_anchor_2_x: {},
    phy_joint_anchor_2_y: {},
    phy_joint_angle: {},
    phy_joint_angle_limits: {},
    phy_joint_damping_ratio: {},
    phy_joint_frequency: {},
    phy_joint_length_1: {},
    phy_joint_length_2: {},
    phy_joint_lower_angle_limit: {},
    phy_joint_max_motor_force: {},
    phy_joint_max_motor_torque: {},
    phy_joint_motor_force: {},
    phy_joint_motor_speed: {},
    phy_joint_motor_torque: {},
    phy_joint_reaction_force_x: {},
    phy_joint_reaction_force_y: {},
    phy_joint_reaction_torque: {},
    phy_joint_speed: {},
    phy_joint_translation: {},
    phy_joint_upper_angle_limit: {},
    pi: {},
    pr_linelist: {},
    pr_linestrip: {},
    pr_pointlist: {},
    pr_trianglefan: {},
    pr_trianglelist: {},
    pr_trianglestrip: {},
    ps_change_all: {},
    ps_change_motion: {},
    ps_change_shape: {},
    ps_deflect_horizontal: {},
    ps_deflect_vertical: {},
    ps_distr_gaussian: {},
    ps_distr_invgaussian: {},
    ps_distr_linear: {},
    ps_force_constant: {},
    ps_force_linear: {},
    ps_force_quadratic: {},
    ps_shape_diamond: {},
    ps_shape_ellipse: {},
    ps_shape_line: {},
    ps_shape_rectangle: {},
    pt_shape_circle: {},
    pt_shape_cloud: {},
    pt_shape_disk: {},
    pt_shape_explosion: {},
    pt_shape_flare: {},
    pt_shape_line: {},
    pt_shape_pixel: {},
    pt_shape_ring: {},
    pt_shape_smoke: {},
    pt_shape_snow: {},
    pt_shape_spark: {},
    pt_shape_sphere: {},
    pt_shape_square: {},
    pt_shape_star: {},
    RUSSIAN_CHARSET: {},
    SHIFTJIS_CHARSET: {},
    SYMBOL_CHARSET: {},
    THAI_CHARSET: {},
    TURKISH_CHARSET: {},
    ty_real: {},
    ty_string: {},
    vertex_type_colour: {},
    vertex_type_float1: {},
    vertex_type_float2: {},
    vertex_type_float3: {},
    vertex_type_float4: {},
    vertex_type_ubyte4: {},
    vertex_usage_binormal: {},
    vertex_usage_blendindices: {},
    vertex_usage_blendweight: {},
    vertex_usage_colour: {},
    vertex_usage_depth: {},
    vertex_usage_fog: {},
    vertex_usage_normal: {},
    vertex_usage_position: {},
    vertex_usage_psize: {},
    vertex_usage_sample: {},
    vertex_usage_tagnet: {},
    vertex_usage_textcoord: {},
    VIETNAMESE_CHARSET: {},
    vk_add: {},
    vk_alt: {},
    vk_anykey: {},
    vk_backspace: {},
    vk_control: {},
    vk_decimal: {},
    vk_delete: {},
    vk_divide: {},
    vk_down: {},
    vk_end: {},
    vk_enter: {},
    vk_escape: {},
    vk_f1: {},
    vk_f10: {},
    vk_f11: {},
    vk_f12: {},
    vk_f2: {},
    vk_f3: {},
    vk_f4: {},
    vk_f5: {},
    vk_f6: {},
    vk_f7: {},
    vk_f8: {},
    vk_f9: {},
    vk_home: {},
    vk_insert: {},
    vk_lalt: {},
    vk_lcontrol: {},
    vk_left: {},
    vk_lshift: {},
    vk_multiply: {},
    vk_nokey: {},
    vk_numpad0: {},
    vk_numpad1: {},
    vk_numpad2: {},
    vk_numpad3: {},
    vk_numpad4: {},
    vk_numpad5: {},
    vk_numpad6: {},
    vk_numpad7: {},
    vk_numpad8: {},
    vk_numpad9: {},
    vk_pagedown: {},
    vk_pageup: {},
    vk_pause: {},
    vk_printscreen: {},
    vk_ralt: {},
    vk_rcontrol: {},
    vk_return: {},
    vk_right: {},
    vk_rshift: {},
    vk_shift: {},
    vk_space: {},
    vk_subtract: {},
    vk_tab: {},
    vk_up: {},

    //New in GameMaker Studio 2
    path_action_stop: {},
    path_action_restart: {},
    path_action_continue: {},
    path_action_reverse: {},
    gamespeed_fps: {},
    gamespeed_microseconds: {},
    ev_gesture: {},
    ev_gesture_tap: {},
    ev_gesture_double_tap: {},
    ev_gesture_drag_start: {},
    ev_gesture_dragging: {},
    ev_gesture_drag_end: {},
    ev_gesture_flick: {},
    ev_gesture_pinch_start: {},
    ev_gesture_pinch_in: {},
    ev_gesture_pinch_out: {},
    ev_gesture_pinch_end: {},
    ev_gesture_rotate_start: {},
    ev_gesture_rotating: {},
    ev_gesture_rotate_end: {},
    ev_global_gesture_tap: {},
    ev_global_gesture_double_tap: {},
    ev_global_gesture_drag_start: {},
    ev_global_gesture_dragging: {},
    ev_global_gesture_drag_end: {},
    ev_global_gesture_flick: {},
    ev_global_gesture_pinch_start: {},
    ev_global_gesture_pinch_in: {},
    ev_global_gesture_pinch_out: {},
    ev_global_gesture_pinch_end: {},
    ev_global_gesture_rotate_start: {},
    ev_global_gesture_rotating: {},
    ev_global_gesture_rotate_end: {},
    bm_complex: {},
    tf_point: {},
    tf_linear: {},
    tf_anisotropic: {},
    mip_off: {},
    mip_on: {},
    mip_markedonly: {},
    asset_tiles: {},
    asset_shader: {},
    tile_rotate: {},
    tile_flip: {},
    tile_mirror: {},
    tile_index_mask: {},
    layerelementtype_undefined: {},
    layerelementtype_background: {},
    layerelementtype_instance: {},
    layerelementtype_oldtilemap: {},
    layerelementtype_sprite: {},
    layerelementtype_tilemap: {},
    layerelementtype_particlesystem: {},
    layerelementtype_tile: {},
    cmpfunc_never: {},
    cmpfunc_less: {},
    cmpfunc_equal: {},
    cmpfunc_lessequal: {},
    cmpfunc_greater: {},
    cmpfunc_notequal: {},
    cmpfunc_greaterequal: {},
    cmpfunc_always: {},
    cull_noculling: {},
    cull_clockwise: {},
    cull_counterclockwise: {},
    lighttype_dir: {},
    lighttype_point: {},
    spritespeed_framespersecond: {},
    spritespeed_framespergameframe: {},
    browser_edge: {},
    of_challen: {},
    ge_lose: {},
    buffer_text: {},
}
export let keywords: EntryList = {
    noone: {
        detail: "-4"
    },
    all: {},
    argument: {},
    argument_count: {},
    argument_relative: {},
    self: {},
    other: {},
    global: {},
    try: {},
    catch: {},
    finally: {},
    delete: {},
    break: {},
    case: {},
    continue: {},
    default: {},
    do: {},
    else: {},
    exit: {},
    for: {},
    if: {},
    repeat: {},
    return: {},
    switch: {},
    until: {},
    var: {},
    while: {},
    with: {},
    pointer_invalid: {},
    pointer_null: {},
};

let _globalFunctions = Object.freeze(Object.assign({}, globalFunctions))
let _constants = Object.freeze(Object.assign({}, constants))
