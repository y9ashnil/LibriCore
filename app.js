// ============================================================================
// LIBRICORE - CORE APPLICATION LOGIC
// ============================================================================

// ----------------------------------------------------------------------------
// 1. STATE & PERSISTENCE KEY MANAGEMENT
// ----------------------------------------------------------------------------
const STORAGE_KEY_READERS = 'libricore_readers';
const STORAGE_KEY_BOOKS = 'libricore_books';
const STORAGE_KEY_FINES = 'libricore_fines';
const STORAGE_KEY_SESSION = 'libricore_session';

let state = {
    readers: [],
    books: [],
    fines: [],
    currentUser: null // { role: 'librarian' | 'reader', data: readerObject }
};

// ----------------------------------------------------------------------------
// 2. MOCK DATA INITIALIZATION
// ----------------------------------------------------------------------------
const INITIAL_READERS = [
    {
        id: 'read-1',
        username: 'liam',
        name: 'Liam Chen',
        email: 'liam.chen@library.org',
        password: 'password',
        avatarSeed: 'liam',
        booksBorrowed: ['978-0441172719'], // Dune
        historyCount: 4,
        fineBalance: 5.00
    },
    {
        id: 'read-2',
        username: 'maya',
        name: 'Maya Patel',
        email: 'maya.patel@domain.com',
        password: 'password',
        avatarSeed: 'maya',
        booksBorrowed: ['978-05df342138', '978-0062316097'], // Project Hail Mary, Sapiens
        historyCount: 12,
        fineBalance: 0.00
    },
    {
        id: 'read-3',
        username: 'alex',
        name: 'Alex Rivera',
        email: 'alex.rivera@edu.com',
        password: 'password',
        avatarSeed: 'alex',
        booksBorrowed: [],
        historyCount: 2,
        fineBalance: 12.50
    }
];

const INITIAL_BOOKS = [
    {
        isbn: '978-0441172719',
        title: 'Dune',
        author: 'Frank Herbert',
        genre: 'Science Fiction',
        borrowedBy: 'read-1',
        borrowedDate: '2026-06-25T10:30:00.000Z'
    },
    {
        isbn: '978-05df342138',
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        genre: 'Science Fiction',
        borrowedBy: 'read-2',
        borrowedDate: '2026-07-01T14:15:00.000Z'
    },
    {
        isbn: '978-0062316097',
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        genre: 'History',
        borrowedBy: 'read-2',
        borrowedDate: '2026-06-28T09:00:00.000Z'
    },
    {
        isbn: '978-0618640157',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        genre: 'Fantasy',
        borrowedBy: null,
        borrowedDate: null
    },
    {
        isbn: '978-0399590504',
        title: 'Educated',
        author: 'Tara Westover',
        genre: 'Biography',
        borrowedBy: null,
        borrowedDate: null
    },
    {
        isbn: '978-1501135910',
        title: 'Steve Jobs',
        author: 'Walter Isaacson',
        genre: 'Biography',
        borrowedBy: null,
        borrowedDate: null
    },
    {
        isbn: '978-0747532743',
        title: "Harry Potter and the Philosopher's Stone",
        author: 'J.K. Rowling',
        genre: 'Fantasy',
        borrowedBy: null,
        borrowedDate: null
    },
    {
        isbn: '978-1451673319',
        title: 'Fahrenheit 451',
        author: 'Ray Bradbury',
        genre: 'Fiction',
        borrowedBy: null,
        borrowedDate: null
    }
];

const INITIAL_FINES = [
    {
        id: 'fine-1',
        readerId: 'read-1',
        readerName: 'Liam Chen',
        amount: 5.00,
        reason: 'Late Return Penalty',
        date: '2026-06-20',
        status: 'unpaid'
    },
    {
        id: 'fine-2',
        readerId: 'read-3',
        readerName: 'Alex Rivera',
        amount: 7.50,
        reason: 'Damaged Book Sleeve',
        date: '2026-06-18',
        status: 'unpaid'
    },
    {
        id: 'fine-3',
        readerId: 'read-3',
        readerName: 'Alex Rivera',
        amount: 5.00,
        reason: 'Late Return Penalty',
        date: '2026-06-24',
        status: 'unpaid'
    }
];

// Load and save state
async function loadState() {
    try {
        const res = await fetch('/api/state');
        const data = await res.json();
        state.readers = data.readers;
        state.books = data.books;
        state.fines = data.fines;
        
        const rawSession = sessionStorage.getItem('libricore_session');
        if (rawSession) {
            state.currentUser = JSON.parse(rawSession);
        } else {
            state.currentUser = null;
        }
    } catch (e) {
        console.error('Failed to load state from backend:', e);
    }
}

function saveStateToStorage() {
    // Session and database state are managed on the backend.
}

// ----------------------------------------------------------------------------
// 3. AVATAR SVG GENERATOR SYSTEM
// ----------------------------------------------------------------------------
/**
 * Hashes a string seed to generate consistent numbers
 */
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

