<template>
    <main>
        <div v-if="isMarkerModalOpen" class="marker-modal-overlay" @click.self="closeMarkerModal">
            <div class="marker-modal-content">
                <h2>Neuen Marker hinzufügen</h2>
                <form @submit.prevent="addMarker">
                <input class="marker-modal-name" v-model="newMarker.Name" placeholder="Name" required />
                

                <div class="marker-modal-dropdown">
                    <label for="markerType">MarkerType:</label>
                    <select v-model="newMarker.TypeID" id="markerType" required>
                        <option value="" disabled>Wähle einen MarkerType aus</option>
                        <option v-for="type in markerTypes" :key="type.id" :value="type.id">{{ type.Name }}</option>
                    </select>
                </div>
                
                <div class="marker-modal-dropdown">
                    <label for="questLine">QuestLine:</label>
                    <select v-model="newMarker.QuestID" id="questLine" required>
                        <option value="" disabled>Wähle eine QuestLine aus</option>
                        <option v-for="quest in questLines" :key="quest.id" :value="quest.id">{{ quest.Name }}</option>
                    </select>
                </div>
                <div class="marker-modal-coord-container">
                    <h4>X-Koordinate</h4>
                    <input disabled class="marker-modal-xcoord" v-model.number="contextMenu.x" type="number" placeholder="xCoord" required />
                </div>
                <div class="marker-modal-coord-container">
                    <h4>Y-Koordiante</h4>
                    <input disabled class="marker-modal-ycoord" v-model.number="contextMenu.y" type="number" placeholder="yCoord" required />
                </div>
                <textarea class="marker-modal-description" v-model="newMarker.Description" placeholder="Beschreibung"></textarea>
                <label>
                    Versteckt:
                    <input type="checkbox" v-model="newMarker.Hidden" />
                </label>
                <button type="submit">Hinzufügen</button>
                </form>
                <button class="marker-modal-close-button" @click="closeMarkerModal">✕</button>
            </div>
        </div>
        <div v-if="isMarkerTypeModalOpen" class="markertype-modal-overlay" @click.self="closeMarkerTypeModal">
            <div class="markertype-modal-content">
                <h2>Neuen Marker Typ hinzufügen</h2>
                <form @submit.prevent="addMarkerType">
                    <input type="text" v-model="newMarkerType.Name" placeholder="Name" required />
                    <input type="color" v-model="newMarkerType.Color" placeholder="Color (Hex)" required />
                    <input type="text" v-model="newMarkerType.Icon" placeholder="Icon" required />
                    <button type="submit">Hinzufügen</button>
                </form>
                <button @click="closeMarkerTypeModal" class="markertype-modal-close-button">✕</button>
            </div>
        </div>
        <div v-if="isQuestLineModalOpen" class="questline-modal-overlay" @click.self="closeQuestLineModal">
            <div class="questline-modal-content">
                <h2>Neue Questline hinzufügen</h2>
                <form @submit.prevent="addQuestLine">
                    <input class="questline-modal-name" type="text" v-model="newQuestLine.Name" placeholder="Name" required />
                    <textarea class="questline-modal-description" v-model="newQuestLine.Description" placeholder="Beschreibung"></textarea>
                    <label class="questline-modal-mainquest">
                        Hauptquest:
                        <input class="questline-modal-mainquest-checkbox" type="checkbox" v-model="newQuestLine.MainQuest" />
                    </label>
                    <button type="submit">Hinzufügen</button>
                </form>
                <button @click="closeQuestLineModal" class="questline-modal-close-button">✕</button>
            </div>
        </div>
        <div style="height:100%; width:100%; position: relative;">
            <l-map
                id="map"
                ref="map"
                :zoom="zoom"
                :center="[3608, 4096]"
                :maxBounds="imageBounds"
                :minZoom="minZoom"
                :maxZoom="maxZoom"
                :crs="L.CRS.Simple"
                @click="mapClick"
                style="height: 100%; width: 100%;"
                @contextmenu="openContextMenu"
                
                >
                <!-- @vue-skip -->
                <l-image-overlay :url="imageUrl" :bounds="imageBounds" />
                <!-- @vue-skip -->
                <l-marker
                    v-for="(marker, index) in markers"
                    :key="index"
                    :lat-lng="marker.position"
                    :icon="marker.icon"
                    >
                    <l-popup>{{ marker.description }}</l-popup>
                </l-marker>
                <l-marker style="pointer-events: none;"
                    v-for="(mainquest, index) in mainquests"
                    :key="index"
                    :lat-lng="mainquest.position"
                    :icon="mainquest.icon"
                    >
                </l-marker>
                
            </l-map>
            <div
                v-if="contextMenu.visible"
                :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
                class="context-menu"
                >
                <button @click="addMarkerModal()">Marker setzen</button>
                <div class="context-menu-">
                    <button @click="addMarkerTypeModal()">Marker Typ hinzufügen</button>
                    <button @click="addQuestLineModal()">QuestLine hinzufügen</button>
                </div>
            </div>
        </div>
    </main>
  </template>

