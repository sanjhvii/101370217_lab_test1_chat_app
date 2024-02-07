const app = require('express')();
require('dotenv').config();

const http = require('http').createServer(app);
const mongoose = require('mongoose');
const cors = require('cors');
const socketio = require('socket.io');
const io = socketio(http);
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

const User = require("./models/user.js"); 
const Message = require("./models/message");

app.use(cors());

mongoose.connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to Database!!");
}).catch(err => {
    console.log(err);
    console.log("Could not connect to the Database!!");
    process.exit();
})

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.get("/register", (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

app.get("/chat", (req, res) => {
    res.sendFile(__dirname + '/chat.html');
});

app.post('/register', async (req, res) => {
    const newUser = new User({
        username: req.body.username,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        password: req.body.password
    })
    try {
        await newUser.save();
        res.redirect('/chat'); // Redirect to chat page after successful registration
    } catch (err) {
        console.log(err);
        res.redirect('/register');
    }
});

app.post("/", async (req, res) => {
    const uName = req.body.username;
    const pWord = req.body.password;

    if (uName != "" && pWord != "") {
        try {
            const user = await User.findOne({ username: uName });
            if (user && user.password === pWord) {
                res.redirect('/chat');
            } else {
                res.redirect('/');
            }
        } catch (err) {
            console.log(err);
            res.redirect('/');
        }
    }
});

// Socket connection
io.on('connection', socket => {
    console.log("New Socket connected...");

    socket.emit('message', "Welcome to the chat"); // Emitting welcome message to the connected socket

    socket.on('joinRoom', room => {
        socket.join(room);

        socket.on('chatMessage', msg => {
            io.to(room).emit('message', msg); // Emit message to all sockets in the room
            const input_message = new Message({
                from_user: users,
                room: room,
                message: msg
            });
            input_message.save().then(() => {
                console.log('success');
            });

        });
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected...');
    });
});

const PORT = process.env.PORT || 3000; // Updated to use environment variable or default to 3000

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});
