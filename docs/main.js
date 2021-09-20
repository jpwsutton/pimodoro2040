/* Pomodoro Timer Code + Plasma2040 connect code 

This is modified from the  Freshman-tech pomodoro timer tutorial
found here: https://github.com/Freshman-tech/pomodoro-starter-files
and: https://freshman.tech/pomodoro-timer/

*/



/* Timer defenitions */
const timer = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    sessions: 0,
};

/* This map defines the JSON commands sent to the plasma2040 to change the effects*/
const sparkleJar = {
    pomodoro: {animation: "sparkle", speed: 0.075, sparkles: 5},
    shortBreak: {animation: "sparkle_pulse", color: {r: 0, g: 150, b: 150}},
    longBreak: {animation: "rainbow", speed: 0.1, period: 10}
}

// Serial port object
const serialPort = {
    connected: false,
    attempted: false
}

// Button Configuration
const buttonSound = new Audio('button-sound.mp3');
const mainButton = document.getElementById('js-btn');

mainButton.addEventListener('click', ()=> {
    buttonSound.play();
    const { action } = mainButton.dataset;
    if(action === 'start'){
        startTimer();
    } else {
        stopTimer();
    }
});


// Mode button Configuration
const modeButtons = document.querySelector('#js-mode-buttons');
modeButtons.addEventListener('click', handleMode);

function handleMode(event){
    const {mode} = event.target.dataset;
    if(!mode)  return;
    switchMode(mode);
    stopTimer();
}


// Update the clock
function updateClock(){
    const { remainingTime } = timer;
    const minutes = `${remainingTime.minutes}`.padStart(2, '0');
    const seconds = `${remainingTime.seconds}`.padStart(2, '0');

    const min = document.getElementById('js-minutes');
    const sec = document.getElementById('js-seconds');

    min.textContent = minutes;
    sec.textContent = seconds;

    const text = timer.mode === 'pomodoro' ? 'Get back to work!' : 'Take a break!';
    document.title = `${minutes}: ${seconds} - ${text}`;


    const progress = document.getElementById('js-progress');
    progress.value = timer[timer.mode] * 60 - timer.remainingTime.total;

}


// Switch Mode
function switchMode(mode){
    timer.mode = mode;
    timer.remainingTime = {
        total: timer[mode] * 60,
        minutes: timer[mode],
        seconds: 0
    };

    document.querySelectorAll('button[data-mode]').forEach(e => e.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    document.body.style.backgroundColor = `var(--${mode})`;
    document.getElementById('js-progress').setAttribute('max', timer.remainingTime.total);

    // If the serial port is connected and available.
    // Send the relevant command.
    if(serialPort.connected === true){
        writeToStream(JSON.stringify(sparkleJar[mode]));
    }
    updateClock();
}

let interval;

// Get the remaining time on the clock.
function getRemainingTime(endTime){
    const currentTime = Date.parse(new Date());
    const difference = endTime - currentTime;

    const total = Number.parseInt(difference / 1000, 10);
    const minutes = Number.parseInt((total / 60) % 60, 10);
    const seconds = Number.parseInt(total % 60, 10);

    return {
        total,
        minutes,
        seconds,
    };
}

// Start the timer
function startTimer(){

    if('serial' in navigator && serialPort.connected === false && serialPort.attempted === false){
        try{
            connectSerial();
        } catch (err){
            console.error('There was an error opening the serial port:', err);
            serialPort.connected = false;
            serialPort.attempted = true;
        }
    }
    let { total } = timer.remainingTime;
    const endTime = Date.parse(new Date()) + total * 1000;

    if (timer.mode === 'pomodoro') timer.sessions++;

    mainButton.dataset.action = 'stop';
    mainButton.textContent = 'stop';
    mainButton.classList.add('active');

    interval = setInterval(function(){
        timer.remainingTime = getRemainingTime(endTime);
        updateClock();

        total = timer.remainingTime.total;
        if(total <= 0){
            clearInterval(interval);

            switch(timer.mode){
                case 'pomodoro':
                    console.log(timer);
                    if(timer.sessions % timer.longBreakInterval === 0){
                        console.log('Long break');
                        switchMode('longBreak');
                    } else {
                        console.log('Short break');
                        switchMode('shortBreak');
                    }
                    break;
                default:
                    switchMode('pomodoro');
            }
            document.querySelector(`[data-sound="${timer.mode}"]`).play();
            startTimer();
            if(Notification.permission === 'granted'){
                const text = timer.mode === 'pomodoro' ? 'Get back to work!' : 'Take a break!';
                new Notification(text);
            }
        }
    }, 1000);
}

function stopTimer(){
    clearInterval(interval);

    mainButton.dataset.action = 'start';
    mainButton.textContent = 'start';
    mainButton.classList.remove('active');


}

async function readLoop(){
    while(true){
        const {value, done } = await serialPort.reader.read();
        if(value) {
            console.log( value);

        } 
        if(done){
            console.log('[readloop] DONE', done);
            serialPort.reader.releaseLock();
            break;
        }
    }
}

function writeToStream(...lines){
    const writer = serialPort.outputStream.getWriter();
    lines.forEach((line) => {
        console.log('[SEND]', line);
        writer.write(line + '\n\r');
    });
    writer.releaseLock();
}

async function connectSerial(){
    serialPort.attempted = true;
    serialPort.connected = true;
    try{
    serialPort.port = await navigator.serial.requestPort();
    await serialPort.port.open({baudRate: 9600});
    
    let decoder = new TextDecoderStream();
    serialPort.inputDone = serialPort.port.readable.pipeTo(decoder.writable);
    serialPort.inputStream = decoder.readable;

    serialPort.reader = serialPort.inputStream.getReader();
    readLoop();

    const encoder = new TextEncoderStream();
    serialPort.outputDone = encoder.readable.pipeTo(serialPort.port.writable);
    serialPort.outputStream = encoder.writable;

    writeToStream(JSON.stringify({animation: "sparkle", speed: 0.075, sparkles: 5}));

    }   catch (err){
        console.error('There was an error opening the serial port:', err);
        serialPort.connected = false;
        serialPort.attempted = true;
    }


   


    
}



document.addEventListener('DOMContentLoaded', () => {

    // Lets check that the browser supports notifications
    if('Notification' in window){
        // If notification permissions have been neither granted or denied
        if(Notification.permission !== 'granted' && Notification.permission !== 'denied'){
            // ask the user for permission
            
            Notification.requestPermission().then(function(permission) {
                // If permission is granted
                if(permission === 'granted'){
                    // Create a new notification
                    new Notification(
                        'Awesome! You will be notified at the start of each session'
                    );
                }
            });
        }
    }



    
        
    switchMode('pomodoro');
});



