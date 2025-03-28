
let canvas;
let gl;

let matView = mat4()

function mult_v(m, v) {
    if (!m.matrix) {
        return "trying to multiply by non matrix";
    }

    var result;
    if (v.length == 2) result = vec2();
    else if (v.length == 3) result = vec3();
    else if (v.length == 4) result = vec4();

    for (var i = 0; i < m.length; i++) {
        if (m[i].length != v.length)
            return "dimensions do not match";

        result[i] = 0;
        for (var j = 0; j < m[i].length; j++)
            result[i] += m[i][j] * v[j];
    }
    return result;
}

class _3DObject {
    constructor(program, position = vec3(0, 0, 0)) {
        this.program = program;
        this.bufVertex = 0;
        this.bufIndex = 0;
        this.bufNormal = 0;
        this.bufTextureCoords = 0;
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.textureCoords = [];
        this.position = position;
        this.matModel = mat4();
        this.primitiveType = "LINES";
    }

    loadData() {
    }

    init() {
        this.matModel = translate(this.position[0], this.position[1], this.position[2]);
        this.loadData();

        this.bufVertex = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVertex);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);

        this.bufNormal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNormal);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW);

        this.bufTextureCoords = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTextureCoords);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.textureCoords), gl.STATIC_DRAW);

        this.bufIndex = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIndex);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    }

    render(option=0) {
        var model = gl.getUniformLocation(this.program, "m_Model");
        gl.uniformMatrix4fv(model, false, flatten(this.matModel));

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVertex);

        var pos = gl.getAttribLocation(this.program, "v_Pos");
        gl.vertexAttribPointer(pos, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pos);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNormal);

        var norm = gl.getAttribLocation(this.program, "v_Norm");
        gl.vertexAttribPointer(norm, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(norm);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTextureCoords);

        var texCoord = gl.getAttribLocation(this.program, "v_TexCoord");
        gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoord);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIndex);
        if (this.primitiveType == "TRIANGLES"){
            gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        }
        else if (this.primitiveType == "POINTS"){
            gl.drawElements(gl.POINTS, this.indices.length, gl.UNSIGNED_SHORT, 0);
        }
        else if (this.primitiveType == "LINES"){
            gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        }
    }

    translate(dir) {
        this.matModel = mult(translate(dir), this.matModel);
    }

    rotate(angle, axis) {
        this.matModel = mult(rotate(angle, axis), this.matModel);
    }
}