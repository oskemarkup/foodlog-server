const PAGE_SIZE = 4;
const router = require('express').Router();
const basicAuth = require('express-basic-auth');

router.use(basicAuth({
  users: { 'admin': process.env.LOG_SECRET },
  challenge: true,
}));

router.get('/:page?', async(req, res) => {
  const page = req.params.page || 0;
  const query = await res.app.locals.db.collection('log').find({});
  const count = await query.count();
  const data = await query.skip(PAGE_SIZE * page).limit(PAGE_SIZE).toArray();

  res.render('log.ejs', { data, page, pages: Math.ceil(count / PAGE_SIZE), baseUrl: req.baseUrl });
});

module.exports = router;
