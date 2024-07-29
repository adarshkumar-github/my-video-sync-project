const socket = io();
const videoPlayer = document.getElementById('videoPlayer');
const loadVideoButton = document.getElementById('loadVideo');
const generatePinButton = document.getElementById('generatePin');
const joinSyncButton = document.getElementById('joinSync');
const videoUrlInput = document.getElementById('videoUrl');
const pinDisplay = document.getElementById('pinDisplay');
const pinInput = document.getElementById('pinInput');
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendMessageButton = document.getElementById('sendMessage');
const messagesDiv = document.getElementById('messages');
const hostNameModal = document.getElementById('hostNameModal');
const hostNameInput = document.getElementById('hostNameModalInput');
const submitHostNameButton = document.getElementById('submitHostName');
const viewerNameModal = document.getElementById('viewerNameModal');
const viewerNameInput = document.getElementById('viewerNameModalInput');
const submitViewerNameButton = document.getElementById('submitViewerName');
const closeModalButtons = document.getElementsByClassName('close');

let currentPin = null;
let videoLink = null;
let userName = null;

// Show the modal
function showModal(modal) {
    modal.style.display = 'flex';
}

// Close the modal
function closeModal(modal) {
    modal.style.display = 'none';
}

// When the user clicks on <span> (x), close the modal
Array.from(closeModalButtons).forEach(button => {
    button.onclick = function () {
        closeModal(button.parentElement.parentElement);
    }
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target);
    }
}

// Load video and emit video link to server
loadVideoButton.addEventListener('click', () => {
    const videoUrl = videoUrlInput.value;
    const videoId = extractVideoIdFromUrl(videoUrl);
    if (videoId) {
        videoLink = `https://www.googleapis.com/drive/v3/files/${videoId}?alt=media&key=AIzaSyCie1TuXNEYfA4V8YeLtlOqcWQ0NbeZYrM`;
        videoPlayer.src = videoLink;
        videoPlayer.play();
        generatePinButton.style.display = 'block';
    } else {
        alert('Invalid Google Drive URL');
    }
});

// Generate PIN for syncing
generatePinButton.addEventListener('click', () => {
    showModal(hostNameModal);
});

// Submit host name and generate PIN
submitHostNameButton.addEventListener('click', () => {
    userName = hostNameInput.value.trim();
    if (!userName) {
        alert('Please enter your name');
        return;
    }
    userName = userName + "(Host)";
    closeModal(hostNameModal);
    fetch('/generate-pin', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            currentPin = data.pin;
            pinDisplay.textContent = `Your PIN is: ${currentPin}`;
            chatBox.style.display = 'flex';
            socket.emit('join', { role: 'host', pin: currentPin, link: videoLink, userName: userName });
        });
});

// Join sync with PIN
joinSyncButton.addEventListener('click', () => {
    const enteredPin = pinInput.value;
    fetch('/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enteredPin })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showModal(viewerNameModal);
            } else {
                alert('Incorrect PIN');
            }
        });
});

// Submit viewer name and join chat
submitViewerNameButton.addEventListener('click', () => {
    userName = viewerNameInput.value.trim();
    if (!userName) {
        alert('Please enter your name');
        return;
    }
    closeModal(viewerNameModal);
    chatBox.style.display = 'flex';
    socket.emit('join', { role: 'viewer', pin: pinInput.value, userName: userName });
});

// Set video source when receiving the video link
socket.on('video link', (link) => {
    videoPlayer.src = link;
    videoPlayer.play();
});

// Handle chat messages
sendMessageButton.addEventListener('click', () => {
    const message = chatInput.value;
    if (message && userName) {
        socket.emit('chat message', { userName, message });
        chatInput.value = '';
    }
});

socket.on('chat message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${data.userName}: ${data.message}`;
    messageElement.className = 'message';
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Extract video ID from Google Drive URL
function extractVideoIdFromUrl(url) {
    const regex = /(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}
