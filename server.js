const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.json());
// Serve frontend static files
app.use(express.static(__dirname));

// Seed data
const INITIAL_READERS = [
    {
        id: 'read-1',
        username: 'liam',
        name: 'Liam Chen',
        email: 'liam.chen@library.org',
        password: 'password',
        avatarSeed: 'liam',
        booksBorrowed: ['978-0441172719'],
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
        booksBorrowed: ['978-05df342138', '978-0062316097'],
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

// Load database
function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            readers: INITIAL_READERS,
            books: INITIAL_BOOKS,
            fines: INITIAL_FINES,
            currentUser: null
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 4));
        return initialData;
    }
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('Error reading database file, using fallback state', e);
        return { readers: [], books: [], fines: [], currentUser: null };
    }
}

// Save database
function saveDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
}

// Routes
app.get('/api/state', (req, res) => {
    const data = loadDatabase();
    res.json(data);
});

app.post('/api/login', (req, res) => {
    const { username, password, role, readerId } = req.body;
    const data = loadDatabase();

    if (role === 'librarian') {
        if (username === 'librarian' && password === 'password') {
            data.currentUser = { role: 'librarian', data: null };
            saveDatabase(data);
            return res.json({ success: true, session: data.currentUser });
        }
        return res.status(401).json({ success: false, message: 'Invalid librarian credentials.' });
    } else if (role === 'reader') {
        if (readerId) {
            // Profile selection login
            const reader = data.readers.find(r => r.id === readerId);
            if (reader) {
                data.currentUser = { role: 'reader', data: reader };
                saveDatabase(data);
                return res.json({ success: true, session: data.currentUser });
            }
            return res.status(404).json({ success: false, message: 'Reader profile not found.' });
        } else {
            // Credentials login
            const reader = data.readers.find(r => r.username.toLowerCase() === username.toLowerCase());
            if (reader && reader.password === password) {
                data.currentUser = { role: 'reader', data: reader };
                saveDatabase(data);
                return res.json({ success: true, session: data.currentUser });
            }
            return res.status(401).json({ success: false, message: 'Invalid reader credentials.' });
        }
    }
    res.status(400).json({ success: false, message: 'Invalid login role.' });
});

app.post('/api/logout', (req, res) => {
    const data = loadDatabase();
    data.currentUser = null;
    saveDatabase(data);
    res.json({ success: true });
});

app.post('/api/readers', (req, res) => {
    const { username, name, email, password, avatarSeed } = req.body;
    const data = loadDatabase();

    const isDup = data.readers.some(r => r.username.toLowerCase() === username.toLowerCase());
    if (isDup) {
        return res.status(400).json({ success: false, message: 'Username already exists.' });
    }

    const newReader = {
        id: `read-${Date.now()}`,
        username,
        name,
        email,
        password,
        avatarSeed,
        booksBorrowed: [],
        historyCount: 0,
        fineBalance: 0.00
    };

    data.readers.push(newReader);
    saveDatabase(data);
    res.status(201).json({ success: true, reader: newReader });
});

app.delete('/api/readers/:id', (req, res) => {
    const { id } = req.params;
    const data = loadDatabase();

    const readerIndex = data.readers.findIndex(r => r.id === id);
    if (readerIndex === -1) {
        return res.status(404).json({ success: false, message: 'Reader not found.' });
    }

    const reader = data.readers[readerIndex];
    // Return any borrowed books first
    data.books.forEach(b => {
        if (b.borrowedBy === id) {
            b.borrowedBy = null;
            b.borrowedDate = null;
        }
    });

    data.readers.splice(readerIndex, 1);
    
    // Clear session if the deleted reader was logged in
    if (data.currentUser && data.currentUser.role === 'reader' && data.currentUser.data.id === id) {
        data.currentUser = null;
    }

    saveDatabase(data);
    res.json({ success: true, message: `Successfully deleted reader: ${reader.name}` });
});

