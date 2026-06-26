export const CAMERA_VIEW_BASE_URL = "https://api.freefireesportsnepal.com:3443/live";

export function buildCameraViewUrl(uid: string) {
  return `${CAMERA_VIEW_BASE_URL}/${uid}/whep`;
}

// Rotation interval time (10 seconds)
export const ROTATION_INTERVAL_MS = 10000;

export interface DummyPlayer {
  uid: string;
  cameraLink: string;
  name: string;
  role: string;
  roleImage: string;
  playerImage: string;
  heroImage: string;
  kda: string;
}

export const DUMMY_ROTATION_PLAYERS: { left: DummyPlayer[]; right: DummyPlayer[] } = {
  left: [
    { 
      uid: "118850161", // Real numeric streaming server ID
      cameraLink: buildCameraViewUrl("118850161"), 
      name: "camer1", 
      role: "Russ", 
      roleImage: "https://placehold.co/50", 
      playerImage: "https://placehold.co/150", 
      heroImage: "https://placehold.co/80", 
      kda: "10 / 2 / 5" 
    },
    { 
      uid: "1242234134", 
      cameraLink: buildCameraViewUrl("1242234134"), 
      name: "cam 2", 
      role: "Fragger", 
      roleImage: "https://placehold.co/50", 
      playerImage: "https://placehold.co/150", 
      heroImage: "https://placehold.co/80", 
      kda: "6 / 4 / 8" 
    },
    
  ],
  right: [
    { 
      uid: "201", 
      cameraLink: buildCameraViewUrl("201"), 
      name: "camera 1", 
      role: "IGL", 
      roleImage: "https://placehold.co/50", 
      playerImage: "https://placehold.co/150", 
      heroImage: "https://placehold.co/80", 
      kda: "4 / 3 / 9" 
    },
    { 
      uid: "202", 
      cameraLink: buildCameraViewUrl("202"), 
      name: "camera 2", 
      role: "Fragger", 
      roleImage: "https://placehold.co/50", 
      playerImage: "https://placehold.co/150", 
      heroImage: "https://placehold.co/80", 
      kda: "14 / 5 / 2" 
    },
   
  ]
};