/**
 * Generates a premium geometric avatar SVG markup
 */
function generateAvatarSVG(seed, initials = '') {
    const hash = hashCode(seed);
    
    // Curated gradient pairs (highly premium neon/deep colors)
    const colorPairs = [
        ['#4f46e5', '#06b6d4'], // Indigo -> Cyan
        ['#7c3aed', '#ec4899'], // Violet -> Pink
        ['#059669', '#10b981'], // Emerald -> Green
        ['#ea580c', '#eab308'], // Orange -> Yellow
        ['#db2777', '#f43f5e'], // Pink -> Rose
        ['#2563eb', '#3b82f6'], // Blue -> Light Blue
        ['#9333ea', '#6366f1']  // Purple -> Indigo
    ];
    
    const pairIndex = hash % colorPairs.length;
    const [color1, color2] = colorPairs[pairIndex];
    
    // Pick an overlay shape pattern
    const patternType = hash % 4;
    let svgOverlay = '';
    
    if (patternType === 0) {
        // Overlay circle + rings
        svgOverlay = `
            <circle cx="50" cy="50" r="32" fill="none" stroke="white" stroke-width="1.5" opacity="0.15" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="white" stroke-width="1" opacity="0.08" />
            <path d="M25 50 A25 25 0 0 1 75 50" fill="none" stroke="white" stroke-width="2" stroke-dasharray="4 4" opacity="0.3" />
        `;
    } else if (patternType === 1) {
        // Rotating intersecting squares
        svgOverlay = `
            <rect x="25" y="25" width="50" height="50" fill="none" stroke="white" stroke-width="1.5" opacity="0.15" transform="rotate(45, 50, 50)" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="1" opacity="0.08" />
        `;
    } else if (patternType === 2) {
        // Abstract wave lines
        svgOverlay = `
            <path d="M 0 40 Q 25 20 50 40 T 100 40" fill="none" stroke="white" stroke-width="2" opacity="0.2" />
            <path d="M 0 60 Q 25 40 50 60 T 100 60" fill="none" stroke="white" stroke-width="2" opacity="0.1" />
            <path d="M 0 50 Q 25 70 50 50 T 100 50" fill="none" stroke="white" stroke-width="1.5" opacity="0.15" />
        `;
    } else {
        // Concentric geometric shapes
        svgOverlay = `
            <polygon points="50,15 80,75 20,75" fill="none" stroke="white" stroke-width="1.5" opacity="0.15" />
            <circle cx="50" cy="55" r="22" fill="none" stroke="white" stroke-width="1" opacity="0.1" />
        `;
    }

    // Clean initials format
    const displayInitials = initials.slice(0, 2).toUpperCase();

    // Full SVG String
    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
                <linearGradient id="grad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${color1}" />
                    <stop offset="100%" stop-color="${color2}" />
                </linearGradient>
            </defs>
            <!-- Background circle with gradient -->
            <circle cx="50" cy="50" r="50" fill="url(#grad-${hash})" />
            
            <!-- Pattern Overlay -->
            ${svgOverlay}
            
            <!-- Initials Text -->
            <text x="50%" y="54%" 
                  dominant-baseline="middle" 
                  text-anchor="middle" 
                  fill="white" 
                  font-family="'Outfit', sans-serif" 
                  font-weight="700" 
                  font-size="34px" 
                  letter-spacing="-0.03em"
                  style="text-shadow: 0 4px 10px rgba(0, 0, 0, 0.15)">
                ${displayInitials || 'LC'}
            </text>
        </svg>
    `;
}

// ----------------------------------------------------------------------------
// 4. TOAST NOTIFICATIONS ENGINE
// ----------------------------------------------------------------------------
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Choose icon
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-message">${message}</div>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    // Dismiss listener
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 300);
    });

    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('toast-fade-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ----------------------------------------------------------------------------
// 5. VIEW NAVIGATION & LOGIN ROUTER
// ----------------------------------------------------------------------------
const views = {
    login: document.getElementById('login-view'),
    librarian: document.getElementById('librarian-view'),
    reader: document.getElementById('reader-view'),
    header: document.getElementById('app-header')
};

function switchView(viewName) {
    // Hide all main portal views
    views.login.classList.add('hidden');
    views.librarian.classList.add('hidden');
    views.reader.classList.add('hidden');
    views.header.classList.add('hidden');

    if (viewName === 'login') {
        views.login.classList.remove('hidden');
    } else if (viewName === 'librarian') {
        views.librarian.classList.remove('hidden');
        views.header.classList.remove('hidden');
        renderLibrarianHeader();
        switchTab('lib-dashboard');
        renderLibrarianDashboard();
    } else if (viewName === 'reader') {
        views.reader.classList.remove('hidden');
        views.header.classList.remove('hidden');
        renderReaderHeader();
        switchTab('read-dashboard');
        renderReaderDashboard();
    }
}

// Sidebar tab switches
function initTabNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    // Determine context (lib or read)
    const isLib = tabId.startsWith('lib-');
    const parentContainer = isLib ? views.librarian : views.reader;

    // Remove active state from current group of sidebar buttons
    parentContainer.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    // Deactivate all tab sections in this parent
    parentContainer.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

    // Activate selected button and section
    const activeBtn = parentContainer.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add('active');
        // Render triggers when accessing specific tabs
        if (tabId === 'lib-readers') renderReadersTable();
        if (tabId === 'lib-books') renderBooksTableLibrarian();
        if (tabId === 'lib-dashboard') renderLibrarianDashboard();
        if (tabId === 'read-dashboard') renderReaderDashboard();
        if (tabId === 'read-catalog') renderReaderCatalog();
        if (tabId === 'read-fines') renderReaderFinesTable();
    }
}

// Render header states
function renderLibrarianHeader() {
    document.getElementById('header-avatar').innerHTML = generateAvatarSVG('librarian', 'LB');
    document.getElementById('header-user-name').innerText = 'Sophia Vance (Admin)';
    document.getElementById('header-user-role').innerText = 'Librarian';
}

function renderReaderHeader() {
    if (!state.currentUser || state.currentUser.role !== 'reader') return;
    const reader = state.currentUser.data;
    
    // Get initials
    const initials = reader.name.split(' ').map(n => n[0]).join('');
    document.getElementById('header-avatar').innerHTML = generateAvatarSVG(reader.avatarSeed, initials);
    document.getElementById('header-user-name').innerText = reader.name;
    document.getElementById('header-user-role').innerText = `Reader Account`;
}

// Login Actions
async function handleLibrarianLogin(username, password) {
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'librarian', username, password })
        });
        const data = await res.json();
        if (data.success) {
            state.currentUser = data.session;
            sessionStorage.setItem('libricore_session', JSON.stringify(state.currentUser));
            showToast('Librarian session authorized successfully.', 'success');
            switchView('librarian');
            await loadState();
            renderLibrarianDashboard();
        } else {
            showToast(data.message || 'Invalid librarian credentials.', 'error');
        }
    } catch (e) {
        showToast('Server communication error.', 'error');
    }
}

async function handleReaderLogin(username, password) {
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'reader', username, password })
        });
        const data = await res.json();
        if (data.success) {
            state.currentUser = data.session;
            sessionStorage.setItem('libricore_session', JSON.stringify(state.currentUser));
            showToast(`Welcome back, ${state.currentUser.data.name}!`, 'success');
            switchView('reader');
            await loadState();
            renderReaderDashboard();
        } else {
            showToast(data.message || 'Invalid credentials.', 'error');
        }
    } catch (e) {
        showToast('Server communication error.', 'error');
    }
}

async function handleProfileSelectLogin(readerId) {
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'reader', readerId })
        });
        const data = await res.json();
        if (data.success) {
            state.currentUser = data.session;
            sessionStorage.setItem('libricore_session', JSON.stringify(state.currentUser));
            showToast(`Signed in as ${state.currentUser.data.name}`, 'success');
            switchView('reader');
            await loadState();
            renderReaderDashboard();
        } else {
            showToast(data.message || 'Failed to select profile.', 'error');
        }
    } catch (e) {
        showToast('Server communication error.', 'error');
    }
}

async function handleLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
        console.error('Logout request failed:', e);
    }
    state.currentUser = null;
    sessionStorage.removeItem('libricore_session');
    showToast('Logged out of session.', 'info');
    
    // Reset login forms
    document.getElementById('reader-username').value = '';
    document.getElementById('reader-password').value = '';
    document.getElementById('librarian-username').value = 'librarian';
    document.getElementById('librarian-password').value = 'password';
    
    switchView('login');
    await loadState();
    renderLoginProfiles();
}

// Render the profiles switch box in Login view
function renderLoginProfiles() {
    const grid = document.getElementById('reader-profiles-grid');
    grid.innerHTML = '';
    
    state.readers.slice(0, 3).forEach(reader => {
        const initials = reader.name.split(' ').map(n => n[0]).join('');
        const avatarSvg = generateAvatarSVG(reader.avatarSeed, initials);
        
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.dataset.id = reader.id;
        card.innerHTML = `
            <div class="profile-avatar-box">${avatarSvg}</div>
            <div class="profile-name">${reader.name}</div>
        `;
        
        card.addEventListener('click', () => handleProfileSelectLogin(reader.id));
        grid.appendChild(card);
    });
}

// ----------------------------------------------------------------------------
// 6. LIBRARIAN PORTAL ENGINE
// ----------------------------------------------------------------------------

function renderLibrarianDashboard() {
    // 1. Calculate values
    const totalReaders = state.readers.length;
    const borrowedBooks = state.books.filter(b => b.borrowedBy !== null).length;
    
    const unpaidFinesTotal = state.fines
        .filter(f => f.status === 'unpaid')
        .reduce((sum, f) => sum + parseFloat(f.amount), 0);

    // Update displays
    document.getElementById('stat-total-readers').innerText = totalReaders;
    document.getElementById('stat-borrowed-books').innerText = borrowedBooks;
    document.getElementById('stat-outstanding-fines').innerText = `₹${unpaidFinesTotal.toFixed(2)}`;

    // Recent fines list
    const finesBody = document.getElementById('lib-recent-fines-body');
    finesBody.innerHTML = '';
    
    const recentFines = [...state.fines].reverse().slice(0, 5);
    if (recentFines.length === 0) {
        finesBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No fines levied in log database.</td></tr>`;
    } else {
        recentFines.forEach(fine => {
            const tr = document.createElement('tr');
            const statusClass = fine.status === 'paid' ? 'badge-green' : 'badge-red';
            tr.innerHTML = `
                <td><strong>${fine.readerName}</strong></td>
                <td>${fine.reason}</td>
                <td><span class="text-green font-semibold">₹${parseFloat(fine.amount).toFixed(2)}</span></td>
                <td><span class="badge ${statusClass}">${fine.status}</span></td>
            `;
            finesBody.appendChild(tr);
        });
    }

    // Active Borrowings list
    const borrowBody = document.getElementById('lib-recent-borrowings-body');
    borrowBody.innerHTML = '';
    
    const activeBorrowings = state.books.filter(b => b.borrowedBy !== null);
    if (activeBorrowings.length === 0) {
        borrowBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No books currently checked out.</td></tr>`;
    } else {
        activeBorrowings.forEach(book => {
            const readerObj = state.readers.find(r => r.id === book.borrowedBy);
            const readerName = readerObj ? readerObj.name : 'Unknown Reader';
            const dateStr = new Date(book.borrowedDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${book.title}</strong><br><span class="text-muted text-sm">${book.author}</span></td>
                <td>${readerName}</td>
                <td>${dateStr}</td>
            `;
            borrowBody.appendChild(tr);
        });
    }
}

