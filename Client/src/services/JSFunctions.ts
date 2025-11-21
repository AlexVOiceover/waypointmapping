// JSFunctions.ts

import { Coordinate } from './WaypointService';

export const calculateDistanceBetweenPaths = (altitude: number, overlap: number, fov: number): number => {
    const overlapFactor = (1 - overlap / 100);
    const fovRadians = (fov / 2) * (Math.PI / 180); // Convert FOV to radians
    const groundWidth = 2 * altitude * Math.tan(fovRadians);
    const newDistance = groundWidth * overlapFactor;
    return newDistance;
};

export const calculateSpeed = (altitude: number, overlap: number, focalLength: number, sensorHeight: number, photoInterval: number): number => {
    const overlapFactor = (1 - overlap / 100);
    const vfovRadians = 2 * Math.atan(sensorHeight / (2 * focalLength));
    const groundHeight = 2 * altitude * Math.tan(vfovRadians / 2);
    const speed = (groundHeight * overlapFactor) / photoInterval;
    return speed;
};

export const validateAndCorrectCoordinates = (coordinatesString: string): Coordinate[] | null => {
    try {
        if (!coordinatesString || typeof coordinatesString !== 'string') {
            console.error("Invalid coordinates string:", coordinatesString);
            return null;
        }

        // Split the string by semicolon to get individual coordinate pairs
        const coordinatePairs = coordinatesString.split(';');

        if (coordinatePairs.length < 2) {
            console.error("Not enough coordinate pairs:", coordinatesString);
            return null;
        }

        // Map each pair to an object with Lat and Lng properties for the API
        const coordinatesArray = coordinatePairs.map(pair => {
            // Clean up extra spaces
            const trimmedPair = pair.trim();

            // Split by comma
            const [lat, lng] = trimmedPair.split(',').map(val => {
                // Clean and parse as number
                const cleaned = val.trim();
                const parsed = parseFloat(cleaned);
                if (isNaN(parsed)) {
                    throw new Error(`Invalid coordinate value: ${cleaned}`);
                }
                return parsed;
            });

            // Validate latitude and longitude ranges
            if (lat < -90 || lat > 90) {
                throw new Error(`Latitude out of range: ${lat}`);
            }

            if (lng < -180 || lng > 180) {
                throw new Error(`Longitude out of range: ${lng}`);
            }

            // Return in the format expected by the API
            return { Lat: lat, Lng: lng };
        });

        console.log("Validated coordinates:", coordinatesArray);
        return coordinatesArray;
    } catch (error) {
        console.error("Error parsing coordinates string:", error);
        throw error; // Re-throw to handle in calling code
    }
};

export const measure = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6378.137; // Radius of earth in KM
    const dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    const dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d * 1000; // Distance in meters
};

interface WaypointMarker {
    id: number;
    lat: number;
    lng: number;
    altitude: number;
    speed: number;
    angle: number;
    action: string;
}