app.post('/api/books', (req, res) => {
    const { title, author, genre, isbn } = req.body;
    const data = loadDatabase();

    const isDup = data.books.some(b => b.isbn === isbn);
    if (isDup) {
        return res.status(400).json({ success: false, message: 'ISBN already exists.' });
    }

    const newBook = {
        isbn,
        title,
        author,
        genre,
        borrowedBy: null,
        borrowedDate: null
    };

    data.books.push(newBook);
    saveDatabase(data);
    res.status(201).json({ success: true, book: newBook });
});

app.post('/api/books/borrow', (req, res) => {
    const { isbn, readerId } = req.body;
    const data = loadDatabase();

    const reader = data.readers.find(r => r.id === readerId);
    const book = data.books.find(b => b.isbn === isbn);

    if (!reader || !book) {
        return res.status(404).json({ success: false, message: 'Reader or Book not found.' });
    }

    if (book.borrowedBy !== null) {
        return res.status(400).json({ success: false, message: 'Book is already borrowed.' });
    }

    if (parseFloat(reader.fineBalance) > 10.00) {
        return res.status(403).json({ success: false, message: 'Borrowing blocked! Outstanding fines exceed ₹10.00.' });
    }

    book.borrowedBy = readerId;
    book.borrowedDate = new Date().toISOString();
    reader.booksBorrowed.push(isbn);

    // Sync session if active reader is current user
    if (data.currentUser && data.currentUser.role === 'reader' && data.currentUser.data.id === readerId) {
        data.currentUser.data = reader;
    }

    saveDatabase(data);
    res.json({ success: true, book });
});

app.post('/api/books/return', (req, res) => {
    const { isbn } = req.body;
    const data = loadDatabase();

    const book = data.books.find(b => b.isbn === isbn);
    if (!book || !book.borrowedBy) {
        return res.status(400).json({ success: false, message: 'Book not currently borrowed.' });
    }

    const readerId = book.borrowedBy;
    const reader = data.readers.find(r => r.id === readerId);

    book.borrowedBy = null;
    book.borrowedDate = null;

    if (reader) {
        reader.booksBorrowed = reader.booksBorrowed.filter(code => code !== isbn);
        reader.historyCount = (reader.historyCount || 0) + 1;
        // Sync session if active reader is current user
        if (data.currentUser && data.currentUser.role === 'reader' && data.currentUser.data.id === readerId) {
            data.currentUser.data = reader;
        }
    }

    saveDatabase(data);
    res.json({ success: true, book });
});

app.post('/api/fines/levy', (req, res) => {
    const { readerId, amount, reason } = req.body;
    const data = loadDatabase();

    const reader = data.readers.find(r => r.id === readerId);
    if (!reader) {
        return res.status(404).json({ success: false, message: 'Reader not found.' });
    }

    const parsedAmount = parseFloat(amount);
    const fineObj = {
        id: `fine-${Date.now()}`,
        readerId: readerId,
        readerName: reader.name,
        amount: parsedAmount,
        reason: reason,
        date: new Date().toISOString().split('T')[0],
        status: 'unpaid'
    };

    data.fines.push(fineObj);
    reader.fineBalance = (parseFloat(reader.fineBalance) || 0) + parsedAmount;

    // Sync session if active reader is current user
    if (data.currentUser && data.currentUser.role === 'reader' && data.currentUser.data.id === readerId) {
        data.currentUser.data = reader;
    }

    saveDatabase(data);
    res.status(201).json({ success: true, fine: fineObj });
});

app.post('/api/fines/pay', (req, res) => {
    const { readerId } = req.body;
    const data = loadDatabase();

    const reader = data.readers.find(r => r.id === readerId);
    if (!reader) {
        return res.status(404).json({ success: false, message: 'Reader not found.' });
    }

    // Mark all unpaid fines for this reader as paid
    data.fines.forEach(f => {
        if (f.readerId === readerId && f.status === 'unpaid') {
            f.status = 'paid';
        }
    });

    reader.fineBalance = 0.00;

    // Sync session if active reader is current user
    if (data.currentUser && data.currentUser.role === 'reader' && data.currentUser.data.id === readerId) {
        data.currentUser.data = reader;
    }

    saveDatabase(data);
    res.json({ success: true, reader });
});

// Run server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
