import {
    FaceLandmarker,
    FilesetResolver
}
    from
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18";

console.log("mediapipe_face.js loaded");


let faceLandmarker;
let video;
let running = false;

let unityInstance;


// Unityから呼ぶ
window.initMediaPipeFace = async function (instance) {

    console.log("Unity instance:", instance);

    unityInstance = instance;


    const filesetResolver =
        await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
        );


    faceLandmarker =
        await FaceLandmarker.createFromOptions(
            filesetResolver,
            {
                baseOptions:
                {
                    modelAssetPath:
                        "./mediapipe/face_landmarker.task"
                },

                outputFaceBlendshapes: true,

                runningMode: "VIDEO",

                numFaces: 1
            }
        );


    video =
        document.createElement("video");


    video.autoplay = true;
    video.playsInline = true;

    console.log("request camera");


    const stream =
        await navigator.mediaDevices.getUserMedia(
            {
                video:
                {
                    width: 640,
                    height: 480
                }
            });


    console.log("camera opened");


    video.addEventListener(
        "loadeddata",
        () => {
            console.log("video loaded");

            running = true;
            detectFace();
        });


    video.srcObject = stream;

    // video.style.position = "absolute";
    // video.style.width = "320px";
    // video.style.height = "240px";
    // video.style.zIndex = "9999";

    // document.body.appendChild(video);

    // await video.play();


    // console.log("video playing");
};



// 顔認識ループ
function detectFace() {

    if (!running)
        return;

    const now = performance.now();

    const result =
        faceLandmarker.detectForVideo(
            video,
            now
        );


    console.log(result);


    if (result.faceBlendshapes &&
        result.faceBlendshapes.length > 0) {

        const score =
            calculateSmile(result);

        console.log("smile:", score);

        sendSmile(score);
    }


    requestAnimationFrame(detectFace);
}




function calculateSmile(result) {
    let left = 0;
    let right = 0;


    const categories =
        result.faceBlendshapes[0].categories;


    for (const c of categories) {

        if (c.categoryName
            === "mouthSmileLeft") {
            left = c.score;
        }


        if (c.categoryName
            === "mouthSmileRight") {
            right = c.score;
        }
    }


    return (left + right) / 2.0;
}




function sendSmile(score) {
    if (!unityInstance)
        return;


    unityInstance.SendMessage(
        "SmileReceiver",
        "SetSmileScore",
        score.toString()
    );
}
// function sendSmile(score)
// {
//     console.log("unityInstance =", unityInstance);
//     console.log("SendMessage =", unityInstance.SendMessage);

//     try
//     {
//         unityInstance.SendMessage(
//             "SmileReceiver",
//             "SetSmileScore",
//             score.toString()
//         );

//         console.log("SendMessage success");
//     }
//     catch(e)
//     {
//         console.error(e);
//     }
// }