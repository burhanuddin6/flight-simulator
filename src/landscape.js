class LandScape {
    // landscape constitutes of multiple terrains
    constructor(program) {
        this.terrains = [];
        this.terrainSize = 1500;
        this.terrainVertexCount = 50;
        this.shadingShceme = 0;
        this.program = program;
    }

    getPatch(xmin, xmax, zmin, zmax){
        // generate terrains based on the given parameters and append to this.terrains
        let patch = [];
        let gridX = Math.floor(xmin / this.terrainSize);
        let gridZ = Math.floor(zmin / this.terrainSize);
        let gridXMax = Math.floor(xmax / this.terrainSize);
        let gridZMax = Math.floor(zmax / this.terrainSize);
        for (let i = gridX; i <= gridXMax; i++) {
            for (let j = gridZ; j <= gridZMax; j++) {
                let terrain = new Terrain(this.program, i, j, this.terrainVertexCount, this.terrainSize);
                terrain.init();
                patch.push(terrain);
            }
        }
        this.terrains.push(...patch);
    }

    render() {
        for (let i = 0; i < this.terrains.length; i++) {
            this.terrains[i].render();
        }
    }
}