// face-api.js dimuat lazy supaya halaman beranda tetap ringan.
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/'
let loading

export function loadFaceApi() {
  if (!loading) {
    loading = (async () => {
      const faceapi = await import('@vladmandic/face-api')
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      return faceapi
    })()
  }
  return loading
}

export async function getDescriptor(video) {
  const faceapi = await loadFaceApi()
  const det = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.6 }))
    .withFaceLandmarks()
    .withFaceDescriptor()
  return det ? Array.from(det.descriptor) : null
}

export const average = (list) => list[0].map((_, i) => list.reduce((s, d) => s + d[i], 0) / list.length)
