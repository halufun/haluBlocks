// ext/sprites.js (remains mostly the same, but no generators)
function generator(Blockly) {

  const blocks = [
    {
      "type": "create_sprite",
      "message0": "create sprite with id %1 color %2 x %3 y %4",
      "args0": [
        { "type": "field_input", "name": "ID", "text": "sprite1" },
        { "type": "field_colour", "name": "COLOR", "colour": "#ff0000" },
        { "type": "field_number", "name": "X", "value": 0 },
        { "type": "field_number", "name": "Y", "value": 0 },
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 210,
      "tooltip": "Creates a new sprite.",
      "helpUrl": "",
    },
    {
      "type": "get_sprite_x",
      "message0": "x of sprite %1",
      "args0": [{ "type": "field_input", "name": "ID", "text": "sprite1" }],
      "output": "Number",
      "colour": 210,
      "tooltip": "Gets sprite x.",
      "helpUrl": "",
    },
    {
      "type": "get_sprite_y",
      "message0": "y of sprite %1",
      "args0": [{ "type": "field_input", "name": "ID", "text": "sprite1" }],
      "output": "Number",
      "colour": 210,
      "tooltip": "Gets sprite y.",
      "helpUrl": "",
    },
    {
      "type": "move_sprite",
      "message0": "move sprite %1 to x: %2 y: %3",
      "args0": [
        { "type": "field_input", "name": "SPRITE_ID", "text": "sprite1" },
        { "type": "field_number", "name": "X", "value": 0 },
        { "type": "field_number", "name": "Y", "value": 0 },
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 210,
      "tooltip": "Moves a sprite.",
      "helpUrl": "",
    },
    {
      "type": "change_sprite_x",
      "message0": "change sprite %1 x by %2",
      "args0": [
        { "type": "field_input", "name": "SPRITE_ID", "text": "sprite1" },
        { "type": "field_number", "name": "DX", "value": 10 },
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 210,
      "tooltip": "Changes sprite x.",
      "helpUrl": "",
    },
    {
      "type": "change_sprite_y",
      "message0": "change sprite %1 y by %2",
      "args0": [
        { "type": "field_input", "name": "SPRITE_ID", "text": "sprite1" },
        { "type": "field_number", "name": "DY", "value": 10 },
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 210,
      "tooltip": "Changes sprite y.",
      "helpUrl": "",
    },
    {
      "type": "set_sprite_visible",
      "message0": "set sprite %1 visible %2",
      "args0": [
        { "type": "field_input", "name": "ID", "text": "sprite1" },
        { "type": "field_checkbox", "name": "VISIBLE", "checked": true },
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 210,
      "tooltip": "Shows/hides sprite.",
      "helpUrl": "",
    },
  ];

  return {
    blocks: blocks, // Only return block definitions
    init: function(workspace) {}
  };
}

export default generator;