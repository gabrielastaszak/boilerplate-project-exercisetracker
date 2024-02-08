const express = require('express')
const app = express()
const cors = require('cors')

//podłączenie do bazy danych

require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(() => console.log("Connected to the database")).catch(err => console.error('Error connecting to the database:', err));

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  }
}, {
  versionKey: false 
});
const User = mongoose.model("User", userSchema);

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number, 
  date: Date,
  userId: String
}, {
  versionKey: false 
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors())
//to dodajemy, żeby zadziałało app.post:
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//The GET request to /api/users returns an array.
app.get('/api/users', async (req, res) =>{
 const users = await User.find();
  res.send(users);
})

//POST to /api/users name ='username'
app.post('/api/users', async (req, res) => {
 const username = req.body.username;

  const FoundUser = await User.findOne({ username });

  if (FoundUser) {
    res.json(FoundUser);
  }
  
const user = await User.create({
  username
});
res.json(user);

}) 

//GET request to /api/users/:_id/logs
/*
{
  username: "fcc_test",
  count: 1,
  _id: "5fb5853f734231456ccb3b05",
  log: [{
    description: "test",
    duration: 60,
    date: "Mon Jan 01 1990",
  }]
}
*/

app.get('/api/users/:_id/logs', async (req, res) => {
  let { from, to, limit } = req.query;
  const userId = req.params._id;
  const foundUser = await User.findById(userId);
  if (!foundUser) {
    return res.status(404).json({ message: "No user exists for that id" });
  }

  let filter = { userId: userId }; 
  let dateFilter = {};
  if (from) {
    dateFilter["$gte"] = new Date(from);
  }
  if (to) {
    dateFilter["$lte"] = new Date(to);
  }

  if (from || to) {
    filter.date = dateFilter;
  }

  let query = Exercise.find(filter);
  if (limit) {
    query = query.limit(Number(limit)); // Upewnij się, że limit jest liczbą
  }

  const exercises = await query;
  const mappedExercises = exercises.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString() 
  }));

  res.json({
    username: foundUser.username,
    count: mappedExercises.length,
    _id: userId,
    log: mappedExercises
  });
});



//The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added.

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  let { description, duration, date } = req.body;
  const foundUser = await User.findById(userId);

  if (!foundUser) {
    return res.status(404).json({ message: "No user exists for that id" });
  }

  if (!date) {
    date = new Date();
  } else {
    date = new Date(date);
  }

  const exercise = await Exercise.create({
    username: foundUser.username,
    description,
    duration,
    date, 
    userId
  });

  res.json({
    username: foundUser.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(), 
    _id: userId
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

