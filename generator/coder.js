class SVGPathGenerator {
    /**
     * Constructor. Options are now less critical as JSON defines properties,
     * but can still be used for defaults if not in JSON (less recommended).
     *
     *  - `defaultCornerRadius`: Default radius if not specified in points (default: 0).
     *  - `closePath`:  Default closePath behavior (default: false).
     *  - `xKey`:  Key for x coordinate (default: 'x').
     *  - `yKey`: Key for y coordinate (default: 'y').
     *
     * @param {object} options
     */
    constructor(options = {}) {
        this.defaultCornerRadius = options.cornerRadius || 0;
        this.closePath = options.closePath || false;
        this.xKey = options.xKey || 'x';
        this.yKey = options.yKey || 'y';
        // Stroke and fill defaults are less relevant now, as JSON is primary
        this.defaultStroke = options.stroke || 'none';
        this.defaultFill = options.fill || 'none';
    }


    /**
     * Creates a rounded SVG path 'd' attribute string from an array of coordinates.
     * @param {Array<{x: number, y: number}>} coords Array of coordinates.
     * @param {number} radius Corner radius.
     * @param {boolean} close Whether to close the path (Z command).
     * @returns {string} The SVG path 'd' attribute string.
     */
    createRoundedPath(coords, radius, close) {
        let path = ""
        const length = coords.length + (close ? 1 : -1)
        for (let i = 0; i < length; i++) {
            const a = coords[i % coords.length]
            const b = coords[(i + 1) % coords.length]
            const t = Math.min(radius / Math.hypot(b.x - a.x, b.y - a.y), 0.5)

            if (i > 0) path += `Q${a.x},${a.y} ${a.x * (1 - t) + b.x * t},${a.y * (1 - t) + b.y * t}`

            if (!close && i == 0) path += `M${a.x},${a.y}`
            else if (i == 0) path += `M${a.x * (1 - t) + b.x * t},${a.y * (1 - t) + b.y * t}`

            if (!close && i == length - 1) path += `L${b.x},${b.y}`
            else if (i < length - 1) path += `L${a.x * t + b.x * (1 - t)},${a.y * t + b.y * (1 - t)}`
        }
        if (close) path += "Z"
        return path
    }


    /**
     * Converts an array of points (objects with x, y, and optional cornerRadius)
     * into an SVG path 'd' attribute string.  Now uses createRoundedPath.
     *
     * @param {Array<object>} points Array of points. Each point should have
     *  x and y properties, and optionally a `cornerRadius` property.
     * @returns {string} The SVG path 'd' attribute string.
     */
    pointsToPath(points) {
        if (!points || points.length === 0) {
            return "";
        }

        const xKey = this.xKey;
        const yKey = this.yKey;
        // Extract coordinates and determine the global corner radius.
        const coords = points.map(p => ({ x: p[xKey], y: p[yKey] }));

        // Use the cornerRadius from the first point, if provided.  Otherwise, the default.
        const radius = points[0].cornerRadius !== undefined ? points[0].cornerRadius : this.defaultCornerRadius;
        return this.createRoundedPath(coords, radius, this.closePath);
    }


    /**
     * Converts a JSON string defining the path (including points and properties)
     * into an SVG path element string.
     *
     * JSON format:
     * {
     *   "points": [ { "x": 10, "y": 10, "cornerRadius": 5 }, ... ], // Array of points
     *   "stroke": "blue",          // Optional stroke color
     *   "fill": "lightblue",        // Optional fill color
     *   "stroke-width": 2,         // Optional stroke width (use SVG attribute names)
     *   "closePath": true,         // Optional, override default closePath
     *   ...                        // Add any other SVG path attributes as needed
     * }
     *
     * @param {string} jsonPathDefinition JSON string defining the path.
     * @returns {string} The complete SVG path element string (<path ... />).
     */
    generateSvgPathElementFromJson(jsonPathDefinition) {
        try {
            const pathData = JSON.parse(jsonPathDefinition);
            const points = pathData.points;
            if (!Array.isArray(points)) {
                console.error("JSON Path Definition Error: 'points' array is missing or not an array.");
                return '<path d="" />'; // Return minimal invalid path
            }

            // Get closePath from JSON if available, else use the instance default
            const closePath = pathData.hasOwnProperty('closePath') ? pathData.closePath : this.closePath;
            this.closePath = closePath; // Update instance closePath
            const dAttribute = this.pointsToPath(points);
            let attributesString = `d="${dAttribute}"`;

            // Add SVG attributes from JSON (stroke, fill, stroke-width, etc.)
            for (const key in pathData) {
                if (key !== 'points' && key !== 'closePath') { // Don't add points again, handle closePath
                    attributesString += ` ${key}="${pathData[key]}"`;
                }
            }

            return `<path ${attributesString} />`;

        } catch (e) {
            console.error("Error parsing JSON path definition:", e);
            return '<path d="" />'; // Return minimal invalid path in case of error
        }
    }


    /**
     * Decodes an SVG path string back into an array of points.
     * (Decoder remains the same from previous versions)
     *
     * @param {string} pathString The SVG path 'd' attribute string to decode.
     * @returns {Array<object>} An array of point objects, each with x and y properties.
     */
    pathToPoints(pathString) { // ... (same pathToPoints implementation as before) ...
        const points = [];
        const commands = pathString.trim().split(/(?=[MLAZ])/i); // Split into commands

        let currentX = 0;
        let currentY = 0;

        for (const command of commands) {
            const parts = command.trim().split(/[ ,]+/);  //Split by spaces or commas
            const type = parts[0].toUpperCase();


            switch (type) {
                case "M": // Move to
                    currentX = parseFloat(parts[1]);
                    currentY = parseFloat(parts[2]);
                    points.push({ x: currentX, y: currentY });
                    break;
                case "L": // Line to
                    currentX = parseFloat(parts[1]);
                    currentY = parseFloat(parts[2]);
                    points.push({ x: currentX, y: currentY });
                    break;
                case "A": // Arc
                    //Simplified arc handling.  Full arc parsing is complex.
                    currentX = parseFloat(parts[6]); //x
                    currentY = parseFloat(parts[7]); //y

                    points.push({ x: currentX, y: currentY });
                    break;
                case "Q": // Quadratic Bezier Curve
                    // Simplified quadratic curve handling (similar to arc)
                    currentX = parseFloat(parts[3]);
                    currentY = parseFloat(parts[4]);
                    points.push({ x: currentX, y: currentY });
                    break;
                case "Z": // Close path (back to the first point)
                    if (points.length > 0) {
                        //This is a simple implementation
                        points.push({ x: points[0].x, y: points[0].y });
                        currentX = points[0].x;
                        currentY = points[0].y;
                    }
                    break;
                default:
                    // Ignore unknown commands.  Could add error handling here.
                    console.warn(`Unknown SVG path command: ${type}`);
            }
        }

        return points;
    }


    /**
     * Decodes a JSON string containing an SVG path 'd' attribute string into a JSON string of points.
     * (Decoder remains the same from previous versions)
     *
     * @param {string} svgPathJsonString JSON string containing the SVG path 'd' attribute string.
     * @returns {string} JSON string representing an array of point objects.
     */
    svgPathStringToJsonPoints(svgPathJsonString) { // ... (same svgPathStringToJsonPoints implementation as before) ...
        try {
            const pathString = JSON.parse(svgPathJsonString);
            const points = this.pathToPoints(pathString);
            return JSON.stringify(points);
        } catch (e) {
            console.error("Error parsing JSON path string or stringifying points:", e);
            return "[]"; // Or handle error as needed, return empty JSON array in case of error
        }
    }


    /** Helper methods for debugging/testing - not directly related to JSON but kept for completeness */
    pathToString(pathString) {
        return pathString.trim();
    }
    pathToStringWithoutFirstM(pathString) {
        const trimmedPath = pathString.trim();
        if (!trimmedPath.startsWith("M") && !trimmedPath.startsWith("m")) return trimmedPath;
        let firstMIndex = 0;
        for (let i = 0; i < trimmedPath.length; i++) {
            const char = trimmedPath[i];
            if (char === ' ' || char === ',') {
                firstMIndex = i;
                break;
            }
        }
        return trimmedPath.substring(firstMIndex).trim();
    }


}

// Export the class if you are using modules
// if (typeof module !== 'undefined' && module.exports) {
//   module.exports = SVGPathGenerator;
// }