function renderReadersTable() {
    const tbody = document.getElementById('lib-readers-table-body');
    tbody.innerHTML = '';
    
    if (state.readers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No readers registered in library ecosystem.</td></tr>`;
        return;
    }

    state.readers.forEach(reader => {
        const initials = reader.name.split(' ').map(n => n[0]).join('');
        const avatarSvg = generateAvatarSVG(reader.avatarSeed, initials);
        const outstandingFine = parseFloat(reader.fineBalance || 0);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="table-profile-cell">
                    <div class="user-avatar-small">${avatarSvg}</div>
                    <div class="table-profile-info">
                        <span class="table-profile-name">${reader.name}</span>
                        <span class="table-profile-email">${reader.email}</span>
                    </div>
                </div>
            </td>
            <td><code>${reader.username}</code></td>
            <td>${reader.email}</td>
            <td><span class="badge badge-purple">${reader.booksBorrowed.length} books</span></td>
            <td><span class="${outstandingFine > 0 ? 'text-red font-semibold' : 'text-green'}">₹${outstandingFine.toFixed(2)}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-secondary btn-xs btn-levy-fine" data-id="${reader.id}">💸 Fine</button>
                    <button class="btn btn-red btn-xs btn-remove-reader" data-id="${reader.id}">❌ Delete</button>
                </div>
            </td>
        `;

        // Wire Actions
        tr.querySelector('.btn-levy-fine').addEventListener('click', () => openLevyFineModal(reader.id));
        tr.querySelector('.btn-remove-reader').addEventListener('click', () => removeReader(reader.id));

        tbody.appendChild(tr);
    });
}

