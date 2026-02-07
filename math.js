const math = {

    identity4: function(){
        return [
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ];
    },

    multiply4: function(a, b){
        // column-major multiplication (WebGL)
        let r = new Array(16).fill(0);

        for(let col=0; col<4; col++){
            for(let row=0; row<4; row++){
                for(let k=0; k<4; k++){
                    r[col*4 + row] += a[k*4 + row] * b[col*4 + k];
                }
            }
        }
        return r;
    },

    translate: function(tx, ty, tz){
        return [
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            tx,ty,tz,1
        ];
    },

    scale: function(sx, sy, sz){
        return [
            sx,0,0,0,
            0,sy,0,0,
            0,0,sz,0,
            0,0,0,1
        ];
    },

    rotateY: function(a){
        let c = Math.cos(a);
        let s = Math.sin(a);
        return [
             c,0, s,0,
             0,1, 0,0,
            -s,0, c,0,
             0,0, 0,1
        ];
    },

    rotateX: function(a){
        let c = Math.cos(a);
        let s = Math.sin(a);
        return [
            1,0,0,0,
            0,c,s,0,
            0,-s,c,0,
            0,0,0,1
        ];
    },

    perspective: function(fovy, aspect, near, far){
        let f = 1.0 / Math.tan(fovy / 2.0);
        let nf = 1 / (near - far);

        return [
            f/aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far+near)*nf, -1,
            0, 0, (2*far*near)*nf, 0
        ];
    },

    normalize3: function(v){
        let len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        if(len === 0) return [0,0,0];
        return [v[0]/len, v[1]/len, v[2]/len];
    },

    cross: function(a,b){
        return [
            a[1]*b[2] - a[2]*b[1],
            a[2]*b[0] - a[0]*b[2],
            a[0]*b[1] - a[1]*b[0]
        ];
    },

    subtract3: function(a,b){
        return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
    },

    dot3: function(a,b){
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    },

    lookAt: function(eye, target, up){
        let zAxis = this.normalize3(this.subtract3(eye, target));
        let xAxis = this.normalize3(this.cross(up, zAxis));
        let yAxis = this.cross(zAxis, xAxis);

        return [
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            -this.dot3(xAxis, eye),
            -this.dot3(yAxis, eye),
            -this.dot3(zAxis, eye),
            1
        ];
    }
};
