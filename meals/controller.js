const ObjectId = require('mongodb').ObjectId;

module.exports.readMeals = async (req, res, next) => {
  const data = await res.app.locals.db.collection('meals').find({ author: res.locals.user.sub }).toArray();

  res.locals.result = { data, user: res.locals.user };
  next();
};

module.exports.createMeal = async (req, res, next) => {
  const { ops } = await res.app.locals.db.collection('meals').insertOne({
    ...req.body,
    author: res.locals.user.sub
  });
  res.locals.result = ops.pop();
  next();
};

module.exports.updateMeal = async (req, res, next) => {
  const { value } = await res.app.locals.db.collection('meals').findOneAndReplace(
    {
      _id: ObjectId(req.query.id),
      author: res.locals.user.sub,
    },
    req.body,
    { returnOriginal: false }
  );

  if (!value) {
    return res.send({ error: 'Not Found' });
  }

  res.locals.result = value;
  next();
};

module.exports.deleteMeal = async (req, res, next) => {
  const { value } = await res.app.locals.db.collection('meals').findOneAndDelete({
    _id: ObjectId(req.query.id),
    author: res.locals.user.sub,
  });

  if (!value) {
    return res.send({ error: 'Not Found' });
  }

  res.locals.result = value;
  next();
};
