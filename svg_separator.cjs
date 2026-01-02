const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'src/assets/Windmills.svg');
const bladesPath = path.join(__dirname, 'src/assets/windmill_blades.svg');
const basePath = path.join(__dirname, 'src/assets/windmill_base.svg');

try {
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    // Simple regex to capture paths. 
    // We capture the full path tag.
    const pathMatch = /<path[^>]*d="([^"]+)"[^>]*\/>/g;
    const defsMatch = /<defs>[\s\S]*?<\/defs>/;
    const headerMatch = /<svg[^>]*>/;

    const header = svgContent.match(headerMatch) ? svgContent.match(headerMatch)[0] : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" width="1024" height="1024">';
    const defs = svgContent.match(defsMatch) ? svgContent.match(defsMatch)[0] : '';
    const footer = '</svg>';

    let bladesPaths = [];
    let basePaths = [];

    let match;
    while ((match = pathMatch.exec(svgContent)) !== null) {
        const fullTag = match[0];
        const dAttr = match[1];

        // Extract numbers from d attribute
        const numbersStr = dAttr.match(/[-+]?[0-9]*\.?[0-9]+/g);

        if (!numbersStr) {
            basePaths.push(fullTag); // Assume structure if no coordinates found
            continue;
        }

        const numbers = numbersStr.map(Number);

        // Heuristic:
        // Base paths likely have Y > 1600.
        // Blade paths likely have Y < 1600 (mostly).
        // Since coordinate systems can be weird, let's look at the DISTRIBUTION.
        // If the path is entirely above Y=1500, it's probably blades or top structure.
        // If it touches the bottom (Y > 1900), it's definitely base.

        let maxY = -Infinity;
        let minY = Infinity;

        // This heuristic assumes coordinates are somewhat interleaved or just loosely checks everything.
        for (const num of numbers) {
            if (num > maxY) maxY = num;
            if (num < minY) minY = num;
        }

        // Refined Heuristic:
        // The blades are a circle at the top. They rarely go below Y=1200?
        // The structure is a tower. It goes from Y=~1000 to Y=2048.
        // Paths that go BELOW 1500 are likely structure.
        // Paths that stay ABOVE 1500... wait, 0 is at the top in SVG usually.
        // SVG Coord system: (0,0) is TOP LEFT.
        // 2048 is BOTTOM.

        // Logic:
        // Blades are at the TOP. So Y values should be SMALL.
        // Structure is at the BOTTOM. So Y values should be LARGE (approaching 2048).
        // The tower starts below the blades.

        // Let's assume the Hub is around Y=800? 
        // Anything below Y=1400 (bigger Y value) is structure.
        // Anything that STAYS above Y=1400 (smaller Y value) is blades.

        // Correction: if maxY > 1400, it touches the bottom area -> Base.

        if (maxY > 1400) {
            basePaths.push(fullTag);
        } else {
            bladesPaths.push(fullTag);
        }
    }

    const bladesSVG = header + '\n' + defs + '\n<g>' + bladesPaths.join('\n') + '</g>\n' + footer;
    const baseSVG = header + '\n' + defs + '\n<g>' + basePaths.join('\n') + '</g>\n' + footer;

    fs.writeFileSync(bladesPath, bladesSVG);
    fs.writeFileSync(basePath, baseSVG);

    console.log("Split " + bladesPaths.length + " blade paths and " + basePaths.length + " base paths.");

} catch (err) {
    console.error("Error processing SVG:", err);
    process.exit(1);
}
