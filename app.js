const peer = new Peer(); // Initialize PeerJS
const connections = {}; // Store all active peer connections
const localVideo = document.createElement('video');
localVideo.autoplay = true;
localVideo.muted = true;
localVideo.id = 'localVideo';
const videoSection = document.querySelector('.video-section');
let localStream;

// Generate and display Peer ID
peer.on('open', id => {
    document.getElementById('peerIdDisplay').value = id;
    console.log('My Peer ID:', id);
    videoSection.appendChild(localVideo); // Add local video to grid
});

// Start local video
document.getElementById('startButton').onclick = async () => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (error) {
        console.error('Error accessing media devices:', error);
    }
};

// Connect to a new peer
document.getElementById('connectButton').onclick = () => {
    const remotePeerId = document.getElementById('remotePeerId').value.trim();
    if (!remotePeerId) {
        alert('Please enter a valid Peer ID.');
        return;
    }
    connectToPeer(remotePeerId);
};

// Handle incoming connections
peer.on('connection', conn => {
    if (!connections[conn.peer]) {
        connections[conn.peer] = conn;
        conn.on('data', data => console.log(`Message from ${conn.peer}:`, data));
        conn.on('close', () => handlePeerDisconnect(conn.peer));
    }
});

// Handle incoming calls
peer.on('call', call => {
    call.answer(localStream); // Answer with local stream
    call.on('stream', stream => addRemoteVideo(call.peer, stream)); // Add remote stream
});

// Connect to a peer
function connectToPeer(peerId) {
    if (connections[peerId]) return; // Skip if already connected
    const conn = peer.connect(peerId);
    connections[peerId] = conn;

    conn.on('data', data => console.log(`Message from ${peerId}:`, data));
    conn.on('close', () => handlePeerDisconnect(peerId));

    const call = peer.call(peerId, localStream); // Call the peer with local stream
    call.on('stream', stream => addRemoteVideo(peerId, stream)); // Add remote stream
}

// Add remote video stream
function addRemoteVideo(peerId, stream) {
    let videoElement = document.getElementById(peerId);
    if (!videoElement) {
        videoElement = document.createElement('video');
        videoElement.id = peerId;
        videoElement.autoplay = true;
        videoElement.classList.add('remote-video');
        videoSection.appendChild(videoElement);
    }
    videoElement.srcObject = stream;
}

// Handle peer disconnection
function handlePeerDisconnect(peerId) {
    console.log(`Peer disconnected: ${peerId}`);
    delete connections[peerId];
    const videoElement = document.getElementById(peerId);
    if (videoElement) videoElement.remove();
}
// Copy the Peer ID to the clipboard
document.getElementById('copyButton').addEventListener('click', () => {
    const peerIdInput = document.getElementById('peerIdDisplay');
    peerIdInput.select();
    peerIdInput.setSelectionRange(0, 99999); // For mobile devices

    try {
        // Try to copy the selected Peer ID to the clipboard
        document.execCommand('copy');
        alert('Peer ID copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
});