<script setup lang="ts">
    import "leaflet/dist/leaflet.css";
    import { LMap, LImageOverlay, LMarker, LPopup, LControlAttribution } from "@vue-leaflet/vue-leaflet";
    import { Icon } from "leaflet";
    import { onBeforeMount, ref, reactive, onMounted, onBeforeUnmount } from "vue";
    import L from "leaflet";
    import { bounds } from "leaflet";
    import axios from 'axios';

    const zoom = ref(-3);
    const isMarkerModalOpen = ref(false);
    const isMarkerTypeModalOpen = ref(false);
    const isQuestLineModalOpen = ref(false);
    const markerTypes = ref([]);
    const newMarkerType = ref({
        Name: '',
        Color: '',
        Icon: '',
    });
    const questLines = ref([]);
    const newQuestLine = ref({
        Name: '',
        Description: '',
        MainQuest: false
    });
    const markers = ref([]);
    const mainquests = ref([]);
    const markerLocation = ref({'x' : 0, 'y' : 0});
    const newMarker = ref({
        Name: '',
        TypeID: null,
        QuestID: null,
        xCoord: 0,
        yCoord: 0,
        Description: '',
        Hidden: true,
    });

    const contextMenu = reactive({
        visible: false,
        x: 0,
        y: 0,
        latlng: [0, 0],
    });

    let intervalId: number | undefined

    const minZoom = -2.8;
    const maxZoom = 4;
    const imageUrl = new URL("../assets/images/Elbaran Weltkarte.jpg", import.meta.url).href;

    const imageBounds = [
        [0, 0],
        [7216, 8192]
    ];

    // map.value.removeControl;

    const old_markers = ref([
    {
        position: [3600, 4090],
        description: "Infomarkierung A",
        icon: new Icon({
            iconUrl: new URL("../assets/images/info_marker.png", import.meta.url).href,
            iconSize: [50, 50],
            iconAnchor: [0, 0],
            popupAnchor: [1, -34],
        }),
    },
    {
        position: [3700.5, 4200],
        description: "Dangermarkierung A",
        icon: new Icon({
            iconUrl: new URL("../assets/images/danger_marker.png", import.meta.url).href,
            iconSize: [50, 50],
            iconAnchor: [15, 40],
            popupAnchor: [1, -34],
        }),
    },
]);



function openContextMenu(event: L.LeafletMouseEvent) {
    event.originalEvent.preventDefault();
    contextMenu.visible = true;
    // console.log("event latlng" + event.latlng.lat);
    
    contextMenu.x = event.originalEvent.clientX;
    contextMenu.y = event.originalEvent.clientY;
    // console.log(L.CRS.Simple.pointToLatLng(L.point(event.originalEvent.clientX, event.originalEvent.clientY), -3));
    const mapPoint = L.CRS.Simple.pointToLatLng(L.point(event.originalEvent.clientX, event.originalEvent.clientY), -3);
    markerLocation.value.x = event.latlng.lng;
    markerLocation.value.y = 7216 - event.latlng.lat ;
    contextMenu.latlng = [contextMenu.x, contextMenu.y];
    fetchMarkerTypesAndQuestLines();
    // console.log(`Contextmenü - x: ${contextMenu.x} | y: ${contextMenu.y}`);
    console.log(`markerLocation - x: ${markerLocation.value.x} | y: ${markerLocation.value.y}`);
    
}

const mapClick = () => {
    contextMenu.visible = false;
}

const addMarkerModal = () => {
    contextMenu.visible = false;
    isMarkerModalOpen.value = true;
    console.log('x: ' + contextMenu.x + ' | y: ' + contextMenu.y);
    
};

const closeMarkerModal = () => {
  isMarkerModalOpen.value = false;
};