function renderBooksTableLibrarian() {
    const tbody = document.getElementById('lib-books-table-body');
    tbody.innerHTML = '';

    state.books.forEach(book => {
        const isBorrowed = book.borrowedBy !== null;
        let borrowerCell = '<span class="text-muted">—</span>';
        let statusBadge = '<span class="badge badge-green">Available</span>';

        if (isBorrowed) {
            const borrowerObj = state.readers.find(r => r.id === book.borrowedBy);
            const borrowerName = borrowerObj ? borrowerObj.name : 'Unknown';
            borrowerCell = `<strong>${borrowerName}</strong>`;
            statusBadge = '<span class="badge badge-purple">On Loan</span>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${book.title}</strong><br>
                <span class="text-muted text-sm">${book.author}</span>
            </td>
            <td><code>${book.isbn}</code></td>
            <td><span class="badge badge-cyan">${book.genre}</span></td>
            <td>${statusBadge}</td>
            <td>${borrowerCell}</td>
            <td>
                <div class="table-actions">
                    ${isBorrowed ? `<button class="btn btn-secondary btn-xs btn-force-return" data-isbn="${book.isbn}">Force Return</button>` : `<span class="text-muted text-xs">No Loan Actions</span>`}
                </div>
            </td>
        `;

        if (isBorrowed) {
            tr.querySelector('.btn-force-return').addEventListener('click', () => forceReturnBook(book.isbn));
        }

        tbody.appendChild(tr);
    });
}

// ----------------------------------------------------------------------------
// 7. LIBRARIAN TRANSACTIONS (ADD/REMOVE READER, ASSESS FINES)
// ----------------------------------------------------------------------------

async function registerNewReader(name, username, email, password, avatarSeed) {
    try {
        const res = await fetch('/api/readers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, email, password, avatarSeed })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Registered reader account for ${name}.`, 'success');
            await loadState();
            renderReadersTable();
            closeModal('modal-add-reader');
            return true;
        } else {
            showToast(data.message || 'Failed to register reader.', 'error');
            return false;
        }
    } catch (e) {
        showToast('Server communication error.', 'error');
        return false;
    }
}

