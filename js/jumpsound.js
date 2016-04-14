/*
Author: @kaitlin gu
Adapted from: http://hengpatrick.fr/ for senior thesis*/

var webgl, audio; // must be global

// Create audio object
var audioEl = new Audio();
audioEl.src = 'jumpsound.m4a';
audioEl.crossOrigin = "use-credentials";
audioEl.loop = true;
audioEl.autoplay = true;
document.getElementById('audiobox').appendChild(audioEl);

var AudioW = (function() {

    var SEP_VALUE = 3;

    function AudioW() {

        var self = this;

        this.ctx = new AudioContext();
        this.audio = audioEl;
        this.audioSrc = this.ctx.createMediaElementSource(this.audio);
        this.analyser = this.ctx.createAnalyser();
        this.audioData = [];

        this.audioSrc.connect(this.analyser);
        this.audioSrc.connect(this.ctx.destination);

        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

        this.audio.play();
    };


    AudioW.prototype.getFrequencyData = function() {
        this.analyser.getByteFrequencyData(this.frequencyData);
        return this.frequencyData;
    };

    AudioW.prototype.getAudioData = function() {
        this.analyser.getByteFrequencyData(this.frequencyData);

        var frequencyArray = this.splitFrenquencyArray(this.frequencyData, SEP_VALUE);

        for (var i = 0; i < frequencyArray.length; i++) {
            var average = 0;

            for (var j = 0; j < frequencyArray[i].length; j++) {
                average += frequencyArray[i][j];
            }
            this.audioData[i] = average / frequencyArray[i].length;
        }
        return this.audioData;
    }

    AudioW.prototype.splitFrenquencyArray = function(arr, n) {
        var tab = Object.keys(arr).map(function(key) {
            return arr[key]
        });
        var len = tab.length,
            result = [],
            i = 0;

        while (i < len) {
            var size = Math.ceil((len - i) / n--);
            result.push(tab.slice(i, i + size));
            i += size;
        }

        return result;
    }

    return AudioW;
})();

var dodecahedron = (function() {
    var ani = 0;

    function dodecahedron(type, material) {
        THREE.Object3D.call(this);
        this.type = type;
        var dodecahedronGeometry = new THREE.DodecahedronGeometry(50, 0);
        this.mesh = new THREE.Mesh((dodecahedronGeometry), dodecahedronMaterial[this.type]);
        this.add(this.mesh);
    }

    dodecahedron.prototype = new THREE.Object3D;
    dodecahedron.prototype.constructor = dodecahedron;

    dodecahedron.prototype.update = function() {
        var audioDataFullTab = audio.getAudioData();
        var audioData, coef;

        switch (this.type) {
            case 'bass':
                audioData = audioDataFullTab[0];
                break;
            case 'medium':
                audioData = audioDataFullTab[1];
                break;
            case 'treble':
                audioData = audioDataFullTab[2];
                break;
        }

        var randomScaleValue = getRandomArbitrary(-0.1, 0.1);
        var randomPositionValue = getRandomArbitrary(-2, 2);
        this.mesh.rotation.x += 0.1;
        this.mesh.rotation.y += 0.1;
        this.mesh.rotation.z += 0.1;

        this.mesh.position.x += randomPositionValue;
        this.mesh.position.y += randomPositionValue;
        this.mesh.position.z += randomPositionValue;

        this.mesh.scale.x = audioData * setup.dodecahedronSize[this.type];
        this.mesh.scale.y = audioData * setup.dodecahedronSize[this.type];
        this.mesh.scale.z = audioData * setup.dodecahedronSize[this.type];
    };

    return dodecahedron;
})();

// ---- WebGl class ----
var Webgl = (function() {

    function Webgl(width, height) {

        var self = this;
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 800);
        this.camera.position.z = 800;

        this.camera.lookAt(this.scene.position);

        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x0,0);


        this.dodecahedrons = [];
        this.dodecahedronsNb = 0;
        this.dodecahedronsLimit = 100;

        var audioCategories = ['bass', 'medium', 'treble']

        this.interval = setInterval(function() {
            var randomType = audioCategories[Math.floor(Math.random() * audioCategories.length)];

            self.dodecahedrons[self.dodecahedronsNb] = new dodecahedron(randomType);
            self.dodecahedrons[self.dodecahedronsNb].position.set(
                getRandomArbitrary(-400, 400),
                getRandomArbitrary(-400, 400),
                getRandomArbitrary(-400, 400));

            self.scene.add(self.dodecahedrons[self.dodecahedronsNb]);

            self.dodecahedronsNb++;

            self.render();

            if (self.dodecahedronsNb >= self.dodecahedronsLimit) {
                clearInterval(self.interval);
            }
        }, 700);
    };


    Webgl.prototype.resize = function(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.camera.lookAt(this.scene.position);
    };

    Webgl.prototype.render = function() {
        this.renderer.render(this.scene, this.camera);

        for (var i = 0; i < this.dodecahedrons.length; i++) {
            this.dodecahedrons[i].update();
        };

        var timer = Date.now() * 0.0030;

        this.camera.position.x += Math.sin(timer) * 5;
        this.camera.position.y += Math.cos(timer) * 5;
        this.camera.position.z += Math.sin(timer) * 5;
        this.camera.lookAt(this.scene.position);


    };

    return Webgl;

})();

/***********************************************************************/
/* Setup to state the size of the treble, medium, base and the colors */
/***********************************************************************/
setup = {
    dodecahedronSize: {
      treble: 0.08,
      medium: 0.01,
      bass: 0.01
    },
    /* mario themed colors */
    dodecahedronColor: {
        treble: 0xed1c24, /* red */
        medium: 0x0066b3, /* blue */
        bass: 0xfae400/* yellow */
    }
}
/***************************/
/* Material of each object */
/***************************/
var dodecahedronMaterial = {
    "treble": new THREE.MeshBasicMaterial({
        color: setup.dodecahedronColor.treble,
        transparent:true,
        opacity:0.5

    }),
    "medium": new THREE.MeshBasicMaterial({
        color: setup.dodecahedronColor.medium,
        transparent: true,
        opacity: 0.5
    }),
    "bass": new THREE.MeshBasicMaterial({
        color: setup.dodecahedronColor.bass,
        transparent:true,
        opacity: 0.5
    })
}






function animate() {
    requestAnimationFrame(animate);
    webgl.render();
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
};

/************/
/* resizing */
/***********/
function resizeHandler() {
    webgl.resize(window.innerWidth, window.innerHeight/2);
}



/***************************/
/* called when dom loaded */
/*************************/
function init() {
    webgl = new Webgl(window.innerWidth, window.innerHeight/2); // matches window
    audio = new AudioW(); // audio
    document.getElementById('canvas').appendChild(webgl.renderer.domElement);
    window.addEventListener('resize', resizeHandler, true); // handling window resize
    animate(); // animation
}


/*****************/
/* initial call */
/*****************/

window.onload = function() {
    init();
};
