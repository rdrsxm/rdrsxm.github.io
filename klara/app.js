const state = {
    user: null,
    db: null,
    addictions: [],
    checkins: [],
    authMode: 'login', // 'login' or 'signup'
    activeTimer: null
};

const MILESTONES = [
    { days: 1, label: "1 day", icon: "fa-1" },
    { days: 2, label: "2 days", icon: "fa-2" },
    { days: 3, label: "3 days", icon: "fa-3" },
    { days: 4, label: "4 days", icon: "fa-4" },
    { days: 5, label: "5 days", icon: "fa-5" },
    { days: 6, label: "6 days", icon: "fa-6" },
    { days: 7, label: "1 week", icon: "fa-7" },
    { days: 10, label: "10 days", icon: "fa-star" },
    { days: 14, label: "2 weeks", icon: "fa-shield" },
    { days: 21, label: "3 weeks", icon: "fa-shield-halved" },
    { days: 30, label: "1 month", icon: "fa-shield-heart" },
    { days: 42, label: "6 weeks", icon: "fa-shield-heart" },
    { days: 60, label: "2 months", icon: "fa-star" },
    { days: 90, label: "3 months", icon: "fa-star" },
    { days: 120, label: "4 months", icon: "fa-star" },
    { days: 150, label: "5 months", icon: "fa-star" },
    { days: 180, label: "6 months", icon: "fa-fire" },
    { days: 365, label: "1 year", icon: "fa-trophy" },
    { days: 730, label: "2 years", icon: "fa-crown" },
    { days: 1095, label: "3 years", icon: "fa-crown" },
    { days: 1460, label: "4 years", icon: "fa-crown" },
    { days: 1825, label: "5 years", icon: "fa-crown" },
    { days: 3650, label: "10 years", icon: "fa-gem" }
];

// UI Elements
const els = {
    authView: document.getElementById('auth-view'),
    mainView: document.getElementById('main-view'),
    authForm: document.getElementById('auth-form'),
    authBtn: document.getElementById('auth-btn'),
    authToggle: document.getElementById('auth-toggle'),
    authError: document.getElementById('auth-error'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    emptyState: document.getElementById('empty-state'),
    addictionsList: document.getElementById('addictions-list'),
    navItems: document.querySelectorAll('.nav-item'),
    modals: document.querySelectorAll('.modal')
};

// ==========================================
// 1. FIREBASE SETUP
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBNDvll6zBWIXopy0g6cRxemE-f-rJri78",
    authDomain: "wklara-690fe.firebaseapp.com",
    projectId: "wklara-690fe",
    storageBucket: "wklara-690fe.firebasestorage.app",
    messagingSenderId: "720377395058",
    appId: "1:720377395058:web:6fc2fc629171a8056c0feb"
};

// Initialize Firebase only if the config is filled
let appInitialized = false;
try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        state.db = firebase.firestore();
        appInitialized = true;
        initAuthListener();
    } else {
        els.authError.innerText = "Firebase not configured. Please add config in app.js";
    }
} catch (e) {
    console.error("Firebase init error:", e);
}


// ==========================================
// 2. AUTHENTICATION
// ==========================================
function initAuthListener() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            state.user = user;
            showMainView();
            fetchAddictions();
            fetchCheckins();
            initNotifications();
        } else {
            state.user = null;
            showAuthView();
        }
    });
}

els.authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!appInitialized) return;

    const email = els.emailInput.value;
    const password = els.passwordInput.value;

    els.authBtn.disabled = true;
    els.authBtn.innerText = "Please wait...";
    els.authError.innerText = "";

    if (state.authMode === 'login') {
        firebase.auth().signInWithEmailAndPassword(email, password)
            .catch(err => handleAuthError(err));
    } else {
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .catch(err => handleAuthError(err));
    }
});

function handleAuthError(error) {
    let msg = error.message;
    const isInvalidCreds =
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/invalid-login-credentials' ||
        (typeof msg === 'string' && msg.includes('INVALID_LOGIN_CREDENTIALS'));

    if (isInvalidCreds) {
        msg = "Incorrect email or password.";
    } else if (error.code === 'auth/invalid-email') {
        msg = "Invalid email address.";
    } else if (error.code === 'auth/email-already-in-use') {
        msg = "An account already exists with this email.";
    } else if (typeof msg === 'string' && msg.includes('{')) {
        // If it's still a raw JSON string for some other error, try to parse or just give a generic message
        try {
            const parsed = JSON.parse(msg.replace(/^Firebase:\s*/, ''));
            if (parsed.error && parsed.error.message) {
                msg = parsed.error.message;
            }
        } catch (e) { }
    }

    els.authError.innerText = msg;
    els.authBtn.disabled = false;
    els.authBtn.innerText = state.authMode === 'login' ? 'Sign In' : 'Sign Up';
}