async function removeReader(readerId) {
    const reader = state.readers.find(r => r.id === readerId);
    if (!reader) return;

    if (confirm(`Are you absolutely sure you want to delete ${reader.name}'s library account?\nAny current book borrowings will be checked back into the system.`)) {
        try {
            const res = await fetch(`/api/readers/${readerId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Successfully deleted reader profile: ${reader.name}.`, 'success');
                await loadState();
                renderReadersTable();
                renderLibrarianDashboard();
            } else {
                showToast(data.message || 'Failed to delete reader.', 'error');
            }
        } catch (e) {
            showToast('Server communication error.', 'error');
        }
    }
}

async function forceReturnBook(isbn) {
    try {
        const res = await fetch('/api/books/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isbn })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Title '${data.book.title}' has been successfully checked in.`, 'success');
            await loadState();
            renderBooksTableLibrarian();
            renderLibrarianDashboard();
        } else {
            showToast(data.message || 'Failed to return book.', 'error');
        }
    } catch (e) {
        showToast('Server communication error.', 'error');
    }
}

async function levyPenaltyFine(readerId, amount, reason) {
    try {
        const res = await fetch('/api/fines/levy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ readerId, amount: parseFloat(amount), reason })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Levied ₹${parseFloat(amount).toFixed(2)} fine.`, 'warning');
            await loadState();
            closeModal('modal-levy-fine');
            renderReadersTable();
            renderLibrarianDashboard();
        } else {
            showToast(data.message || 'Failed to levy fine.', 'error');
        }
    } catch (e) {
        showToast('Server communication error.', 'error');
    }
}

async function registerNewBook(title, author, genre, isbn) {
    try {
        const res = await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author, genre, isbn })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Successfully cataloged title: '${title}'`, 'success');
            await loadState();
            renderBooksTableLibrarian();
            closeModal('modal-add-book');
            return true;
        } else {
            showToast(data.message || 'Failed to catalog book.', 'error');
            return false;
        }
    } catch (e) {
        showToast('Server communication error.', 'error');
        return false;
    }
}

// Modals Trigger Handlers (Librarian)
function openLevyFineModal(readerId) {
    const reader = state.readers.find(r => r.id === readerId);
    if (!reader) return;

    document.getElementById('fine-reader-id').value = readerId;
    document.getElementById('fine-receiver-name').innerText = reader.name;
    document.getElementById('fine-receiver-email').innerText = reader.email;
    
    const initials = reader.name.split(' ').map(n => n[0]).join('');
    document.getElementById('fine-receiver-avatar').innerHTML = generateAvatarSVG(reader.avatarSeed, initials);
    
    // Reset form values
    document.getElementById('fine-amount').value = '5.00';
    document.getElementById('fine-reason').value = 'Late Return Penalty';
    document.getElementById('custom-fine-reason-container').classList.add('hidden');
    document.getElementById('fine-reason-custom').removeAttribute('required');

    openModal('modal-levy-fine');
}

// ----------------------------------------------------------------------------
// 8. READER PORTAL ENGINE
// ----------------------------------------------------------------------------

function renderReaderDashboard() {
    if (!state.currentUser || state.currentUser.role !== 'reader') return;
    const readerId = state.currentUser.data.id;
    
    // Sync reader state
    const reader = state.readers.find(r => r.id === readerId);
    if (!reader) return;

    // Refresh greeting name
    document.getElementById('reader-welcome-name').innerText = reader.name.split(' ')[0];

    // Compute stats
    const borrowedCount = reader.booksBorrowed.length;
    const returnedCount = reader.historyCount || 0;
    const takenCount = borrowedCount + returnedCount;
    const fineBalance = parseFloat(reader.fineBalance || 0);

    document.getElementById('reader-stat-taken').innerText = takenCount;
    document.getElementById('reader-stat-borrowed').innerText = borrowedCount;
    document.getElementById('reader-stat-returned').innerText = returnedCount;
    document.getElementById('reader-stat-fines').innerText = `₹${fineBalance.toFixed(2)}`;

    // Render outstanding balance boxes
    const standingCard = document.getElementById('reader-standing-card');
    const standingFineBox = document.getElementById('reader-standing-fine-box');
    const payShortcutBtn = document.getElementById('btn-pay-fines-shortcut');

    if (fineBalance > 0) {
        standingCard.classList.add('hidden');
        standingFineBox.classList.remove('hidden');
        document.getElementById('reader-standing-fine-amount').innerText = `₹${fineBalance.toFixed(2)}`;
    } else {
        standingCard.classList.remove('hidden');
        standingFineBox.classList.add('hidden');
    }

    // Render borrowed books list
    const listContainer = document.getElementById('reader-borrowed-list');
    listContainer.innerHTML = '';

    const borrowedItems = state.books.filter(b => b.borrowedBy === readerId);
    if (borrowedItems.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center text-muted py-6">
                <span class="block text-2xl mb-2">📚</span>
                <p class="text-sm">You have no active borrowings. Search the catalogue to loan a book!</p>
            </div>
        `;
    } else {
        borrowedItems.forEach(book => {
            const loanDate = new Date(book.borrowedDate);
            // Dynamic fake return date (e.g. 14 days later)
            const dueDate = new Date(loanDate.getTime() + (14 * 24 * 60 * 60 * 1000));
            const isOverdue = new Date() > dueDate;
            
            const card = document.createElement('div');
            card.className = 'borrowed-book-card';
            card.innerHTML = `
                <div class="borrowed-book-details">
                    <span class="borrowed-book-title">${book.title}</span>
                    <span class="borrowed-book-author">${book.author}</span>
                    <span class="borrowed-book-date ${isOverdue ? 'text-red font-semibold' : ''}">
                        Due: ${dueDate.toLocaleDateString()} ${isOverdue ? '(OVERDUE)' : ''}
                    </span>
                </div>
                <button class="btn btn-secondary btn-xs btn-return-book" data-isbn="${book.isbn}">Return Title</button>
            `;
            
            card.querySelector('.btn-return-book').addEventListener('click', () => readerReturnBook(book.isbn));
            listContainer.appendChild(card);
        });
    }
}

