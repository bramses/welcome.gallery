// TODO math for scrolling and NodeJS string interpolation
window.addEventListener('DOMContentLoaded', () => {
    //Create Scroll
    let scroll = new Scroll()

    // bg colors
    const black = new BABYLON.Color3(0.066, 0.066, 0.066)
    const navy = new BABYLON.Color3(0, 0.121, 0.247)
    const gray = new BABYLON.Color3(0.66, 0.66, 0.66)
    const maroon = new BABYLON.Color3(0.521, 0.078, 0.294)
    const olive = new BABYLON.Color3(0.239, 0.6, 0.439)
    const white = new BABYLON.Color3(1.0, 1.0, 1.0)
    const offset = 15
    let GLOBAL_OFFSET = 0
    
    /* EDIT THESE VARIABLES */
    // ANIMATE SKYBOX + CHOOSE COLOR
    const animatedSkybox = false
    const color = gray

    // ALL ART PIECES -- EDIT
    const artPlaneOptsList = [
        {
            src: 'assets/macondo.png',
            width: 828,
            height: 1472,
            hasAudio: true
        },
        {
            src: 'assets/comedyclub.png',
            width: 1920,
            height: 1080,
            hasAudio: true
        },
        {
            src: 'assets/spotify.png',
            width: 1920,
            height: 1080,
            hasAudio: true
        }
    ]

    // ALL VIDEOS -- EDIT
    const videoPlaneOptsList = [
        
        {
            src: 'assets/bdayparty.mov',
            type: 'tiktok',
            hasAudio: true
        },
        {
            src: 'assets/pokecenter.mov',
            type: 'tiktok',
            hasAudio: true
        },
        {
            src: 'assets/rapping.mov',
            type: 'tiktok',
            hasAudio: true
        },
        {
            src: 'assets/savage.mov',
            type: 'tiktok',
            hasAudio: true
        },
        {
            src: 'assets/podcast.mov',
            type: 'youtube',
            hasAudio: true
        }
    ]

    // ALL AUDIO GUIDES -- EDIT
    const audioOptsList = [
        {
            name: 'audio0',
            src: 'assets/sounds/macondo.m4a',
            parent: 'plane0'
        },
        {
            name: 'audio0',
            src: 'assets/sounds/jokebot.m4a',
            parent: 'plane1'
        },
        {
            name: 'audio0',
            src: 'assets/sounds/spotify-mood-ring.m4a',
            parent: 'plane2'
        },
        {
            name: 'audio0',
            src: 'assets/sounds/ar-party.m4a',
            parent: 'video-plane0'
        },
        {
            name: 'audio0',
            src: 'assets/sounds/pokecenter.m4a',
            parent: 'video-plane1'
        },
        {
            name: 'audio0',
            src: 'assets/sounds/ar-rappin.m4a',
            parent: 'video-plane2'
        },
        {
            name: 'audio0',
            src: 'assets/sounds/savage-walk.m4a',
            parent: 'video-plane3'
        },
        {
            name: 'audio0',
            src: 'assets/sounds/ar-podcast.m4a',
            parent: 'video-plane4'
        },
    ]

    /* STOP EDITING */

    var modal = document.getElementById("myModal");
    var span = document.getElementsByClassName("close")[0];

    span.onclick = function () {
        modal.style.display = "none";
    }

    var canvas = document.getElementById('renderCanvas');
    var engine = new BABYLON.Engine(canvas, true, { stencil: true });

    const playing = {}
    const planesWithAudio = {}
    let hl

    var createScene = function () {
        var scene = new BABYLON.Scene(engine);
        let skybox = null
        hl = new BABYLON.HighlightLayer("hl1", scene);

        if (animatedSkybox) {
            skybox = initAnimatedSkybox(scene)
        } else {
            scene.clearColor = color;
        }

        addCamera(scene)
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

        // GUI
        addGUI()

        // Fog
        addFog(scene)

        // marble floor
        addMarbleGround(scene)

        createArtPlanes(artPlaneOptsList, scene)
        createVideoPlanes(videoPlaneOptsList, scene)
        createAudioGuides(audioOptsList, scene)


        return scene;
    }

    var createArtPlanes = (artPlanes, scene) => {
        for (let i = 0; i < artPlanes.length; i++) {
            const artPlaneOpts = artPlanes[i]
            const plane = createArtPlane(artPlaneOpts.src, artPlaneOpts.width, artPlaneOpts.height, scene)
            scaleOnHover(plane, scene)
            artPlaneOpts.offset = GLOBAL_OFFSET
            GLOBAL_OFFSET -=15
            scene[`plane${i}`] = plane

            if (artPlaneOpts.hasAudio) {
                planesWithAudio[`plane${i}`] = { offset: artPlaneOpts.offset, ...plane.getBoundingInfo().boundingBox.extendSize }

            }
        }
    }

    var createVideoPlanes = (videoPlanes, scene) => {
        for (let i = 0; i < videoPlanes.length; i++) {
            const videoPlaneOpts = videoPlanes[i]
            if (videoPlaneOpts.type != 'youtube' && videoPlaneOpts.type != 'tiktok') {
                console.error('type must be youtbe or tiktok')
                continue
            }
            let videoPlane

            if (videoPlaneOpts.type == 'youtube') {
                videoPlane = createYouTubePlane(videoPlaneOpts.src, scene)
            } else if (videoPlaneOpts.type == 'tiktok') {
                videoPlane = createTikTokPlane(videoPlaneOpts.src, scene)
            }

            videoPlaneOpts.offset = GLOBAL_OFFSET
            GLOBAL_OFFSET -=15
            scene[`video-plane${i}`] = videoPlane
            if (videoPlaneOpts.hasAudio) {
                planesWithAudio[`video-plane${i}`] = { offset: videoPlaneOpts.offset, ...videoPlane.getBoundingInfo().boundingBox.extendSize }
                console.log(planesWithAudio)
            }

            hl.addMesh(videoPlane, BABYLON.Color3.Green());

        }
    }

    var createAudioGuides = (audioGuides, scene) => {
        for (let i = 0; i < audioGuides.length; i++) {
            const audioOpts = audioGuides[i]
            let height = -3 // default to 1920x1080
            if (audioOpts.parent !== null && planesWithAudio[audioOpts.parent] !== null) {
                height = -(planesWithAudio[audioOpts.parent]._y) - (planesWithAudio[audioOpts.parent]._y * 0.5)
                audioOpts.offset = planesWithAudio[audioOpts.parent].offset
            }
            const audio = addAudioGuidePlane(audioOpts.name, height, scene)
            playing[audioOpts.name] = false
            playAudio(audioOpts.name, audioOpts.src, audio, scene)
            scene[`audio${i}`] = audio
        }
    }


    var addMarbleGround = (scene) => {
        var marbleMaterial = new BABYLON.StandardMaterial("torus", scene);
        var marbleTexture = new BABYLON.MarbleProceduralTexture(
            "marble",
            1024,
            scene
        );
        marbleTexture.numberOfTilesHeight = 3;
        marbleTexture.numberOfTilesWidth = 3;
        marbleMaterial.ambientTexture = marbleTexture;

        var ground = BABYLON.Mesh.CreateGround("ground", 75, 75, 32, scene, false);
        ground.position.y = -5;
        ground.material = marbleMaterial;
    }

    var addFog = (scene) => {
        scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        scene.fogColor = scene.clearColor;
        scene.fogStart = 25.0;
        scene.fogEnd = 50.0;
    }

    var addCamera = (scene) => {
        var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        scene.camera = camera
    }


    var addGUI = () => {
        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
            "UI"
        );

        var button1 = BABYLON.GUI.Button.CreateSimpleButton("bttn", "ABOUT");
        button1.width = 0.2;
        button1.height = "40px";
        button1.cornerRadius = 0;
        button1.color = "Black";
        button1.thickness = 4;
        button1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        button1.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        button1.scaleY = 1;
        button1.background = "White";
        button1.onPointerUpObservable.add(function () {
            modal.style.display = "block";
        });
        advancedTexture.addControl(button1);
    }

    var createYouTubePlane = (src, scene) => {

        const ratio = 0.5625

        var vidOpts = {
            height: 7.5 * ratio,
            width: 7.5,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        };

        var videoPlane = BABYLON.MeshBuilder.CreatePlane("plane", vidOpts, scene);
        var videoPlaneMat = new BABYLON.StandardMaterial("m", scene);
        var videoPlaneVidTex = new BABYLON.VideoTexture(
            "vidtex",
            src,
            scene
        );
        videoPlane.rotation.x = Math.PI * 0.8;
        videoPlane.rotation.z = Math.PI;
        videoPlane.rotation.y = Math.PI;
        videoPlaneMat.diffuseTexture = videoPlaneVidTex;
        videoPlaneMat.roughness = 1;
        videoPlaneMat.emissiveColor = new BABYLON.Color3.White();
        videoPlane.material = videoPlaneMat;
        videoPlaneVidTex.video.pause(); // pause video on load!
        scene.onPointerObservable.add(function (evt) {
            if (evt.pickInfo.pickedMesh === videoPlane) {
                if (videoPlaneVidTex.video.paused) {
                    videoPlaneVidTex.video.play();
                }
                else {
                    videoPlaneVidTex.video.pause();
                }
            }
        }, BABYLON.PointerEventTypes.POINTERPICK);

        return videoPlane
    }

    var createTikTokPlane = (src, scene) => {

        const ratio = 0.4625

        var vidOpts = {
            height: 6.5,
            width: 6.5 * ratio,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        };

        var videoPlane = BABYLON.MeshBuilder.CreatePlane("plane", vidOpts, scene);
        var videoPlaneMat = new BABYLON.StandardMaterial("m", scene);
        var videoPlaneVidTex = new BABYLON.VideoTexture(
            "vidtex",
            src,
            scene
        );
        videoPlane.rotation.x = Math.PI * 0.8;
        videoPlane.rotation.z = Math.PI;
        videoPlane.rotation.y = Math.PI;
        videoPlaneMat.diffuseTexture = videoPlaneVidTex;
        videoPlaneMat.roughness = 1;
        videoPlaneMat.emissiveColor = new BABYLON.Color3.White();
        videoPlane.material = videoPlaneMat;
        videoPlaneVidTex.video.pause(); // pause video on load!
        scene.onPointerObservable.add(function (evt) {
            if (evt.pickInfo.pickedMesh === videoPlane) {
                if (videoPlaneVidTex.video.paused) {
                    videoPlaneVidTex.video.play();
                }
                else {
                    videoPlaneVidTex.video.pause();
                }
            }
        }, BABYLON.PointerEventTypes.POINTERPICK);

        return videoPlane
    }


    var createArtPlane = (src, width, height, scene) => {

        const ratio = height / width
        var opts = null
        if (ratio < 1) {
            opts = {
                height: 7.5 * ratio,
                width: 7.5,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
            };
        } else {
            opts = {
                height: 3.7 * ratio,
                width: 3.7,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
            };
        }
        

        var artPlane = BABYLON.MeshBuilder.CreatePlane("plane" + src, opts, scene);
        artPlane.position = new BABYLON.Vector3(0, 0, 0);
        artPlane.rotation.x = Math.PI * 0.8;
        artPlane.rotation.z = Math.PI;
        artPlane.rotation.y = Math.PI;
        var artMat = new BABYLON.StandardMaterial("", scene);
        artMat.diffuseTexture = new BABYLON.Texture(src, scene);
        artMat.emissiveColor = new BABYLON.Color3.White();
        artPlane.material = artMat;
        return artPlane;
    }

    var addAudioGuidePlane = (artPiece, height, scene) => {
        var headphoneOpts = {
            height: .5,
            width: .5,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        };

        var headphones = BABYLON.MeshBuilder.CreatePlane("headphones-" + artPiece, headphoneOpts, scene);
        headphones.position.y = height
        headphones.rotation.x = Math.PI * 1.2;
        headphones.rotation.z = Math.PI;
        var headphonesMat = new BABYLON.StandardMaterial("", scene);
        headphonesMat.diffuseTexture = new BABYLON.Texture("assets/headphones.jpg", scene);
        headphonesMat.emissiveColor = new BABYLON.Color3.White();
        headphones.material = headphonesMat;

        return headphones
    }

    var initAnimatedSkybox = function (scene) {
        // sky
        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);

        const animWheel = new BABYLON.Animation("skyAnimation", "rotation.y", 0.05, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

        const wheelKeys = [];

        //At the animation key 0, the value of rotation.y is 0
        wheelKeys.push({
            frame: 0,
            value: 0
        });

        //At the animation key 30, (after 1 sec since animation fps = 30) the value of rotation.y is 2PI for a complete rotation
        wheelKeys.push({
            frame: 30,
            value: 2 * Math.PI
        });

        //set the keys
        animWheel.setKeys(wheelKeys);

        //Link this animation to a wheel
        skybox.animations = [];
        skybox.animations.push(animWheel);

        scene.beginAnimation(skybox, 0, 30, true);

        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/textures/skybox", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        return skybox
    }

    var playAudio = function (artPieceKey, src, audioGuidePlane, scene) {
        // audio guide
        var audioGuide = new BABYLON.Sound("sound-" + artPieceKey, src, scene, null, {
            loop: false,
            autoplay: false
        });

        // Sound will now follow the box mesh position
        audioGuide.attachToMesh(audioGuidePlane);

        audioGuidePlane.actionManager = new BABYLON.ActionManager(scene);

        audioGuidePlane.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                trigger: BABYLON.ActionManager.OnPickTrigger,
            }, function () {
                if (playing[artPieceKey]) {
                    audioGuide.stop()
                    playing[artPieceKey] = false
                }
                else {
                    audioGuide.play()
                    playing[artPieceKey] = true
                }
            })
        );

        return audioGuide
    }

    var scaleOnHover = (thing, scene) => {
        thing.actionManager = new BABYLON.ActionManager(scene);

        thing.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                trigger: BABYLON.ActionManager.OnPointerOverTrigger,
            }, function () {
                thing.scaling = new BABYLON.Vector3(2, 2, 2);
            })
        );

        thing.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                trigger: BABYLON.ActionManager.OnPointerOutTrigger,
            }, function () {
                thing.scaling = new BABYLON.Vector3(1, 1, 1);
            })
        );
    }

    var main = function () {
        // call the createScene function
        var scene = createScene();

        const durationT = 500 // speed up or slow scroll
        const sceneSize = canvas.height + durationT
        let sceneSizeID = document.getElementById('sceneSize')
        sceneSizeID.style.height = sceneSize + "px"

        // run the render loop
        engine.runRenderLoop(function () {
            scene.render();
        });

        // the canvas/window resize event handler
        window.addEventListener('resize', function () {
            engine.resize();
        });

        //Create Scroll
        scroll.addFlag(scene, {
            start: 0,
            duration: durationT * (1 / ((-GLOBAL_OFFSET - offset) / 200)),
            callback: (value, target) => {
                let pos = value * 200

                for (let i = 0; i < artPlaneOptsList.length; i++) {
                    target[`plane${i}`].position.x = -(pos + artPlaneOptsList[i].offset)
                }

                for (let i = 0; i < audioOptsList.length; i++) {
                    target[`audio${i}`].position.x = -(pos + audioOptsList[i].offset)
                }

                for (let i = 0; i < videoPlaneOptsList.length; i++) {
                    target[`video-plane${i}`].position.x = -(pos + videoPlaneOptsList[i].offset)
                }
            },
            startDirty: true,
            debug: false
        })
    }


    window.mobileCheck = function () {
        let check = false;
        (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    };

    if (!window.mobileCheck()) {
        main()
    } else {
        // mobile fallback
        document.body.innerHTML = `<p>Apologies, the gallery is not yet optimized for mobile devices. <br />Please visit on a computer browser.</p><h1>What Does the Gallery Look Like?</h1><video width="100%" height="auto" controls>
        <source src="assets/galleryexample.mov" type="video/mp4">
      Your browser does not support the video tag.
      </video>`
    }
})