class SVGPathGenerator {
    constructor(options = {}) {
        this.defaultCornerRadius = options.cornerRadius || 0;
        this.closePath = options.closePath || false;
        this.xKey = options.xKey || 'x';
        this.yKey = options.yKey || 'y';
        this.defaultStroke = options.stroke || 'none';
        this.defaultFill = options.fill || 'none';
    }

    function createRoundedPath(coords, defaultRadius, close) {
    let pathData = "";

    if (!coords || coords.length < 2) {
        return ""; // Need at least two points to draw a path
    }

    // Helper function to calculate control points for rounded corners
    function calculateControlPoints(p0, p1, p2, radius) {
        // Vectors between points
        const v1 = { x: p0.x - p1.x, y: p0.y - p1.y };
        const v2 = { x: p2.x - p1.x, y: p2.y - p1.y };

        // Length of vectors
        const lenV1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const lenV2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

        // Normalize vectors
        const normV1 = { x: v1.x / lenV1, y: v1.y / lenV1 };
        const normV2 = { x: v2.x / lenV2, y: v2.y / lenV2 };

        // Angle between vectors
        const angle = Math.acos(normV1.x * normV2.x + normV1.y * normV2.y);

        // Radius cannot be greater than half the distance to the closest point
        const maxRadius = Math.min(lenV1 / 2, lenV2 / 2);
        const actualRadius = Math.min(radius, maxRadius);

        // Distance to move along each vector for control points
        const dist = actualRadius / Math.tan(angle / 2);

        // Control points
        const c1 = { x: p1.x + normV1.x * dist, y: p1.y + normV1.y * dist };
        const c2 = { x: p1.x + normV2.x * dist, y: p1.y + normV2.y * dist };

        return { c1, c2, actualRadius };
    }

    // Start the path
    pathData += `M${coords[0].x},${coords[0].y} `;

    // Iterate through points, handling rounded corners
    for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i - 1] || (close ? coords[coords.length - 1] : coords[0]);  // Previous point, handling wrap-around for closed paths
        const p1 = coords[i];     // Current point
        const p2 = coords[i + 1]; // Next point
        const radius = p1.cornerRadius !== undefined ? p1.cornerRadius : defaultRadius;
        
        if (radius > 0 ) { //if the point is sharp then there is no need for rounded corner
          // Calculate control points
          const { c1, c2, actualRadius } = calculateControlPoints(p0, p1, p2, radius);
  
          // Draw a straight line to the first control point
          pathData += `L${c1.x},${c1.y} `;
  
          // Draw an arc to the second control point
          // Use quadratic Bezier curve for smooth corners
          pathData += `Q${p1.x},${p1.y} ${c2.x},${c2.y} `;
        } else {
          pathData += `L ${p1.x} ${p1.y} `;
        }
    }
    
    //add the last line segment
    const last = coords.at(-1);
    const secondLast = coords.at(-2)
    const start = coords[0]
    const radius = last.cornerRadius !== undefined ? last.cornerRadius : defaultRadius;
    if (radius > 0 ) {
       // Calculate control points
      const { c1, c2, actualRadius } = calculateControlPoints(secondLast, last, start, radius);
      // Draw a straight line to the first control point
      pathData += `L${c1.x},${c1.y} `;
      pathData += `Q${last.x},${last.y} ${c2.x},${c2.y} `;
    } else {
       pathData += `L ${last.x} ${last.y} `;
    }

    // Close the path if needed
    if (close) {
        pathData += "Z";
    }

    return pathData;
}
     pointsToPath(points) {
        if (!points || points.length === 0) {
            return "";
        }

        const xKey = this.xKey;
        const yKey = this.yKey;

        const coords = points.map(p => ({
            x: p[xKey],
            y: p[yKey],
            cornerRadius: p['corner-radius'] !== undefined ? p['corner-radius'] : (p.cornerRadius !== undefined ? p.cornerRadius : 0)
        }));

        const defaultRadius = this.defaultCornerRadius;
        return this.createRoundedPath(coords, defaultRadius, this.closePath);
    }
    generateSvgPathElementFromJson(jsonPathDefinition) {
        try {
            const pathData = JSON.parse(jsonPathDefinition);
            const points = pathData.points;
            if (!Array.isArray(points)) {
                console.error("JSON Path Definition Error: 'points' array is missing or not an array.");
                return '<path d="" />';
            }

            const closePath = pathData.hasOwnProperty('closePath') ? pathData.closePath : this.closePath;
            this.closePath = closePath;
            const dAttribute = this.pointsToPath(points);
            let attributesString = `d="${dAttribute}"`;

            for (const key in pathData) {
                if (key !== 'points' && key !== 'closePath') {
                    attributesString += ` ${key}="${pathData[key]}"`;
                }
            }

            return `<path ${attributesString} />`;

        } catch (e) {
            console.error("Error parsing JSON path definition:", e);
            return '<path d="" />';
        }
    }
    pathToPoints(pathString) {
        const points = [];
        const commands = pathString.trim().split(/(?=[MLAZC])/i);

        let currentX = 0;
        let currentY = 0;

        for (const command of commands) {
            const parts = command.trim().split(/[ ,]+/);
            const type = parts[0].toUpperCase();

            switch (type) {
                case "M":
                    currentX = parseFloat(parts[1]);
                    currentY = parseFloat(parts[2]);
                    points.push({ x: currentX, y: currentY });
                    break;
                case "L":
                    currentX = parseFloat(parts[1]);
                    currentY = parseFloat(parts[2]);
                    points.push({ x: currentX, y: currentY });
                    break;
                case "A":
                    currentX = parseFloat(parts[6]);
                    currentY = parseFloat(parts[7]);
                    points.push({ x: currentX, y: currentY });
                    break;
                case "Q":
                    currentX = parseFloat(parts[3]);
                    currentY = parseFloat(parts[4]);
                    points.push({ x: currentX, y: currentY });
                    break;
                case "C":
                    currentX = parseFloat(parts[5]);
                    currentY = parseFloat(parts[6]);
                    points.push({ x: currentX, y: currentY });
                    break;
                case "Z":
                    if (points.length > 0) {
                        points.push({ x: points[0].x, y: points[0].y });
                        currentX = points[0].x;
                        currentY = points[0].y;
                    }
                    break;
                default:
                    console.warn(`Unknown SVG path command: ${type}`);
            }
        }

        return points;
    }
    svgPathStringToJsonPoints(svgPathJsonString) {
        try {
            const pathString = JSON.parse(svgPathJsonString);
            const points = this.pathToPoints(pathString);
            return JSON.stringify(points);
        } catch (e) {
            console.error("Error parsing JSON path string or stringifying points:", e);
            return "[]";
        }
    }
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
