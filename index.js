const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const PORT = process.env.PORT || 5000;

const checkToken = async (req, res, next) => {
  const { id_token } = req.query;

  if (!id_token) {
    return res.send({ error: 'No Token' });
  }

  try {
    const ticket = await clien2t.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    res.local = { ...res.local, user: await ticket.getPayload() };
    next();
  } catch {
    return res.send({ error: 'Invalid Token' });
  }
};

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
  const writeLog = (type, getPayload) => async (req, res, next) => {
    await db.collection('log').insertOne({
      date: Date.now(),
      user: res.local.user,
      type,
      payload: getPayload(req),
    });
    next();
  };
  const logger = {
    create: writeLog('create', (req) => ({ data: req.body })),
    update: writeLog('update', (req) => ({ id: req.query.id, data: req.body })),
    delete: writeLog('delete', (req) => ({ id: req.query.id })),
  };

  app.use('/read', checkToken);
  app.get('/read', async (req, res) => {
    const data = await db.collection('meals').find({ author: res.local.user.sub }).toArray();

    await res.send({ data, user: res.local.user });
  });

  app.use('/create', checkToken);
  app.post('/create', async (req, res, next) => {
    const { ops } = await db.collection('meals').insertOne({ ...req.body, author: res.local.user.sub });
    res.local.result = ops.pop();
    next();
  }, logger.create);

  app.use('/update', checkToken);
  app.use('/update', checkId);
  app.post('/update', async (req, res, next) => {
    const { value } = await db.collection('meals').findOneAndReplace(
      {
        _id: ObjectId(req.query.id),
        author: res.local.user.sub,
      },
      req.body,
      { returnOriginal: false }
    );

    if (!value) {
      return res.send({ error: 'Not Found' });
    }

    res.local.result = value;
    next();
  }, logger.update);

  app.use('/delete', checkToken);
  app.use('/delete', checkId);
  app.post('/delete', async (req, res) => {
    const { value } = await db.collection('meals').findOneAndDelete({
      _id: ObjectId(req.query.id),
      author: res.local.user.sub,
    });

    if (!value) {
      return res.send({ error: 'Not Found' });
    }

    res.local.result = value;
  }, logger.delete);

  app.use((req, res) => {
    const { result } = res.local;

    if (result) {
      res.send(result);
    }
  })
};

const url = process.env.MONGODB_URI;
const client = new MongoClient(url, { useUnifiedTopology: true });
const app = express();

const { OAuth2Client } = require('google-auth-library');
const clien2t = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json());
client.connect()
  .then(() => {
    routes(app, client.db());

    app.listen(PORT, () => {
      console.log(`started on ${PORT} port`);
    });
  })
  .catch(console.log);