function renderReaderCatalog() {
    const grid = document.getElementById('reader-book-grid');
    grid.innerHTML = '';

    const searchQuery = document.getElementById('catalog-search').value.toLowerCase();
    const genreFilter = document.getElementById('catalog-genre-filter').value;

    const filteredBooks = state.books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery) || 
                              book.author.toLowerCase().includes(searchQuery) ||
                              book.isbn.includes(searchQuery);
        const matchesGenre = genreFilter === 'all' || book.genre === genreFilter;
        return matchesSearch && matchesGenre;
    });

    if (filteredBooks.length === 0) {
        grid.innerHTML = `
            <div class="col-span-2 text-center text-muted py-12">
                <span class="block text-3xl mb-3">🔍</span>
                <p>No books match your criteria in the library inventory.</p>
            </div>
        `;
        return;
    }

    filteredBooks.forEach(book => {
        const isBorrowed = book.borrowedBy !== null;
        let actionBtn = '';

        if (isBorrowed) {
            if (state.currentUser && book.borrowedBy === state.currentUser.data.id) {
                actionBtn = `<button class="btn btn-secondary btn-xs" disabled>Checked Out by You</button>`;
            } else {
                actionBtn = `<button class="btn btn-secondary btn-xs" disabled>Unavailable (Loaned)</button>`;
            }
        } else {
            actionBtn = `<button class="btn btn-primary btn-xs btn-loan-action" data-isbn="${book.isbn}">Borrow</button>`;
        }

        const genreClass = book.genre.toLowerCase().replace(/\s+/g, '-');

        const card = document.createElement('div');
        card.className = `book-card glass-panel ${genreClass}`;
        card.innerHTML = `
            <div class="book-card-header">
                <span class="book-genre-tag">${book.genre}</span>
            </div>
            <h4 class="book-card-title">${book.title}</h4>
            <p class="book-card-author">${book.author}</p>
            <div class="book-card-footer">
                <span class="book-isbn">${book.isbn}</span>
                ${actionBtn}
            </div>
        `;

        if (!isBorrowed) {
            card.querySelector('.btn-loan-action').addEventListener('click', () => readerBorrowBook(book.isbn));
        }

        grid.appendChild(card);
    });
}

