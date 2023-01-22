require('dotenv').config()
const { JWT_SECRET } = process.env;

const express = require('express')

const app = express()
const { PORT = 3000 } = process.env
const cors = require('cors')




const mongoose = require("mongoose");
const bodyParser = require('body-parser')


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const { Schema } = mongoose

const ExerciseSchema = mongoose.Schema({
  userId: { type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
})

const UserSchema = new Schema({
  username: String,
})

const User = mongoose.model('User', UserSchema);
const Exercise = mongoose.model('Exercise', ExerciseSchema);

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



app.post('/api/users', (req, res) => {
  console.log(`req.body`, req.body)
  const user = new User({
    username: req.body.username,
  })
  user.save((err,data) => {
    if (err || !data) {
      res,send(err)
    } else {
      res.json(data)
    }
  })
})


app.post('/api/users/:id/exercises', (req, res) => {
  const id = req.params.id
  const { description, duration, date } = req.body
  User.findById(id, (err, userData) => {
    if(err || !userData) {
      res.send(err)
    } else {
      const newExercise = new Exercise({
        userId: id,
        description,
        duration,
        date: new Date(date),
      })
      newExercise.save((err, data) => {
        if (err || !data) {
          res.send(err)
        } else {
          // Return the user object with the exercise fields added
          res.json({ ...userData._doc, exercises: [{ ...data._doc }] })
        }
      })
    }
  })
})

app.get('/api/users/:id/logs', (req, res) => {
  const { from, to, limit } = req.query
  const { id } = req.params
  User.findById(id, (err, userData) => {
    if(err || !userData) {
      res.send('error')
    } else {
      let dateObj = {}
      if(from) {
        dateObj["$gte"] = new Date(from)
      }
      if(to) {
        dateObj["$lte"] = new Date(to)
      }
      let filter = {
        userId: id
      }
      if(from || to){
        filter.date = dateObj
      }
      let nonNullLimit = limit ?? 500
      Exercise.find(filter).limit(+nonNullLimit).exec((err, data) => {
        if (err || !data) {
          res.json([])
        } else {
          // Return the user object with a count property representing the number of exercises
          const count = data.length
          // Return the user object with a log array of all the exercises added
          const log = data.map(exercise => ({
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString()
          }))
          res.json({
            ...userData._doc,
            count,
            log
          })
        }
      })
    }
  })
})


app.get('/api/users', (req, res) => {
  User.find({}, (err, data) => {
    if(!data){
      res.send("No users")
    }else{
      res.json(data)
    }
  })

})
app.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}`);
});