const addMarker = async () => {
    newMarker.value.xCoord = markerLocation.value.x;
    newMarker.value.yCoord = markerLocation.value.y;
    console.log('Neuer Marker hinzugefügt:', newMarker.value);
  
    try {
        const response = await axios.post('http://localhost:5000/api/markers', newMarker.value);
        // @ts-ignore
        markerTypes.value.push(response.data);
        
        newMarker.value = { Name: '', Description: '', Hidden: true, QuestID: null, TypeID: null, xCoord: 0, yCoord: 0 };
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Markers:', error);
    }

  closeMarkerModal();

  newMarker.value = {
    Name: '',
    TypeID: null,
    QuestID: null,
    xCoord: 0,
    yCoord: 0,
    Description: '',
    Hidden: false,
  };
};

const fetchMarkers = async () => {
    try {
    const markerResponse = await fetch('http://localhost:5000/api/markers');
    const markerJson = await markerResponse.json()
    const markerTypeResponse = await fetch('http://localhost:5000/api/markertypes');
    const markerTypeJson = await markerTypeResponse.json()
    const questLineResponse = await fetch('http://localhost:5000/api/questlines');
    const questLineJson = await questLineResponse.json()
    // console.log(markerTypeJson);
    // console.log(questLineJson);
    // fetchMarkerTypesAndQuestLines();

    markerJson.forEach(function(obj: {
        "id": number,
        "Name": string,
        "TypeID": number,
        "QuestID": number,
        "xCoord": number,
        "yCoord": number,
        "Description": string,
        "Hidden": boolean
    }) {
        
        const newMarkerObject = {
            position: [7216 - obj.yCoord, obj.xCoord],
            description: obj.Description,
            icon: new Icon({
                iconUrl: new URL("../assets/images/danger_marker.png", import.meta.url).href,
                iconSize: [50, 50],
                iconAnchor: [25, 50],
                popupAnchor: [1, -34],
            })
        }
        markers.value.push(newMarkerObject);

        if (questLineJson[obj.QuestID - 1].MainQuest == true) {
            console.log(questLineJson[obj.QuestID - 1]);

            const newMainquestObject = {
            position: [7216 - obj.yCoord, obj.xCoord],
            description: obj.Description,
            icon: new Icon({
                iconUrl: new URL("../assets/images/crown.png", import.meta.url).href,
                iconSize: [30, 30],
                iconAnchor: [15, 72]
            })
        }
            mainquests.value.push(newMainquestObject);
        }
        
        
    });
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Marker:', error);
  }
}

const fetchMarkerTypesAndQuestLines = async () => {
  try {
    const markerTypeResponse = await fetch('http://localhost:5000/api/markertypes');
    const questLineResponse = await fetch('http://localhost:5000/api/questlines');
    markerTypes.value = await markerTypeResponse.json();
    questLines.value = await questLineResponse.json();
  } catch (error) {
    console.error('Fehler beim Abrufen der Markertypen und Questlines:', error);
  }
};

const addMarkerType = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/markertypes', newMarkerType.value);
    // @ts-ignore
    markerTypes.value.push(response.data);
    
    newMarkerType.value = { Name: '', Color: '', Icon: '' };
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Marker Typ-Eintrags:', error);
  }
};

const addMarkerTypeModal = () => {
    contextMenu.visible = false;
    isMarkerTypeModalOpen.value = true;
};

const closeMarkerTypeModal = () => {
    isMarkerTypeModalOpen.value = false;
};

const addQuestLineModal = () => {
    contextMenu.visible = false;
    isQuestLineModalOpen.value = true;
};

const closeQuestLineModal = () => {
  isQuestLineModalOpen.value = false;
};

const addQuestLine = async () => {
  console.log('Neue QuestLine hinzugefügt:', newQuestLine.value);
  
  try {
    const response = await axios.post('http://localhost:5000/api/questlines', newQuestLine.value);
    //// @ts-ignore
    QuestLines.value.push(response.data);
    
    newQuestLine.value = { Name: '', Description: '', MainQuest: false };
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Quest Line-Eintrags:', error);
  }

  closeQuestLineModal();

  newQuestLine.value = {
    Name: '',
    Description: '',
    MainQuest: false
  };
};


onMounted(() => {
    fetchMarkerTypesAndQuestLines();
    intervalId = setInterval(fetchMarkers, 1000);
});

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

</script>