function renderReaderFinesTable() {
    if (!state.currentUser || state.currentUser.role !== 'reader') return;
    const readerId = state.currentUser.data.id;
    const reader = state.readers.find(r => r.id === readerId);
    if (!reader) return;

    const tbody = document.getElementById('reader-fines-table-body');
    tbody.innerHTML = '';

    const readerFines = state.fines.filter(f => f.readerId === readerId);
    const payMainBtn = document.getElementById('btn-pay-fines-main');

    // Show/hide main pay fine header button
    const fineBalance = parseFloat(reader.fineBalance || 0);
    if (fineBalance > 0) {
        payMainBtn.classList.remove('hidden');
    } else {
        payMainBtn.classList.add('hidden');
    }

    if (readerFines.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">You have no fines on your account ledger! Keep up the good work.</td></tr>`;
        return;
    }

    // Sort: unpaid first, then date desc
    const sortedFines = [...readerFines].sort((a,b) => {
        if (a.status === 'unpaid' && b.status === 'paid') return -1;
        if (a.status === 'paid' && b.status === 'unpaid') return 1;
        return new Date(b.date) - new Date(a.date);
    });

    sortedFines.forEach(fine => {
        const statusBadge = fine.status === 'paid' ? 
            `<span class="badge badge-green">Paid</span>` : 
            `<span class="badge badge-red">Unpaid</span>`;
            
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>#${fine.id.slice(-6)}</code></td>
            <td>${fine.date}</td>
            <td>${fine.reason}</td>
            <td><strong class="text-green">₹${parseFloat(fine.amount).toFixed(2)}</strong></td>
            <td>${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ----------------------------------------------------------------------------
// 9. READER TRANSACTIONS (BORROW, RETURN, PAY FINE)
// ----------------------------------------------------------------------------

async function readerBorrowBook(isbn) {
    if (!state.currentUser || state.currentUser.role !== 'reader') return;
    const readerId = state.currentUser.data.id;
    
    try {
        const res = await fetch('/api/books/borrow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isbn, readerId })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Successfully borrowed '${data.book.title}'. Checked out under 14-day policy.`, 'success');
            await loadState();
            renderReaderCatalog();
            renderReaderDashboard();
        } else {
            showToast(data.message || 'Failed to borrow book.', 'error');
        }
    } catch (e) {
        showToast('Server communication error.', 'error');
    }
}

async function readerReturnBook(isbn) {
    if (!state.currentUser || state.currentUser.role !== 'reader') return;
    
    try {
        const res = await fetch('/api/books/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isbn })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`You have checked back: '${data.book.title}'. Thank you!`, 'success');
            await loadState();
            renderReaderDashboard();
        } else {
            showToast(data.message || 'Failed to return book.', 'error');
        }
    } catch (e) {
        showToast('Server communication error.', 'error');
    }
}

async function handlePayFineProcess(cardholder, cardnumber) {
    if (!state.currentUser || state.currentUser.role !== 'reader') return;
    const readerId = state.currentUser.data.id;
    
    // Transition modal views to "Processing"
    document.getElementById('payment-gate-screen').classList.add('hidden');
    document.getElementById('payment-processing-screen').classList.remove('hidden');

    try {
        const res = await fetch('/api/fines/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ readerId })
        });
        const data = await res.json();
        
        // Mock processing visual delay for premium feel
        setTimeout(async () => {
            if (data.success) {
                await loadState();
                // Transition to success screen
                document.getElementById('payment-processing-screen').classList.add('hidden');
                document.getElementById('payment-success-screen').classList.remove('hidden');
                
                showToast('Payment successful! Your library account is cleared.', 'success');
                
                // Refresh portal elements
                renderReaderDashboard();
                renderReaderFinesTable();
            } else {
                document.getElementById('payment-processing-screen').classList.add('hidden');
                document.getElementById('payment-gate-screen').classList.remove('hidden');
                showToast(data.message || 'Payment authentication failed.', 'error');
            }
        }, 2000);
    } catch (e) {
        document.getElementById('payment-processing-screen').classList.add('hidden');
        document.getElementById('payment-gate-screen').classList.remove('hidden');
        showToast('Server communication error during transaction.', 'error');
    }
}

// ----------------------------------------------------------------------------
// 10. MODAL DIALOGS CONTROLLER
// ----------------------------------------------------------------------------
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // block page scrolling
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // restore scrolling
        
        // Reset specific payment screens if it's the payment modal
        if (modalId === 'modal-payment') {
            setTimeout(() => {
                document.getElementById('payment-gate-screen').classList.remove('hidden');
                document.getElementById('payment-processing-screen').classList.add('hidden');
                document.getElementById('payment-success-screen').classList.add('hidden');
                document.getElementById('form-pay-fine').reset();
            }, 300);
        }
    }
}

function initModalTriggers() {
    // Bind all close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetModal = btn.getAttribute('data-close');
            closeModal(targetModal);
        });
    });

    // Close on overlay clicks
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });

    // ESC key closes modals
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

