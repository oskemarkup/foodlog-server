const ObjectId = require('mongodb').ObjectId;
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

module.exports.checkToken = async (req, res, next) => {
  const { id_token } = req.query;

  if (!id_token) {
    return res.send({ error: 'No Token' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    res.locals = { ...res.locals, user: await ticket.getPayload() };
    next();
  } catch {
    return res.send({ error: 'Invalid Token' });
  }
};

module.exports.checkId = (req, res, next) => {
  const { id } = req.query;

  if (!id) {
    return res.send({ error: 'No Id' });
  } else if (!ObjectId.isValid(id)) {
    return res.send({ error: 'Invalid Id' });
  }

  next();
};

module.exports.writeLog = (type, getPayload) => async (req, res, next) => {
  await res.app.locals.db.collection('log').insertOne({
    date: Date.now(),
    user: res.locals.user,
    type,
    payload: getPayload(req),
  });
  next();
};