const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const PORT = process.env.PORT || 5000;

const checkId = (req, res, next) => {
  const { id } = req.query;

  if (!id) {
    return res.send({ error: 'No Id' });
  } else if (!ObjectId.isValid(id)) {
    return res.send({ error: 'Invalid Id' });
  }

  next();
};

const routes = (app, db) => {
  app.get('/read', async (req, res) => {
    const data = await db.collection('meals').find({ author: req.local.user.sub }).toArray();

    await res.send({ data, user: req.local.user });
  });

  app.post('/create', async (req, res) => {
    const { ops } = await db.collection('meals').insertOne({ ...req.body, author: req.local.user.sub });

    await res.send(ops.pop());
  });

  app.use('/update', checkId);
  app.post('/update', async (req, res) => {
    const { value } = await db.collection('meals').findOneAndReplace(
      {
        _id: ObjectId(req.query.id),
        author: req.local.user.sub,
      },
      req.body,
      { returnOriginal: false }
    );

    if (!value) {
      return res.send({ error: 'Not Found' });
    }

    await res.send(value);
  });

  app.use('/delete', checkId);
  app.post('/delete', async (req, res) => {
    const { value } = await db.collection('meals').findOneAndDelete({
      _id: ObjectId(req.query.id),
      author: req.local.user.sub,
    });

    if (!value) {
      return res.send({ error: 'Not Found' });
    }

    await res.send(value);
  });
};

const url = process.env.MONGODB_URI;
const client = new MongoClient(url, { useUnifiedTopology: true });
const app = express();

const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = '541301727496-8v8snacmlj9pub2ojvi3ksbkepbl4okl.apps.googleusercontent.com';
const clien2t = new OAuth2Client(CLIENT_ID);

app.use(cors());
app.use(express.json());
app.use(async (req, res, next) => {
  const { id_token } = req.query;

  if (!id_token) {
    return res.send({ error: 'No Token' })
  }

  try {
    const ticket = await clien2t.verifyIdToken({
      idToken: id_token,
      audience: CLIENT_ID,
    });

    req.local = {user: await ticket.getPayload()};
    next();
  } catch {
    return res.send({ error: 'Invalid Token' })
  }
});
client.connect()
  .then(() => {
    routes(app, client.db());

    app.listen(PORT, () => {
      console.log(`started on ${PORT} port`);
    });
  })
  .catch(console.log);