export const GenerateWaypointInfoboxText = (waypointMarker: WaypointMarker): string => {
    let select = '';
    if (waypointMarker.action == "noAction") {
        select = '<option value="takePhoto">Take Picture</option><option selected value="noAction">No Action</option><option value="startRecord">Start Recording</option><option value="stopRecord">Stop Recording</option>';
    } else if (waypointMarker.action == "takePhoto") {
        select = '<option selected value="takePhoto">Take Picture</option><option value="noAction">No Action</option><option value="startRecord">Start Recording</option><option value="stopRecord">Stop Recording</option>';
    } else if (waypointMarker.action == "startRecord") {
        select = '<option value="takePhoto">Take Picture</option><option value="noAction">No Action</option><option selected value="startRecord">Start Recording</option><option value="stopRecord">Stop Recording</option>';
    } else if (waypointMarker.action == "stopRecord") {
        select = '<option value="takePhoto">Take Picture</option><option value="noAction">No Action</option><option value="startRecord">Start Recording</option><option selected value="stopRecord">Stop Recording</option>';
    }

    return `<div style="
        font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
        background: white;
        padding: 14px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        max-width: 240px;
        color: #1a1a1a;
    ">
        <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            border-bottom: 1px solid #e5e5e5;
            padding-bottom: 8px;
        ">
            <button id="waypointPrevBtn" style="
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                transition: all 0.2s;
                color: #666;
            " title="Previous waypoint" onmouseover="this.style.backgroundColor='#f3f4f6'; this.style.borderColor='#d1d5db';" onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#e0e0e0';">
                ←
            </button>
            <div style="
                font-size: 18px;
                font-weight: 600;
                color: #1a1a1a;
            " id="selectedWaypointId">
                Waypoint ${waypointMarker.id}
            </div>
            <button id="waypointNextBtn" style="
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                transition: all 0.2s;
                color: #666;
            " title="Next waypoint" onmouseover="this.style.backgroundColor='#f3f4f6'; this.style.borderColor='#d1d5db';" onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#e0e0e0';">
                →
            </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <div>
                <div style="font-size: 10px; font-weight: 500; color: #666; margin-bottom: 2px;">Lat</div>
                <div style="font-size: 11px; color: #1a1a1a; padding: 5px 6px; background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 3px; box-sizing: border-box;">${waypointMarker.lat.toFixed(5)}</div>
            </div>
            <div>
                <div style="font-size: 10px; font-weight: 500; color: #666; margin-bottom: 2px;">Lng</div>
                <div style="font-size: 11px; color: #1a1a1a; padding: 5px 6px; background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 3px; box-sizing: border-box;">${waypointMarker.lng.toFixed(5)}</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <div>
                <div style="font-size: 10px; font-weight: 500; color: #666; margin-bottom: 2px;">Terrain Elev (m)</div>
                <div id="waypointTerrainElevation" style="font-size: 11px; color: #1a1a1a; padding: 5px 6px; background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 3px; box-sizing: border-box;">--</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <div>
                <div style="font-size: 10px; font-weight: 500; color: #666; margin-bottom: 2px;">Alt (m)</div>
                <input type="number" id="editWaypointAltitude" value="${waypointMarker.altitude}" style="
                    width: 100%;
                    padding: 5px 6px;
                    border: 1px solid #e0e0e0;
                    border-radius: 3px;
                    font-size: 11px;
                    box-sizing: border-box;
                " />
            </div>
            <div>
                <div style="font-size: 10px; font-weight: 500; color: #666; margin-bottom: 2px;">Speed (m/s)</div>
                <input type="number" id="editWaypointSpeed" value="${waypointMarker.speed}" step="0.1" style="
                    width: 100%;
                    padding: 5px 6px;
                    border: 1px solid #e0e0e0;
                    border-radius: 3px;
                    font-size: 11px;
                    box-sizing: border-box;
                " />
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <div>
                <div style="font-size: 10px; font-weight: 500; color: #666; margin-bottom: 2px;">Gimbal (°)</div>
                <input type="number" id="editWaypointAngle" value="${waypointMarker.angle}" step="1" style="
                    width: 100%;
                    padding: 5px 6px;
                    border: 1px solid #e0e0e0;
                    border-radius: 3px;
                    font-size: 11px;
                    box-sizing: border-box;
                " />
            </div>
            <div>
                <div style="font-size: 10px; font-weight: 500; color: #666; margin-bottom: 2px;">Action</div>
                <select id="editWaypointAction" style="
                    width: 100%;
                    padding: 5px 6px;
                    border: 1px solid #e0e0e0;
                    border-radius: 3px;
                    font-size: 11px;
                    background: white;
                    cursor: pointer;
                    box-sizing: border-box;
                ">
                    ${select}
                </select>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <button id="editWaypointSave" style="
                padding: 6px 10px;
                background-color: #22c55e;
                color: white;
                border: none;
                border-radius: 3px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s;
            " onmouseover="this.style.backgroundColor='#16a34a'" onmouseout="this.style.backgroundColor='#22c55e'">
                Save
            </button>
            <button id="editWaypointRemovee" style="
                padding: 6px 10px;
                background-color: #ef4444;
                color: white;
                border: none;
                border-radius: 3px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s;
            " onmouseover="this.style.backgroundColor='#dc2626'" onmouseout="this.style.backgroundColor='#ef4444'">
                Delete
            </button>
        </div>
    </div>`;

};

export const GenerateShapeInfoboxText = (): string => {
    return `<div class="text-center"><h4>Generate Waypoints For Shape?</h4>
    <button class="btn btn-success" onclick="submitFormFetch()">Generate</button><span>   </span>
    <button class="btn btn-danger" onclick="ShapeEditiorRemove()">Remove</button></div>`;
};
