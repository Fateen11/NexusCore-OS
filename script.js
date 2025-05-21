// Global object to keep track of open applications and their state (visible/minimized)
const openApps = {}; // e.g., { 'app1': { element: windowElement, isMinimized: false, taskbarItem: taskbarItemElement } }

// Common app data for taskbar icons and initial setup
const appIconData = {
  app1: {
    name: "Recycle Bin",
    icon: "recyclebinempty.ico"
  },
  app2: {
    name: "Computer",
    icon: "monitor.ico"
  },
  app3: {
    name: "Information",
    icon: "info.ico"
  },
  ncWeb: {
    name: "NC Web",
    icon: "web-browser.png"
  },
  appStore: {
    name: "App Store",
    icon: "store3.ico"
  },
  notepad: {
    name: "Notepad",
    icon: "notepad.ico"
  },
  calculator: {
    name: "Calculator",
    icon: "calculator.ico"
  },
  musicPlayer: {
    name: "Music Player",
    icon: "music.ico"
  },
  calendar: {
    name: "Calendar",
    icon: "calendar.ico"
  }
};


// Function to update clock
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById("clock").textContent = `${hours}:${minutes}`;
}

// Update the clock every second
setInterval(updateClock, 1000);
updateClock(); // Run once on page load

// Function to toggle the start menu visibility
function toggleStartMenu() {
  const startMenu = document.getElementById("startMenu");
  const isVisible = startMenu.style.display === 'block';

  // Hide the start menu if it's visible, otherwise show it
  startMenu.style.display = isVisible ? 'none' : 'block';
}

// Close the start menu if clicked outside
document.addEventListener("click", function(event) {
  const startMenu = document.getElementById("startMenu");
  const startBtn = document.querySelector(".start-btn");

  // Close menu if clicked outside the start menu or start button
  if (!startMenu.contains(event.target) && !startBtn.contains(event.target)) {
    startMenu.style.display = 'none';
  }
});

// Add event listener to the start button to toggle the start menu
document.querySelector(".start-btn").addEventListener("click", toggleStartMenu);


// Function to add a taskbar item
function addTaskbarItem(appId) {
  const taskbarItemsContainer = document.getElementById('taskbarItems');
  const existingItem = taskbarItemsContainer.querySelector(`[data-app-id="${appId}"]`);

  if (existingItem) {
    // If item already exists, just make sure it's active
    existingItem.classList.add('active');
    return existingItem;
  }

  const appInfo = appIconData[appId];
  if (!appInfo) {
    console.warn(`No app data found for taskbar item: ${appId}`);
    return null;
  }

  const taskbarItem = document.createElement('div');
  taskbarItem.classList.add('taskbar-item');
  taskbarItem.classList.add('active'); // Mark as active when opened
  taskbarItem.dataset.appId = appId; // Store the app ID for easy lookup

  taskbarItem.innerHTML = `<img src="${appInfo.icon}" alt="${appInfo.name} Icon">`;

  // Attach click listener to toggle minimize/restore
  taskbarItem.onclick = () => toggleMinimize(appId);

  taskbarItemsContainer.appendChild(taskbarItem);
  return taskbarItem;
}

// Function to remove a taskbar item
function removeTaskbarItem(appId) {
  const taskbarItemsContainer = document.getElementById('taskbarItems');
  const taskbarItem = taskbarItemsContainer.querySelector(`[data-app-id="${appId}"]`);
  if (taskbarItem) {
    taskbarItemsContainer.removeChild(taskbarItem);
  }
}

// Function to open the application window
function openApp(appId) {
  let appWindow = document.getElementById(appId);
  if (appWindow) {
    // Check if app is already open
    if (openApps[appId]) {
      // If minimized, restore it
      if (openApps[appId].isMinimized) {
        appWindow.style.display = 'block';
        openApps[appId].isMinimized = false;
        openApps[appId].taskbarItem.classList.add('active');
      }
      // If already open, just bring to front
      bringToFront(appWindow);
      openApps[appId].taskbarItem.classList.add('active'); // Ensure active class on click
      return;
    }

    // Add app to openApps tracking
    openApps[appId] = {
      element: appWindow,
      isMinimized: false
    };
    appWindow.style.display = 'block';
    bringToFront(appWindow);

    // Add to taskbar
    openApps[appId].taskbarItem = addTaskbarItem(appId);

  } else {
    console.warn(`Attempted to open app with ID "${appId}", but no element with that ID was found.`);
  }
}