// ----------------------------------------------------------------------------
// 11. BOOTSTRAP INITIALIZATION AND DOM LISTENERS
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial State Load
    await loadState();

    // 2. Initialize UI Triggers & Routing
    initTabNavigation();
    initModalTriggers();
    renderLoginProfiles();

    // Determine startup view
    if (state.currentUser) {
        if (state.currentUser.role === 'librarian') {
            switchView('librarian');
        } else {
            // Need to sync data with latest state in case username was edited
            const activeReader = state.readers.find(r => r.id === state.currentUser.data.id);
            if (activeReader) {
                state.currentUser.data = activeReader;
                switchView('reader');
            } else {
                state.currentUser = null;
                switchView('login');
            }
        }
    } else {
        switchView('login');
    }

    // 3. Login Forms Actions
    // Role Tab Switches
    document.querySelectorAll('.role-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetRole = tab.getAttribute('data-role');
            if (targetRole === 'reader') {
                document.getElementById('reader-login-form').classList.add('active');
                document.getElementById('librarian-login-form').classList.remove('active');
            } else {
                document.getElementById('reader-login-form').classList.remove('active');
                document.getElementById('librarian-login-form').classList.add('active');
            }
        });
    });

    // Reader login submit
    document.getElementById('reader-credentials-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('reader-username').value.trim();
        const password = document.getElementById('reader-password').value;
        if (username) handleReaderLogin(username, password);
    });

    // Librarian login submit
    document.getElementById('librarian-credentials-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('librarian-username').value.trim();
        const password = document.getElementById('librarian-password').value;
        handleLibrarianLogin(username, password);
    });

    // Logout trigger
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // 4. Librarian Portal Controls
    // Add Reader triggers
    document.getElementById('btn-open-add-reader').addEventListener('click', () => {
        document.getElementById('form-add-reader').reset();
        document.getElementById('new-reader-seed').value = Math.random().toString(36).substring(7);
        // Trigger initial avatar preview in form
        updateAddReaderAvatarPreview();
        openModal('modal-add-reader');
    });

    // Avatar seed preview renderer
    const seedInput = document.getElementById('new-reader-seed');
    seedInput.addEventListener('input', updateAddReaderAvatarPreview);
    
    function updateAddReaderAvatarPreview() {
        const seedVal = seedInput.value.trim() || 'seed';
        const nameVal = document.getElementById('new-reader-name').value.trim() || 'New';
        const initials = nameVal.split(' ').map(n => n[0]).join('');
        document.getElementById('new-reader-avatar-preview').innerHTML = generateAvatarSVG(seedVal, initials);
    }
    
    document.getElementById('new-reader-name').addEventListener('input', updateAddReaderAvatarPreview);

    document.getElementById('form-add-reader').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-reader-name').value.trim();
        const username = document.getElementById('new-reader-username').value.trim();
        const email = document.getElementById('new-reader-email').value.trim();
        const password = document.getElementById('new-reader-password').value;
        const seed = document.getElementById('new-reader-seed').value.trim();

        registerNewReader(name, username, email, password, seed);
    });

    // Book Levy Modal triggers
    document.getElementById('btn-open-add-book').addEventListener('click', () => {
        document.getElementById('form-add-book').reset();
        openModal('modal-add-book');
    });

    document.getElementById('form-add-book').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('new-book-title').value.trim();
        const author = document.getElementById('new-book-author').value.trim();
        const genre = document.getElementById('new-book-genre').value;
        const isbn = document.getElementById('new-book-isbn').value.trim();

        registerNewBook(title, author, genre, isbn);
    });

    // Fine Levy Submission triggers
    document.getElementById('fine-reason').addEventListener('change', (e) => {
        const customContainer = document.getElementById('custom-fine-reason-container');
        const customInput = document.getElementById('fine-reason-custom');
        if (e.target.value === 'Custom Penalty Charge') {
            customContainer.classList.remove('hidden');
            customInput.setAttribute('required', 'required');
        } else {
            customContainer.classList.add('hidden');
            customInput.removeAttribute('required');
        }
    });

    document.getElementById('form-levy-fine').addEventListener('submit', (e) => {
        e.preventDefault();
        const readerId = document.getElementById('fine-reader-id').value;
        const amount = document.getElementById('fine-amount').value;
        
        let reason = document.getElementById('fine-reason').value;
        if (reason === 'Custom Penalty Charge') {
            reason = document.getElementById('fine-reason-custom').value.trim();
        }

        levyPenaltyFine(readerId, amount, reason);
    });

    // 5. Reader Portal Controls
    // Reader Catalog Search/Filters
    document.getElementById('catalog-search').addEventListener('input', renderReaderCatalog);
    document.getElementById('catalog-genre-filter').addEventListener('change', renderReaderCatalog);

    // Reader Pay Fine triggers
    const triggerPayFineAction = () => {
        if (!state.currentUser || state.currentUser.role !== 'reader') return;
        const reader = state.readers.find(r => r.id === state.currentUser.data.id);
        const amount = parseFloat(reader.fineBalance || 0);
        
        document.getElementById('payment-amount-value').innerText = `₹${amount.toFixed(2)}`;
        document.getElementById('card-holder').value = reader.name;
        openModal('modal-payment');
    };

    document.getElementById('btn-pay-fines-shortcut').addEventListener('click', triggerPayFineAction);
    document.getElementById('btn-pay-fines-main').addEventListener('click', triggerPayFineAction);

    // Pay Fine Process Submission
    document.getElementById('form-pay-fine').addEventListener('submit', (e) => {
        e.preventDefault();
        const cardholder = document.getElementById('card-holder').value.trim();
        const cardnumber = document.getElementById('card-number').value.trim();
        handlePayFineProcess(cardholder, cardnumber);
    });
});
