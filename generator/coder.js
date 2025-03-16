class SVGPathGenerator {
    constructor(options = {}) {
        this.defaultCornerRadius = options.cornerRadius || 0;
        this.closePath = options.closePath || false;
        this.xKey = options.xKey || 'x';
        this.yKey = options.yKey || 'y';
        this.defaultStroke = options.stroke || 'none';
        this.defaultFill = options.fill || 'none';
    }

    createRoundedPath(coords, defaultRadius, close) {
        if (!coords || coords.length === 0) {
            return "";
        }

        let path = "";
        const len = coords.length;

        const closedCoords = close ? [...coords, coords[0]] : coords;
        const closedLen = closedCoords.length;

        for (let i = 0; i < (close ? len : closedLen); i++) {
            const current = closedCoords[i];
            const prev = closedCoords[(i - 1 + closedLen) % closedLen];
            const next = closedCoords[(i + 1) % closedLen];

            const radius = current.cornerRadius !== undefined ? current.cornerRadius : defaultRadius;

            if (i === 0) {
                path += `M ${current.x},${current.y} `;
            } else {
                const prevDx = current.x - prev.x;
                const prevDy = current.y - prev.y;
                const nextDx = next.x - current.x;
                const nextDy = next.y - current.y;

                const prevDist = Math.sqrt(prevDx * prevDx + prevDy * prevDy);
                const nextDist = Math.sqrt(nextDx * nextDx + nextDy * nextDy);

                const actualRadius = Math.min(radius, prevDist / 2, nextDist / 2);

                const control1X = current.x - (prevDx / prevDist) * actualRadius;
                const control1Y = current.y - (prevDy / prevDist) * actualRadius;
                const control2X = current.x + (nextDx / nextDist) * actualRadius;
                const control2Y = current.y + (nextDy / nextDist) * actualRadius;

                // NaN Check and Logging
                if (isNaN(control1X) || isNaN(control1Y) || isNaN(control2X) || isNaN(control2Y)) {
                    console.error(`NaN detected at point ${i} (original index: ${i % len}).`);
                    console.log("  prev:", prev, "current:", current, "next:", next);
                    console.log("  radius:", radius, "actualRadius:", actualRadius);
                    console.log("  prevDx:", prevDx, "prevDy:", prevDy, "prevDist:", prevDist);
                    console.log("  nextDx:", nextDx, "nextDy:", nextDy, "nextDist:", nextDist);
                    console.log("  control1X:", control1X, "control1Y:", control1Y);
                    console.log("  control2X:", control2X, "control2Y:", control2Y);
                }
                if (i === 1 && !close) {
                    path = `M ${control1X},${control1Y} `;
                }
                else {
                    path += `L ${control1X},${control1Y} `;
                }
                path += `C ${current.x},${current.y} ${current.x},${current.y} ${control2X},${control2Y} `;
            }
        }

        if (close) {
            path += "Z";
        }
        return path;
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