// Function to close the application window
function closeApp(appId) {
  const appWindow = document.getElementById(appId);
  if (appWindow) {
    appWindow.style.display = 'none';
    // Remove from openApps tracking
    delete openApps[appId];
    // Remove from taskbar
    removeTaskbarItem(appId);
  }
}

// Function to toggle minimize/restore state of an app
function toggleMinimize(appId) {
  const appWindow = document.getElementById(appId);
  if (!appWindow || !openApps[appId]) return;

  if (appWindow.style.display === 'none' || openApps[appId].isMinimized) {
    // If hidden or minimized, restore it
    appWindow.style.display = 'block';
    openApps[appId].isMinimized = false;
    bringToFront(appWindow);
    openApps[appId].taskbarItem.classList.add('active');
  } else {
    // If visible, minimize it
    appWindow.style.display = 'none';
    openApps[appId].isMinimized = true;
    openApps[appId].taskbarItem.classList.remove('active');
  }
}


// Function to make windows draggable
function makeDraggable(element) {
  let header = element.querySelector(".window-header");
  if (!header) return; // Ensure header exists

  let offsetX = 0,
    offsetY = 0,
    mouseX = 0,
    mouseY = 0;

  header.onmousedown = function(e) {
    e.preventDefault();
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Bring to front on drag start
    bringToFront(element);

    document.onmousemove = function(e) {
      e.preventDefault();
      offsetX = e.clientX - mouseX;
      offsetY = e.clientY - mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;

      element.style.left = (element.offsetLeft + offsetX) + "px";
      element.style.top = (element.offsetTop + offsetY) + "px";
    };

    document.onmouseup = function() {
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };
}

// Function to bring the window to the front when clicked
function bringToFront(element) {
  let windows = document.querySelectorAll('.window');
  let maxZIndex = 10;
  windows.forEach(win => {
    // Remove active state from other taskbar items
    const otherAppId = win.id;
    if (openApps[otherAppId] && openApps[otherAppId].taskbarItem) {
      openApps[otherAppId].taskbarItem.classList.remove('active');
    }

    let currentZ = parseInt(win.style.zIndex) || 10;
    if (currentZ > maxZIndex) {
      maxZIndex = currentZ;
    }
    win.style.zIndex = 10; // Reset all windows to base z-index
  });

  element.style.zIndex = maxZIndex + 1; // Bring clicked window to highest z-index

  // Set active state for the clicked app's taskbar item
  if (openApps[element.id] && openApps[element.id].taskbarItem) {
    openApps[element.id].taskbarItem.classList.add('active');
  }
}


// Initialize dragging for all windows and attach click-to-front listener
document.addEventListener("DOMContentLoaded", function() {
  let windows = document.querySelectorAll(".window");
  windows.forEach(win => {
    makeDraggable(win);
    win.addEventListener('mousedown', () => bringToFront(win)); // Add click to front
  });

  // Attach event listener for shutdown option in start menu
  document.getElementById('shutdownOption').onclick = () => {
    document.querySelectorAll('.window').forEach(win => win.style.display = 'none');
    // Clear all open apps and taskbar items on shutdown
    for (const appId in openApps) {
        removeTaskbarItem(appId);
    }
    // Also explicitly clear the openApps object
    for (const key in openApps) {
        if (openApps.hasOwnProperty(key)) {
            delete openApps[key];
        }
    }
    toggleStartMenu(); // Close the start menu when shutting down
    alert("NexusCore OS has been shut down.");
  };

  // Initialize File Explorer content
  const fileGrid = document.getElementById('fileGrid');
  const files = [
    {
      name: 'Project.docx',
      type: 'file'
    },
    {
      name: 'Resume.pdf',
      type: 'file'
    },
    {
      name: 'Photos',
      type: 'folder'
    },
    {
      name: 'Music',
      type: 'folder'
    },
  ];
  if (fileGrid) { // Ensure fileGrid exists before trying to populate
    files.forEach(createItem);
  }
});


// Handle the URL input for the NC Web browser
function handleURLInput(event) {
  if (event.key === 'Enter') {
    const urlInput = document.getElementById('urlInput').value;
    const iframe = document.getElementById('browserFrame');

    // Add 'http://' if the URL doesn't start with http or https
    const fullUrl = urlInput.startsWith('http://') || urlInput.startsWith('https://') ? urlInput : 'http://' + urlInput;

    // Set the iframe source to the user-provided URL
    iframe.src = fullUrl;

    iframe.onload = function() {
      iframe.style.display = 'block';
    };

    iframe.onerror = function() {
      iframe.style.display = 'none';
      alert("This website cannot be displayed inside the browser due to security restrictions (e.g., X-Frame-Options).");
    };
  }
}

// Function to install apps from the App Store
function installApp(appName) {
  console.log("installApp function called with:", appName);
  const desktop = document.querySelector(".desktop");

  // Check if the app icon data exists
  if (!appIconData[appName]) {
    console.log("App data not found for:", appName);
    return;
  }

  // Check if the app icon already exists on the desktop
  const existingDesktopIcon = desktop.querySelector(`.app-icon[onclick*="openApp('${appName}')"]`);

  if (existingDesktopIcon) {
    alert(`${appIconData[appName].name} is already installed!`);
    return;
  }

  let newApp = document.createElement("div");
  newApp.classList.add("app-icon");
  newApp.innerHTML = `<img src="${appIconData[appName].icon}" alt="${appIconData[appName].name}">
    <p>${appIconData[appName].name}</p>`;
  newApp.onclick = () => openApp(appName);

  desktop.appendChild(newApp);

  closeApp('appStore');
  alert(`${appIconData[appName].name} has been installed!`);
}

// Calculator functions
let currentInput = ''; // Store the current input string for calculator

// Function to handle input values (button clicks)
function calcInput(value) {
  const display = document.getElementById('calc-display');
  currentInput += value;
  display.value = currentInput;
}

// Function to calculate and show the result
function calculateResult() {
  const display = document.getElementById('calc-display');
  try {
    if (!/^[0-9+\-*/.() ]*$/.test(currentInput)) {
      display.value = 'Invalid Input';
      currentInput = '';
      return;
    }
    display.value = eval(currentInput);
    currentInput = display.value;
  } catch (error) {
    display.value = 'Error';
    currentInput = '';
  }
}

// Function to clear the display
function clearCalc() {
  const display = document.getElementById('calc-display');
  display.value = '';
  currentInput = '';
}

// Music Player functions
// Function to change the song based on dropdown selection
function changeSong() {
  const songSelect = document.getElementById('song-select');
  const audioPlayer = document.getElementById('audio-player');
  const audioSource = document.getElementById('audio-source');

  const selectedSong = songSelect.value;

  audioSource.src = selectedSong;

  audioPlayer.load();
  audioPlayer.play();
}

// File Explorer (Computer App) functions
// Note: fileGrid and files are initialized in DOMContentLoaded
// moved the definitions here for clarity
let fileGrid; // Declared globally
let files = []; // Declared globally

function createItem(file) {
  const div = document.createElement('div');
  div.className = 'item';

  const icon = document.createElement('img');
  icon.src = file.type === 'folder' ?
    'https://img.icons8.com/fluency/48/folder-invoices.png' :
    'https://img.icons8.com/fluency/48/document.png';

  const name = document.createElement('p');
  name.textContent = file.name;

  div.appendChild(icon);
  div.appendChild(name);
  fileGrid.appendChild(div);
}

function goBack() {
  alert("Going back to Home - (Functionality to be implemented)");
}