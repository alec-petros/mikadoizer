let player;
let time_update_interval;

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function handleStateChange(event) {
    if( event.data == 0) {
        document.getElementById('state').textContent = 'ended';
    };

    if (event.data == YT.PlayerState.PLAYING) {
        const url = event.target.getVideoUrl();
        // "http://www.youtube.com/watch?v=gzDS-Kfd5XQ&feature=..."
        const match = url.match(/[?&]v=([^&]+)/);
        // ["?v=gzDS-Kfd5XQ", "gzDS-Kfd5XQ"]
        const videoId = match[1];

        document.getElementById('video').textContent = videoId;
    }
}

function onYouTubeIframeAPIReady() {
    const videoId = getParameterByName('video');

    const options = {
        width: 600,
        height: 400,
        videoId: videoId ? videoId : null,
        playerVars: {
            listType: 'playlist',
            list: videoId ? 'PLx9EaNYNlICBcJovQS4rH7bQGI6J2Tvnt' : null,
            modestbranding: 1,
            rel: 0,
            controls: 0,
            showinfo: 0,
        },
        events: {
            onReady: initialize,
            onStateChange: handleStateChange,
        }
    }

    if (videoId) {
        options.videoId = videoId;
        console.log('loading with video id: ', videoId);
        document.getElementById('video').textContent = videoId;
    } else {
        options.playerVars.listType = 'playlist';
        options.playerVars.list = 'PLx9EaNYNlICBcJovQS4rH7bQGI6J2Tvnt'; // Mikado GGXRD Playlist
    }


    player = new YT.Player('video-placeholder', options);
}

function updateTimerDisplay(){
    // Update current time text display.
    document.querySelector('#current-time').textContent = player.getCurrentTime();
}



function initialize(){

    // Update the controls on load
    updateTimerDisplay();
    // updateProgressBar();

    // Clear any old interval.
    clearInterval(time_update_interval);

    // Start interval to update elapsed time display and
    // the elapsed part of the progress bar every second.
    time_update_interval = setInterval(function () {
        updateTimerDisplay();
        // updateProgressBar();
    }, 100)

    player.seekTo(0, true);

}

function initializeEventListeners() {
    const play = document.getElementById('play');
    const skip = document.getElementById('skip');
    const screenshot = document.getElementById('screenshot');

    play.addEventListener('click', () => {
        player.seekTo(0, true);
        player.playVideo();
    });

    skip.addEventListener('click', () => {
        document.getElementById('active').setAttribute('value', 'false');
        const seconds = player.getCurrentTime();
        player.seekTo(seconds + 120, true);
        updateTimerDisplay();
        awaitPlayerActive();
    });

    screenshot.addEventListener('click', () => {
        const div = document.getElementById('video-placeholder');
        // const video = div.contentWindow.document.querySelector('.video-stream');
        const screenshot = div.getScreenshot();
        console.log(screenshot);
        document.getElementById('output').appendChild(screenshot);

        // html2canvas(video).then(function(canvas) {
        //     document.getElementById('output').appendChild(canvas)
        // })
    })
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function awaitPlayerActive() {
    let active;
    while (active != 1) {
        await timeout(100);
        active = player.getPlayerState();
        console.log('active: ', active);
    }

    document.getElementById('active').setAttribute('value', 'true');
}

initializeEventListeners();