const app = {
    toggleAuthMode: function () {
        state.authMode = state.authMode === 'login' ? 'signup' : 'login';
        if (state.authMode === 'login') {
            els.authBtn.innerText = 'Sign In';
            els.authToggle.innerHTML = 'Need an account? <span onclick="app.toggleAuthMode()">Sign Up</span>';
        } else {
            els.authBtn.innerText = 'Sign Up';
            els.authToggle.innerHTML = 'Already have an account? <span onclick="app.toggleAuthMode()">Sign In</span>';
        }
    },

    logout: function () {
        if (!confirm("Are you sure you want to log out?")) return;
        this.closeModal('settings-modal');
        if (appInitialized) firebase.auth().signOut();
    },

    exportData: function () {
        const data = {
            addictions: state.addictions,
            checkins: state.checkins,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `klara-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.closeModal('settings-modal');
    },

    importData: function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.addictions || !data.checkins) throw new Error("Invalid file format. Missing trackers or check-ins.");

                if (!confirm(`Are you sure you want to import ${data.addictions.length} trackers and ${data.checkins.length} check-ins? Existing trackers with the same IDs will be overwritten.`)) {
                    event.target.value = '';
                    return;
                }

                const batch = state.db.batch();
                const userRef = state.db.collection('users').doc(state.user.uid);

                data.addictions.forEach(item => {
                    const id = item.id;
                    delete item.id;
                    batch.set(userRef.collection('addictions').doc(id), item, { merge: true });
                });

                data.checkins.forEach(item => {
                    const id = item.id;
                    delete item.id;
                    batch.set(userRef.collection('checkins').doc(id), item, { merge: true });
                });

                await batch.commit();
                alert("Import successful! The dashboard will now update.");
                this.closeModal('settings-modal');
                event.target.value = '';
            } catch (error) {
                alert("Error importing data: " + error.message);
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    },

    // ==========================================
    // 3. NAVIGATION & MODALS
    // ==========================================
    showAddTrackerModal: function () {
        document.getElementById('add-tracker-modal').classList.add('open');

        // Auto-focus after modal animation
        setTimeout(() => {
            document.getElementById('tracker-name').focus();
        }, 100);
    },

    setTrackerDateToNow: function () {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('tracker-date').value = now.toISOString().slice(0, 16);
    },

    showAddCheckInModal: function () {
        if (state.addictions.length === 0) {
            alert("Please add a tracker first!");
            return;
        }

        const select = document.getElementById('checkin-tracker-select');
        select.innerHTML = state.addictions.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

        document.getElementById('add-checkin-modal').classList.add('open');
    },

    showUrgeModal: function () {
        urge.open();
    },

    showSettingsModal: function () {
        if (state.user) {
            document.getElementById('settings-email').innerText = state.user.email || "User";
        }

        // Init notification UI state
        const notificationsEnabled = localStorage.getItem("klara_notifications_enabled") === "true";
        const toggle = document.getElementById('notification-toggle');
        const timeContainer = document.getElementById('notification-time-container');
        const timeInput = document.getElementById('notification-time');

        toggle.checked = notificationsEnabled;
        timeContainer.style.display = notificationsEnabled ? 'flex' : 'none';

        const savedTime = localStorage.getItem("klara_notification_time") || "20:00";
        timeInput.value = savedTime;

        document.getElementById('settings-modal').classList.add('open');
    },

    closeModal: function (id) {
        document.getElementById(id).classList.remove('open');
    },

    deleteCheckin: function (id) {
        if (!confirm("Are you sure you want to delete this check-in?")) return;
        state.db.collection('users').doc(state.user.uid).collection('checkins').doc(id).delete()
            .then(() => console.log("Check-in deleted"))
            .catch(err => console.error("Error deleting check-in:", err));
    },

    deleteAddiction: function (id) {
        if (!confirm("Are you sure you want to delete this tracker?")) return;
        state.db.collection('users').doc(state.user.uid).collection('addictions').doc(id).update({
            isActive: false
        }).then(() => console.log("Tracker deactivated"))
            .catch(err => console.error("Error deactivating tracker:", err));
    },

    setRelapse: function (didRelapse) {
        // We will store this as a data attribute on the form
        document.getElementById('add-checkin-form').dataset.relapse = didRelapse;

        if (didRelapse) {
            document.getElementById('status-setback').classList.add('active');
            document.getElementById('status-ontrack').classList.remove('active');
        } else {
            document.getElementById('status-ontrack').classList.add('active');
            document.getElementById('status-setback').classList.remove('active');
        }
    },

    updateCravingLabel: function () {
        const val = parseInt(document.getElementById('checkin-cravings').value);
        const labels = ["None", "Mild", "Moderate", "Strong", "Severe"];
        document.getElementById('craving-label').innerText = labels[val - 1];
    },

    toggleNotifications: function (checkbox) {
        if (checkbox.checked) {
            if ("Notification" in window) {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        localStorage.setItem("klara_notifications_enabled", "true");
                        document.getElementById('notification-time-container').style.display = 'flex';
                        const bannerTime = document.getElementById('banner-notification-time');
                        const bannerToggleWrapper = document.getElementById('banner-notification-toggle-wrapper');
                        const bannerToggleInput = document.getElementById('banner-notification-toggle');
                        if (bannerTime) bannerTime.style.display = 'block';
                        if (bannerToggleWrapper) bannerToggleWrapper.style.display = 'none';
                        if (bannerToggleInput) bannerToggleInput.checked = true;
                    } else {
                        checkbox.checked = false;
                        alert("Please allow notifications in your browser settings to use this feature.");
                    }
                });
            } else {
                checkbox.checked = false;
                alert("Your browser does not support notifications.");
            }
        } else {
            localStorage.setItem("klara_notifications_enabled", "false");
            document.getElementById('notification-time-container').style.display = 'none';
            const bannerTime = document.getElementById('banner-notification-time');
            const bannerToggleWrapper = document.getElementById('banner-notification-toggle-wrapper');
            const bannerToggleInput = document.getElementById('banner-notification-toggle');
            if (bannerTime) bannerTime.style.display = 'none';
            if (bannerToggleWrapper) bannerToggleWrapper.style.display = 'inline-block';
            if (bannerToggleInput) bannerToggleInput.checked = false;
        }
    },

    saveNotificationTime: function () {
        const time = document.getElementById('notification-time').value;
        localStorage.setItem("klara_notification_time", time);
        const bannerTime = document.getElementById('banner-notification-time');
        if (bannerTime) bannerTime.value = time;
    },

    saveBannerNotificationTime: function () {
        const time = document.getElementById('banner-notification-time').value;
        localStorage.setItem("klara_notification_time", time);
        const settingsTime = document.getElementById('notification-time');
        if (settingsTime) settingsTime.value = time;

        // If notifications aren't enabled, enable them
        if (localStorage.getItem("klara_notifications_enabled") !== "true") {
            const toggle = document.getElementById('notification-toggle');
            if (toggle) {
                toggle.checked = true;
                this.toggleNotifications(toggle);
            }
        }
    },

    toggleBannerNotifications: function (checkbox) {
        // Sync with settings toggle and re-use logic
        const settingsToggle = document.getElementById('notification-toggle');
        if (settingsToggle) {
            settingsToggle.checked = checkbox.checked;
        }
        this.toggleNotifications(checkbox);
    },

    // ==========================================
    // 3. HEATMAP LOGIC
    // ==========================================
    heatmapView: 'week',
    heatmapOffset: 0,
    heatmapTrackerId: null,

    setHeatmapTracker: function (id) {
        this.heatmapTrackerId = id;
        this.renderHeatmap();
    },

    setHeatmapView: function (view) {
        this.heatmapView = view;
        this.heatmapOffset = 0;

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.renderHeatmap();
    },

    heatmapPrev: function () {
        this.heatmapOffset++;
        this.renderHeatmap();
    },

    heatmapNext: function () {
        if (this.heatmapOffset > 0) {
            this.heatmapOffset--;
            this.renderHeatmap();
        }
    },

    renderHeatmap: function () {
        const wrapper = document.getElementById('heatmap-wrapper');
        const grid = document.getElementById('heatmap-grid');
        const dateLabel = document.getElementById('heatmap-date-label');
        const nextBtn = document.getElementById('heatmap-next-btn');

        if (state.addictions.length === 0) {
            wrapper.style.display = 'none';
            return;
        }

        if (!this.heatmapTrackerId || !state.addictions.find(a => a.id === this.heatmapTrackerId)) {
            this.heatmapTrackerId = state.addictions[0].id;
        }

        const tabsContainer = document.getElementById('heatmap-tracker-tabs');
        if (tabsContainer) {
            let tabsHtml = '';
            state.addictions.forEach(tracker => {
                const icon = tracker.icon || 'fa-leaf';
                const activeClass = tracker.id === this.heatmapTrackerId ? 'active' : '';
                tabsHtml += `<button class="tracker-tab-btn ${activeClass}" onclick="app.setHeatmapTracker('${tracker.id}')">
                    <i class="fa-solid ${icon}"></i> ${tracker.name}
                </button>`;
            });
            tabsContainer.innerHTML = tabsHtml;
        }

        wrapper.style.display = 'block';
        nextBtn.disabled = this.heatmapOffset === 0;

        grid.className = 'heatmap-grid view-' + this.heatmapView;

        let startDate, endDate, labelStr = '';
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (this.heatmapView === 'week') {
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() - (this.heatmapOffset * 7));
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);

            if (this.heatmapOffset === 0) labelStr = 'This Week';
            else if (this.heatmapOffset === 1) labelStr = 'Last Week';
            else labelStr = `${startDate.toLocaleDateString('en-GB')} - ${endDate.toLocaleDateString('en-GB')}`;
        } else if (this.heatmapView === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth() - this.heatmapOffset, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() - this.heatmapOffset + 1, 0);

            if (this.heatmapOffset === 0) labelStr = 'This Month';
            else labelStr = startDate.toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' });
        } else if (this.heatmapView === 'year') {
            startDate = new Date(now.getFullYear() - this.heatmapOffset, 0, 1);
            endDate = new Date(now.getFullYear() - this.heatmapOffset, 11, 31);

            if (this.heatmapOffset === 0) labelStr = 'This Year';
            else labelStr = startDate.getFullYear().toString();
        }

        dateLabel.innerText = labelStr;

        let html = '';
        let currentStreak = 0;

        // Checkins sorted newest first, filtered by tracker
        const checkinsByDate = {};
        const trackerCheckins = state.checkins.filter(c => c.addictionId === this.heatmapTrackerId);
        trackerCheckins.forEach(c => {
            const d = new Date(c.date).setHours(0, 0, 0, 0);
            if (!checkinsByDate[d] || checkinsByDate[d].cravingLevel < c.cravingLevel) {
                checkinsByDate[d] = c;
            }
        });

        // streak calc
        let sDate = new Date(now);
        while (checkinsByDate[sDate.getTime()] && !checkinsByDate[sDate.getTime()].didRelapse) {
            currentStreak++;
            sDate.setDate(sDate.getDate() - 1);
        }

        document.getElementById('stat-streak').innerText = currentStreak;
        document.getElementById('stat-total').innerText = trackerCheckins.length;

        // Generate grid cells
        if (this.heatmapView !== 'week') {
            const startDay = startDate.getDay();
            for (let i = 0; i < startDay; i++) {
                html += `<div class="heatmap-cell" style="visibility: hidden;"></div>`;
            }
        }

        let curr = new Date(startDate);
        while (curr <= endDate) {
            const t = curr.getTime();
            const checkin = checkinsByDate[t];
            let cellClass = 'level-0';
            let title = curr.toLocaleDateString('en-GB');

            if (checkin) {
                if (checkin.didRelapse) {
                    cellClass = 'level-relapse';
                    title += ' - Setback';
                } else {
                    const c = checkin.cravingLevel;
                    if (c === 0) cellClass = 'level-3';
                    else if (c <= 2) cellClass = 'level-2';
                    else cellClass = 'level-1';
                    title += ` - Cravings: ${c}/5`;
                }
            }

            let text = '';
            if (this.heatmapView !== 'year') {
                text = curr.getDate();
            }

            html += `<div class="heatmap-cell ${cellClass}" title="${title}">${text}</div>`;
            curr.setDate(curr.getDate() + 1);
        }

        grid.innerHTML = html;

        if (this.heatmapView === 'year') {
            grid.scrollLeft = grid.scrollWidth;
        }
    }
};

function showAuthView() {
    els.mainView.classList.remove('active-view');
    els.authView.classList.add('active-view');
    if (state.activeTimer) clearInterval(state.activeTimer);
}

function showMainView() {
    els.authView.classList.remove('active-view');
    els.mainView.classList.add('active-view');
    els.authBtn.disabled = false;
    els.authBtn.innerText = state.authMode === 'login' ? 'Sign In' : 'Sign Up';

    const savedTime = localStorage.getItem("klara_notification_time") || "20:00";
    const notificationsEnabled = localStorage.getItem("klara_notifications_enabled") === "true";

    const bannerTime = document.getElementById('banner-notification-time');
    const bannerToggleWrapper = document.getElementById('banner-notification-toggle-wrapper');
    const bannerToggleInput = document.getElementById('banner-notification-toggle');

    if (bannerTime) bannerTime.value = savedTime;

    if (notificationsEnabled) {
        if (bannerTime) bannerTime.style.display = 'block';
        if (bannerToggleWrapper) bannerToggleWrapper.style.display = 'none';
        if (bannerToggleInput) bannerToggleInput.checked = true;
    } else {
        if (bannerTime) bannerTime.style.display = 'none';
        if (bannerToggleWrapper) bannerToggleWrapper.style.display = 'inline-block';
        if (bannerToggleInput) bannerToggleInput.checked = false;
    }
}

// Setup Bottom Nav
els.navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Update active tab styling
        els.navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Hide all main contents
        document.querySelectorAll('.nav-content').forEach(content => {
            content.classList.remove('active-content');
        });

        // Show target content
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active-content');
    });
});

// Close modals when clicking outside
els.modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });
});

// Setup icon selector
document.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
    });
});

// ==========================================
// 4. DATA LOGIC (FIRESTORE)
// ==========================================
document.getElementById('add-tracker-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.user || !state.db) return;

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Saving...';

    const name = document.getElementById('tracker-name').value;
    const dateStr = document.getElementById('tracker-date').value;
    const startDate = new Date(dateStr).getTime();
    const activeIconBtn = document.querySelector('.icon-btn.active');
    const icon = activeIconBtn ? activeIconBtn.getAttribute('data-icon') : 'fa-leaf';

    state.db.collection('users').doc(state.user.uid).collection('addictions').add({
        name: name,
        startDate: startDate,
        icon: icon,
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        app.closeModal('add-tracker-modal');
        document.getElementById('add-tracker-form').reset();
        btn.disabled = false;
        btn.innerText = originalText;
    }).catch(err => {
        console.error("Error adding tracker:", err);
        btn.disabled = false;
        btn.innerText = originalText;
    });
});

function fetchAddictions() {
    if (!state.user || !state.db) return;

    // We fetch all addictions and filter/sort client-side to avoid needing 
    // to manually create a composite index in the Firebase Console.
    state.db.collection('users').doc(state.user.uid).collection('addictions')
        .onSnapshot((snapshot) => {
            let fetchedAddictions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter active and sort by startDate ascending
            state.addictions = fetchedAddictions
                .filter(a => a.isActive !== false)
                .sort((a, b) => a.startDate - b.startDate);

            renderDashboard();
            renderMilestones();
        }, (error) => {
            console.error("Error fetching addictions:", error);
            // Optionally show error to user
            var el = document.getElementById('debug-log');
            if (el) el.innerHTML += '<br>Firestore Error: ' + error.message;
        });
}

function fetchCheckins() {
    if (!state.user || !state.db) return;

    state.db.collection('users').doc(state.user.uid).collection('checkins')
        .onSnapshot((snapshot) => {
            let fetchedCheckins = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            state.checkins = fetchedCheckins.sort((a, b) => b.date - a.date);
            if (typeof renderCheckins === 'function') {
                renderCheckins();
                app.renderHeatmap();
            }
        }, (error) => {
            console.error("Error fetching checkins:", error);
        });
}

document.getElementById('add-checkin-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.user || !state.db) return;

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Saving...';

    const addictionId = document.getElementById('checkin-tracker-select').value;
    const cravings = parseInt(document.getElementById('checkin-cravings').value);
    const didRelapse = (document.getElementById('add-checkin-form').dataset.relapse === 'true');

    state.db.collection('users').doc(state.user.uid).collection('checkins').add({
        addictionId: addictionId,
        date: new Date().getTime(),
        cravingLevel: cravings,
        didRelapse: didRelapse
    }).then(() => {
        app.closeModal('add-checkin-modal');
        document.getElementById('add-checkin-form').reset();
        app.setRelapse(false);
        app.updateCravingLabel();
        btn.disabled = false;
        btn.innerText = originalText;
    }).catch(err => {
        console.error("Error adding check-in:", err);
        btn.disabled = false;
        btn.innerText = originalText;
    });
});

// ==========================================
// 5. RENDERING & TIMERS
// ==========================================
function renderDashboard() {
    if (state.addictions.length === 0) {
        els.emptyState.classList.remove('hidden');
        els.addictionsList.innerHTML = '';
        return;
    }

    els.emptyState.classList.add('hidden');

    // Build HTML for each addiction
    let html = '';
    state.addictions.forEach(addiction => {
        const iconClass = addiction.icon || 'fa-leaf';

        html += `
            <div class="addiction-card" id="card-${addiction.id}">
                <div class="card-header">
                    <div class="card-icon"><i class="fa-solid ${iconClass}"></i></div>
                    <div class="card-title">
                        <h3>${addiction.name}</h3>
                        <p>Since ${new Date(addiction.startDate).toLocaleDateString('en-GB')}</p>
                    </div>
                    <button class="delete-btn" onclick="app.deleteAddiction('${addiction.id}')"><i class="fa-solid fa-close"></i></button>
                </div>
                
                <div class="timer-display">
                    <div class="timer-halo"></div>
                    <div class="timer-main">
                        <div class="number" id="days-${addiction.id}">0</div>
                        <div class="label" id="days-label-${addiction.id}">days free</div>
                    </div>
                    <div class="timer-sub">
                        <div class="timer-unit">
                            <span class="val" id="hrs-${addiction.id}">00</span>
                            <span class="lbl">hours</span>
                        </div>
                        <span class="timer-colon">:</span>
                        <div class="timer-unit">
                            <span class="val" id="mins-${addiction.id}">00</span>
                            <span class="lbl">mins</span>
                        </div>
                        <span class="timer-colon">:</span>
                        <div class="timer-unit">
                            <span class="val" id="secs-${addiction.id}">00</span>
                            <span class="lbl">secs</span>
                        </div>
                    </div>
                </div>
                
                <div class="milestone-info">
                    <div class="milestone-header">
                        <span id="milestone-label-${addiction.id}" style="margin-right: 5px"><i class="fa-solid fa-flag"></i> Working toward next milestone</span>
                        <span id="progress-pct-${addiction.id}">0%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" id="progress-fill-${addiction.id}"></div>
                    </div>
                </div>
            </div>
        `;
    });

    els.addictionsList.innerHTML = html;

    // Start interval to update timers every second
    if (state.activeTimer) clearInterval(state.activeTimer);
    updateTimers(); // run once immediately
    state.activeTimer = setInterval(updateTimers, 1000);
}

function updateTimers() {
    const now = new Date().getTime();

    state.addictions.forEach(addiction => {
        const diff = Math.max(0, now - addiction.startDate);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Update DOM
        const daysEl = document.getElementById(`days-${addiction.id}`);
        if (daysEl) {
            daysEl.innerText = days;
            document.getElementById(`days-label-${addiction.id}`).innerText = days === 1 ? 'day free' : 'days free';

            document.getElementById(`hrs-${addiction.id}`).innerText = String(hours).padStart(2, '0');
            document.getElementById(`mins-${addiction.id}`).innerText = String(minutes).padStart(2, '0');
            document.getElementById(`secs-${addiction.id}`).innerText = String(seconds).padStart(2, '0');

            // Milestone logic using MILESTONES array
            const daysSober = diff / (1000 * 60 * 60 * 24);
            const nextMilestone = MILESTONES.find(m => daysSober < m.days) || MILESTONES[MILESTONES.length - 1];
            const prevMilestone = [...MILESTONES].reverse().find(m => daysSober >= m.days);
            const prevDays = prevMilestone ? prevMilestone.days : 0;

            const span = nextMilestone.days - prevDays;
            let pct = 100;
            if (span > 0) {
                pct = Math.min(100, Math.max(0, ((daysSober - prevDays) / span) * 100));
            }

            document.getElementById(`milestone-label-${addiction.id}`).innerHTML = `<i class="fa-solid fa-flag" style="margin-right: 5px"></i> Working toward ${nextMilestone.label}`;
            document.getElementById(`progress-pct-${addiction.id}`).innerText = Math.floor(pct) + '%';
            document.getElementById(`progress-fill-${addiction.id}`).style.width = pct + '%';
        }
    });
}

function renderCheckins() {
    const list = document.getElementById('checkins-list');
    const empty = document.getElementById('checkins-empty');

    if (state.checkins.length === 0) {
        empty.classList.remove('hidden');
        list.innerHTML = '';
        return;
    }

    empty.classList.add('hidden');

    let html = '';
    state.checkins.forEach(checkin => {
        const date = new Date(checkin.date).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

        const statusClass = checkin.didRelapse ? 'danger' : 'success';
        const statusIcon = checkin.didRelapse ? 'fa-rotate-left' : 'fa-circle-check';
        const statusText = checkin.didRelapse ? 'Setback' : 'On track';

        const tracker = state.addictions.find(a => a.id === checkin.addictionId);
        const trackerName = tracker ? tracker.name : 'Unknown';
        const trackerIcon = tracker && tracker.icon ? tracker.icon : 'fa-tag';

        html += `
            <div class="checkin-card">
                <div class="checkin-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="detail-pill check-in-item-class" style="margin: 0;"><i class="fa-solid ${trackerIcon}" style="color: var(--text-tertiary);"></i> ${trackerName}</div>
                        <div class="checkin-date">${date}</div>
                    </div>
                    <button class="delete-btn" onclick="app.deleteCheckin('${checkin.id}')"><i class="fa-solid fa-close"></i></button>
                </div>
                <div class="checkin-details">
                    <div class="detail-pill"><i class="fa-solid ${statusIcon} icon-${statusClass}"></i> ${statusText}</div>
                    <div class="detail-pill"><i class="fa-solid fa-fire"></i> Cravings: ${checkin.cravingLevel}/5</div>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
}


function renderMilestones() {
    const list = document.getElementById('milestones-list');
    const empty = document.getElementById('milestones-empty');

    if (state.addictions.length === 0) {
        empty.classList.remove('hidden');
        list.innerHTML = '';
        return;
    }

    empty.classList.add('hidden');

    const milestones = [
        { days: 1, label: "1 day", icon: "fa-1" },
        { days: 2, label: "2 days", icon: "fa-2" },
        { days: 3, label: "3 days", icon: "fa-3" },
        { days: 4, label: "4 days", icon: "fa-4" },
        { days: 5, label: "5 days", icon: "fa-5" },
        { days: 6, label: "6 days", icon: "fa-6" },
        { days: 7, label: "1 week", icon: "fa-7" },
        { days: 10, label: "10 days", icon: "fa-star" },
        { days: 14, label: "2 weeks", icon: "fa-shield" },
        { days: 21, label: "3 weeks", icon: "fa-shield-halved" },
        { days: 30, label: "1 month", icon: "fa-shield-heart" },
        { days: 42, label: "6 weeks", icon: "fa-shield-heart" },
        { days: 60, label: "2 months", icon: "fa-star" },
        { days: 90, label: "3 months", icon: "fa-star" },
        { days: 120, label: "4 months", icon: "fa-star" },
        { days: 150, label: "5 months", icon: "fa-star" },
        { days: 180, label: "6 months", icon: "fa-fire" },
        { days: 365, label: "1 year", icon: "fa-trophy" },
        { days: 730, label: "2 years", icon: "fa-crown" },
        { days: 1095, label: "3 years", icon: "fa-crown" },
        { days: 1460, label: "4 years", icon: "fa-crown" },
        { days: 1825, label: "5 years", icon: "fa-crown" },
        { days: 3650, label: "10 years", icon: "fa-gem" }
    ];

    const CIRC = 2 * Math.PI * 30; // circumference for r=30

    // SVG gradient defs (shared)
    let html = `<svg width="0" height="0" style="position:absolute"><defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#f97316"/>
        </linearGradient>
    </defs></svg>`;

    const now = Date.now();

    state.addictions.forEach(addiction => {
        const diff = Math.max(0, now - addiction.startDate);
        const daysSober = diff / (1000 * 60 * 60 * 24);
        const daysSoberInt = Math.floor(daysSober);

        const unlockedCount = milestones.filter(m => daysSober >= m.days).length;
        const nextMilestone = milestones.find(m => daysSober < m.days);
        const prevMilestone = [...milestones].reverse().find(m => daysSober >= m.days);

        // Progress to next milestone (for the top bar)
        let pct = 100;
        if (nextMilestone) {
            const prevDays = prevMilestone ? prevMilestone.days : 0;
            const span = nextMilestone.days - prevDays;
            if (span > 0) {
                pct = Math.min(100, Math.max(0, ((daysSober - prevDays) / span) * 100));
            }
        }

        // Next milestone info
        let nextHtml = '';
        if (nextMilestone) {
            const daysToGo = Math.max(0, nextMilestone.days - daysSoberInt);
            nextHtml = `
                <div class="milestone-progress-info">
                    <span class="next-label">Next: ${nextMilestone.label}</span>
                    <span class="days-label">${daysToGo}d to go</span>
                </div>`;
        } else {
            nextHtml = `
                <div class="milestone-progress-info">
                    <span class="days-label">Every milestone unlocked! 🎉</span>
                </div>`;
        }

        let gridHtml = '';
        milestones.forEach(m => {
            const unlocked = daysSober >= m.days;
            let progress;
            if (unlocked) {
                progress = 1;
            } else if (m === nextMilestone) {
                const prevDays = prevMilestone ? prevMilestone.days : 0;
                const span = m.days - prevDays;
                progress = span > 0 ? (daysSober - prevDays) / span : 0;
            } else {
                progress = 0;
            }
            const offset = CIRC - (CIRC * progress);
            const classes = unlocked ? 'milestone-badge unlocked' : 'milestone-badge';
            const ringClass = unlocked ? 'ring-fill unlocked' : 'ring-fill';
            const statusText = unlocked ? '✓ Unlocked' : Math.round(progress * 100) + '%';
            const lockHtml = unlocked ? '' : '<div class="milestone-ring-lock"><i class="fa-solid fa-lock"></i></div>';

            gridHtml += `
                <div class="${classes}">
                    <div class="milestone-ring">
                        <svg viewBox="0 0 68 68">
                            <circle class="ring-bg" cx="34" cy="34" r="30" />
                            <circle class="${ringClass}" cx="34" cy="34" r="30"
                                stroke-dasharray="${CIRC.toFixed(1)}"
                                stroke-dashoffset="${offset.toFixed(1)}" />
                        </svg>
                        <div class="milestone-ring-icon"><i class="fa-solid ${m.icon}"></i></div>
                        ${lockHtml}
                    </div>
                    <span class="m-title">${m.label}</span>
                    <span class="m-status">${statusText}</span>
                </div>
            `;
        });

        const msIcon = addiction.icon || 'fa-leaf';
        html += `
            <div class="milestone-section">
                <div class="milestone-section-header">
                    <div class="ms-icon"><i class="fa-solid ${msIcon}"></i></div>
                    <div class="ms-info">
                        <h4>${addiction.name}</h4>
                        <span>${unlockedCount} of ${milestones.length} milestones</span>
                    </div>
                    <div class="milestone-trophy-chip">
                        <i class="fa-solid fa-trophy"></i> ${unlockedCount}
                    </div>
                </div>
                <div class="milestone-progress-bar">
                    <div class="milestone-progress-track">
                        <div class="milestone-progress-fill" style="width: ${pct.toFixed(1)}%"></div>
                    </div>
                    ${nextHtml}
                </div>
                <div class="milestone-grid">
                    ${gridHtml}
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
}

// ==========================================
// 6. URGE GROUNDING
// ==========================================
const urge = {
    timer: null,
    surfInterval: null,
    breatheInterval: null,

    sensesData: [
        { count: 5, sense: "see", prompt: "Name five things you can see right now.", icon: "fa-eye" },
        { count: 4, sense: "feel", prompt: "Notice four things you can physically feel.", icon: "fa-hand-sparkles" },
        { count: 3, sense: "hear", prompt: "Listen for three distinct sounds.", icon: "fa-ear-listen" },
        { count: 2, sense: "smell", prompt: "Find two things you can smell.", icon: "fa-nose" },
        { count: 1, sense: "taste", prompt: "Notice one thing you can taste.", icon: "fa-tooth" }
    ],
    currentSenseIndex: 0,
    tappedSenses: 0,

    surfElapsed: 0,
    surfDuration: 120, // 2 minutes
    isSurfing: false,

    open: function () {
        document.getElementById('urge-modal').classList.add('open');
        this.showView('menu');
        document.getElementById('urge-title').innerText = "Take a moment";
    },

    close: function () {
        document.getElementById('urge-modal').classList.remove('open');
        this.cleanup();
    },

    cleanup: function () {
        clearInterval(this.surfInterval);
        clearInterval(this.breatheInterval);
        clearTimeout(this.timer);

        // reset UI
        document.getElementById('surf-btn').innerText = "Start";
        this.isSurfing = false;

        const orb = document.getElementById('breathe-orb');
        if (orb) {
            orb.className = 'breathe-orb';
        }
    },

    showView: function (viewName) {
        document.querySelectorAll('.urge-view').forEach(v => v.classList.remove('active'));
        document.getElementById('urge-' + viewName).classList.add('active');

        if (viewName === 'menu') {
            document.getElementById('urge-title').innerText = "Take a moment";
            document.getElementById('urge-close-btn').innerHTML = '<i class="fa-solid fa-xmark"></i>';
            document.getElementById('urge-close-btn').onclick = () => this.close();
        } else {
            document.getElementById('urge-close-btn').innerHTML = '<i class="fa-solid fa-close"></i>';
            document.getElementById('urge-close-btn').onclick = () => {
                this.cleanup();
                this.showView('menu');
            };
        }
    },

    start: function (exercise) {
        this.cleanup();
        this.showView(exercise);

        if (exercise === 'senses') {
            document.getElementById('urge-title').innerText = "Ground with your senses";
            this.currentSenseIndex = 0;
            this.tappedSenses = 0;
            this.renderSenses();
        } else if (exercise === 'surf') {
            document.getElementById('urge-title').innerText = "Ride the urge out";
            this.surfElapsed = 0;
            this.isSurfing = false;
            this.renderSurf();
        } else if (exercise === 'breathe') {
            document.getElementById('urge-title').innerText = "Box breathing";
            this.startBreathe();
        }
    },

    // ==========================================
    // SENSES LOGIC
    // ==========================================
    renderSenses: function () {
        const step = this.sensesData[this.currentSenseIndex];

        document.getElementById('senses-number').innerText = step.count - this.tappedSenses;
        document.getElementById('senses-icon').className = `fa-solid ${step.icon}`;
        document.getElementById('senses-title').innerText = `${step.count} things you can ${step.sense}`;
        document.getElementById('senses-prompt').innerText = step.prompt;

        // update dots
        const dots = document.getElementById('senses-dots').children;
        for (let i = 0; i < dots.length; i++) {
            dots[i].className = (i === this.currentSenseIndex) ? 'dot active' : 'dot';
        }

        // render tokens
        const tokensContainer = document.getElementById('senses-tokens');
        let tokensHtml = '';
        for (let i = 0; i < step.count; i++) {
            const checkedClass = (i < this.tappedSenses) ? 'checked' : '';
            tokensHtml += `<div class="token ${checkedClass}"><i class="fa-solid fa-check"></i></div>`;
        }
        tokensContainer.innerHTML = tokensHtml;

        // update button
        const btn = document.getElementById('senses-btn');
        if (this.tappedSenses < step.count) {
            btn.innerText = `Got one (${this.tappedSenses}/${step.count})`;
        } else {
            btn.innerText = (this.currentSenseIndex < 4) ? "Next sense" : "I feel steadier";
        }
    },

    senseTap: function () {
        const step = this.sensesData[this.currentSenseIndex];
        if (this.tappedSenses < step.count) {
            this.tappedSenses++;
            this.renderSenses();
            if (navigator.vibrate) navigator.vibrate(20);
        } else {
            // Next step
            if (this.currentSenseIndex < 4) {
                this.currentSenseIndex++;
                this.tappedSenses = 0;
                this.renderSenses();
            } else {
                // finished
                if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
                this.close();
            }
        }
    },

    // ==========================================
    // SURF LOGIC
    // ==========================================
    renderSurf: function () {
        const progress = Math.min(1, this.surfElapsed / this.surfDuration);
        const intensity = Math.sin(progress * Math.PI); // 0 -> 1 -> 0

        // timer text
        const remaining = Math.max(0, this.surfDuration - this.surfElapsed);
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        document.getElementById('surf-timer').innerText = `${m}:${s.toString().padStart(2, '0')}`;

        // wave fill
        document.getElementById('surf-water').style.height = `${intensity * 100}%`;
        document.getElementById('surf-intensity').innerText = `${Math.floor(intensity * 100)}%`;

        // ring progress
        const offset = 283 - (283 * progress);
        document.getElementById('surf-progress-ring').style.strokeDashoffset = offset;

        // phase text
        let phaseLabel = "The urge is rising. Let it, don't fight it.";
        if (progress >= 0.9) phaseLabel = "Almost through. You didn't act on it.";
        else if (progress >= 0.6) phaseLabel = "It's starting to fade. Stay with it.";
        else if (progress >= 0.35) phaseLabel = "Near the peak. Notice it without acting.";

        document.getElementById('surf-label').innerText = phaseLabel;
    },

    toggleSurf: function () {
        if (navigator.vibrate) navigator.vibrate(30);
        this.isSurfing = !this.isSurfing;

        if (this.isSurfing) {
            document.getElementById('surf-btn').innerText = "Pause";
            this.surfInterval = setInterval(() => {
                this.surfElapsed++;
                this.renderSurf();
                if (this.surfElapsed >= this.surfDuration) {
                    this.isSurfing = false;
                    clearInterval(this.surfInterval);
                    document.getElementById('surf-btn').innerText = "Finish";
                    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
                }
            }, 1000);
        } else {
            clearInterval(this.surfInterval);
            document.getElementById('surf-btn').innerText = (this.surfElapsed >= this.surfDuration) ? "Finish" : "Resume";
            if (this.surfElapsed >= this.surfDuration) this.close();
        }
    },

    // ==========================================
    // BREATHE LOGIC
    // ==========================================
    startBreathe: function () {
        const orb = document.getElementById('breathe-orb');
        const text = document.getElementById('breathe-instruction');

        let step = 0; // 0=inhale, 1=hold, 2=exhale, 3=hold

        const tick = () => {
            if (step === 0) {
                text.innerText = "Inhale";
                orb.className = 'breathe-orb';   // clear hold first
                void orb.offsetWidth;            // force reflow so transition re-enables
                orb.className = 'breathe-orb inhale';
            } else if (step === 1) {
                text.innerText = "Hold";
                orb.className = 'breathe-orb inhale hold';
            } else if (step === 2) {
                text.innerText = "Exhale";
                orb.className = 'breathe-orb exhale';
            } else if (step === 3) {
                text.innerText = "Hold";
                orb.className = 'breathe-orb exhale hold';
            }
            step = (step + 1) % 4;
        };


        tick();
        this.breatheInterval = setInterval(tick, 4000);
    }
};

// ==========================================
// 7. NOTIFICATIONS
// ==========================================
function initNotifications() {
    // Check every minute if we need to notify
    setInterval(() => {
        const enabled = localStorage.getItem("klara_notifications_enabled") === "true";
        if (!enabled) return;

        const targetTime = localStorage.getItem("klara_notification_time") || "20:00";
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;

        const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const lastNotified = localStorage.getItem("klara_last_notified_date");

        if (currentTime === targetTime && lastNotified !== todayDate) {
            // It's time!
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Klara", {
                    body: "Time for your daily check-in. Take a moment to reflect on your progress.",
                    icon: "icon.png" // optional, assuming there's an icon
                });
                localStorage.setItem("klara_last_notified_date", todayDate);
            }
        }
    }, 60000);
}

// ==========================================
// 8. PWA SERVICE WORKER
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed: ', err));
    });
}
