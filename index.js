const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const router = require('./meals/routes');
const log = require('./log');

const app = express();
const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });

app.use(cors());
app.use(express.json());
app.use('/log', log);
app.use(router);

client.connect()
  .then(() => {
    app.locals = { ...app.locals, db: client.db() };
    app.listen(PORT, () => {
      console.log(`started on ${PORT} port`);
    });
  })
  .catch(console.log);
