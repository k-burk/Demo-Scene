var indices = [];
var normals = [];
var vertices = [];

class Surface
{
    constructor(initialX, finalX, initialY, finalY, xDivisions, yDivisions)
    {
        this.initialX = initialX;
        this.finalX = finalX;
        this.initialY = initialY;
        this.finalY = finalY;
        this.xDivisions = xDivisions;
        this.yDivisions = yDivisions;
        this.numIndices = (xDivisions-1) * (yDivisions-1) * 6;
    }
}

// Subdivisions are for the total amount of divisions along
// the x and y intervals.
var subDivisions = 13;
var square = new Surface(-1, 1, -1, 1, subDivisions, subDivisions)

function generateGeometry(surface, time)
{
    normals = [];
    vertices = [];
    //These intervals needed to be discretized to create a shape we can
    // visualize in webgl browser
    var discreteXinterval = new Array(surface.xDivisions);
    var discreteYinterval = new Array(surface.yDivisions);
    var dx = (surface.finalX-surface.initialX) / (surface.xDivisions-1);
    var dy = (surface.finalY-surface.initialY) / (surface.yDivisions-1);

    // Discretize intervals
    for (let i = 0; i < surface.xDivisions; i++) { discreteXinterval[i] = dx * i + surface.initialX; }

    for (let i = 0; i < surface.yDivisions; i++) { discreteYinterval[i] = dy * i + surface.initialY; }

    // Calculate vertices
    for (const x of discreteXinterval)
    {
        for (const y of discreteYinterval)
        {
            var pos = vec3(x, y, 1.0);
            var pos2 = vec3(pos);
            // Needs to be negative, which is why I have the absolute
            // value method there
            var morph = -Math.abs(1.6 * (time % 7.5) - 6) + 5;
            vertices.push(mix(pos, normalize(pos2), morph));
        }
    }

    // Calculate Normals
    for (let i = 0; i < surface.xDivisions; i++)
    {
        for (let j = 0; j <  surface.yDivisions; j++)
        {
            // Important vectors for the flowerbox
            var v = vertices[i*surface.yDivisions + j];
            var viprev = vertices[i*surface.yDivisions + j - 1];
            var vinext = vertices[i*surface.yDivisions + j + 1];
            var vjprev = vertices[(i-1)*surface.yDivisions + j];
            var vjnext = vertices[(i+1)*surface.yDivisions + j];

            // Find Partials
            // We need to determine specifically where the partials are based
            // on the mod function
            if (j % surface.xDivisions === 0) { partialX = subtract(vinext, v); }
            else if ((j+1) % surface.xDivisions === 0) { partialX = subtract(v, viprev); }
            else { partialX = add(subtract(vinext, v), subtract(v, viprev)); }

            // This needs to happen for both i and j
            if (i % surface.yDivisions === 0) { partialY = subtract(vjnext, v); }
            else if ((i+1) % surface.yDivisions === 0) { partialY = subtract(v, vjprev); }
            else { partialY = add(subtract(vjnext, v), subtract(v, vjprev)); }

            // Cross Partials for Normals
            normals.push(vec4(normalize(cross(partialY, partialX)), 0.0));
        }
    }
}

function generate_indices(surface)
{
    indices = [];
    for (var i = 0; i < surface.xDivisions-1; i++)
    {
        for (var j = 0; j < surface.yDivisions-1; j++)
        {
            // The square is made from an upper and lower triangle
            // All of these surfaces need to be pushed into
            // the indice array above.
            a = i*surface.xDivisions + j;
            b = i*surface.xDivisions + j + 1;
            c = (i+1)*surface.xDivisions + j + 1;
            d = (i+1)*surface.xDivisions + j;

            // upper Triangle
            indices.push(a);
            indices.push(b);
            indices.push(c);

            // lower triangle
            // Simply connecting a to different vertices
            indices.push(a);
            indices.push(c);
            indices.push(d);
        }
    }
}