<style scoped>
    @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');

    .medievalsharp-regular {
        font-family: "MedievalSharp", cursive;
        font-weight: 400;
        font-style: normal;
    }

    main {
        height: 100vh;
        width: 100vw;
        position: relative;
    }

    .leaflet-container {
        height: 100%;
        width: 100%;
        z-index: 2;
        cursor: default;
    }

    img {
        position: absolute;
        z-index: -1;
        width: 100%;
        height: 100%;
    }
    .context-menu {
        position: absolute;
        background: white;
        border: 1px solid #ccc;
        padding: 5px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        font-family: 'MedievalSharp', Arial !important;
    }

    .context-menu button {
        margin: 2px 0;
        padding: 5px;
        cursor: pointer;
        font-family: 'MedievalSharp', Arial !important;
        font-size: 1rem;
    }

    .marker-modal-overlay {
        position: absolute;
        height: 100%;
        width: 100%;
        z-index: 3;
        background-color: #a3a3a35b;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

    }
    .marker-modal-overlay * {
        font-family: 'MedievalSharp', Arial !important;
        font-size: 1rem;
    }

    .marker-modal-overlay h2 {
        font-size: 2rem;
        margin-bottom: 2rem;
    }

    .marker-modal-content{
        background-color: #084C61;
        width: 60%;
        padding: 1rem 3rem 3rem 3rem;
        border-radius: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        position: relative;
    }

    .marker-modal-content form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 60%;
        align-items: center;
        width: 100%;
    }

    .marker-modal-name {
        width: 60%;
        padding: 0.3rem;
    }

    .marker-modal-dropdown {
        display: flex;
        gap: 0.5rem;
        justify-content: space-evenly;
        width: 60%;
    }
    .marker-modal-dropdown select {
        width: 60%;
        flex-grow: 2;
    }
    .marker-modal-dropdown label {
        width: 10rem;
        text-align: left;
    }

    .marker-modal-coord-container {
        display: flex;
        gap: 0.5rem;
        justify-content: space-evenly;
        width: 60%;
    }

    .marker-modal-coord-container input {
        width: 60%;
        flex-grow: 2;
    }

    .marker-modal-coord-container h4 {
        width: 10rem;
        text-align: left;
    }

    .marker-modal-description {
        width: 80%;
        height: 20rem;
    }

    .marker-modal-close-button{
        position: absolute;
        font-size: 1rem;
        top: 1rem;
        right: 1rem;
        border: none;
        border-radius: 50%;
        background-color: #DB504A;
        cursor: pointer;
    }

    .markertype-modal-overlay {
        position: absolute;
        height: 100%;
        width: 100%;
        z-index: 3;
        background-color: #a3a3a35b;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

    }
    .markertype-modal-overlay * {
        font-family: 'MedievalSharp', Arial !important;
    }

    .markertype-modal-content{
        background-color: #084C61;
        padding: 1rem 3rem 3rem 3rem;
        border-radius: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        position: relative;
    }

    .markertype-modal-content h2 {
        margin-bottom: 2rem;
    }

    .markertype-modal-content input {
        padding: 0.3rem;
        margin-right: 0.5rem;
        font-size: 1rem;
    }

    .markertype-modal-close-button{
        position: absolute;
        font-size: 1rem;
        top: 1rem;
        right: 1rem;
        border: none;
        border-radius: 50%;
        background-color: #DB504A;
        cursor: pointer;
    }

    .questline-modal-overlay {
        position: absolute;
        height: 100%;
        width: 100%;
        z-index: 3;
        background-color: #a3a3a35b;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .questline-modal-overlay * {
        font-family: 'MedievalSharp', Arial !important;
    }

    .questline-modal-content{
        background-color: #084C61;
        width: 60%;
        padding: 1rem 3rem 3rem 3rem;
        border-radius: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        position: relative;
    }

    .questline-modal-content h2 {
        margin-bottom: 2rem;
    }

    .questline-modal-content form {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 0.5rem;
        align-items: center;
    }

    .questline-modal-name {
        height: 2rem;
        width: 60%;
        text-align: center;
        font-family: 'MedievalSharp', Arial !important;
        font-size: 1.4rem;
    }

    .questline-modal-description {
        height: 15rem;
        width: 60%;
        text-align: left;
        padding: 0.5rem;
        font-size: 1rem;
        font-family: 'MedievalSharp', Arial !important;
    }

    .questline-modal-mainquest {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .questline-modal-mainquest-checkbox {
        margin-left: 0.5rem;
        height: 1.5rem;
        width: 1.5rem;
    }

    .questline-modal-close-button{
        position: absolute;
        font-size: 1rem;
        top: 1rem;
        right: 1rem;
        border: none;
        border-radius: 50%;
        background-color: #DB504A;
        cursor: pointer;
    }

</style>

